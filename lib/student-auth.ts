import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { getCurrentAdmin } from "./auth";

const COOKIE_NAME = "student_session";
const SESSION_DAYS = 30;

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export interface Student extends RowDataPacket {
  id: number;
  name: string;
  registration_no: string;
}

export async function createStudentSession(studentId: number) {
  const token = randomBytes(32).toString("hex");

  // Only the hash is stored, so a leaked database cannot be used to log in
  await pool.query(
    `INSERT INTO student_sessions (student_id, token_hash, expires_at)
     VALUES (?, ?, NOW() + INTERVAL ${SESSION_DAYS} DAY)`,
    [studentId, sha256(token)]
  );
  if (Math.random() < 0.02) {
    await pool.query("DELETE FROM student_sessions WHERE expires_at < NOW()");
  }

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getCurrentStudent() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [rows] = await pool.query<Student[]>(
    `SELECT s.id, s.name, s.registration_no
     FROM student_sessions ss
     JOIN students s ON s.id = ss.student_id
     WHERE ss.token_hash = ? AND ss.expires_at > NOW() AND s.status = 'approved'`,
    [sha256(token)]
  );
  return rows[0] ?? null;
}

export async function requireStudent() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  return student;
}

export async function destroyStudentSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await pool.query("DELETE FROM student_sessions WHERE token_hash = ?", [
      sha256(token),
    ]);
  }
  store.delete(COOKIE_NAME);
}

// Public by default. When REQUIRE_STUDENT_LOGIN=true, only approved
// students and admins may view the catalog.
// Secure by default: the catalog needs a login unless PUBLIC_CATALOG=true
export async function canViewCatalog() {
  if (process.env.PUBLIC_CATALOG === "true") return true;
  if (await getCurrentStudent()) return true;
  return Boolean(await getCurrentAdmin());
}

export interface StudentLoan extends RowDataPacket {
  id: number;
  book_code: string | null;
  title: string;
  issue_date: Date;
  due_date: Date;
  return_date: Date | null;
}

export async function getStudentLoans(registrationNo: string) {
  const [rows] = await pool.query<StudentLoan[]>(
    `SELECT l.id, b.book_code, b.title, l.issue_date, l.due_date, l.return_date
     FROM loans l
     JOIN books b ON b.id = l.book_id
     WHERE l.registration_no = ?
     ORDER BY l.issue_date DESC, l.id DESC
     LIMIT 200`,
    [registrationNo]
  );
  return rows;
}

// Log the student out everywhere except the browser making this request
export async function destroyOtherStudentSessions(studentId: number) {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return;

  await pool.query(
    "DELETE FROM student_sessions WHERE student_id = ? AND token_hash <> ?",
    [studentId, sha256(token)]
  );
}