"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { clientIp } from "@/lib/client-ip";
import { isBlocked, recordAttempt, clearFailures } from "@/lib/rate-limit";
import { createStudentSession, destroyStudentSession } from "@/lib/student-auth";

const REG_PATTERN = /^[A-Za-z0-9._/-]{2,30}$/;
const REQUESTS_PER_IP_PER_HOUR = 30;
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const toRegister = (text: string) => `/register?error=${encodeURIComponent(text)}`;

function hasCode(err: unknown, code: string) {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === code
  );
}

export async function registerStudent(formData: FormData) {
  const reg = String(formData.get("registration_no") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!REG_PATTERN.test(reg)) {
    redirect(toRegister("Enter your registration number (letters, numbers, . - / only)."));
  }
  if (!name || name.length > 100) redirect(toRegister("Enter your full name."));
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    redirect(toRegister("Password must be 8 to 72 characters."));
  }
  if (password !== confirm) redirect(toRegister("The two passwords do not match."));

  const ip = await clientIp();

  // Stop one source flooding the committee with requests
  const [recent] = await pool.query<(RowDataPacket & { n: number })[]>(
    `SELECT COUNT(*) AS n FROM students
     WHERE created_ip = ? AND created_at >= NOW() - INTERVAL 1 HOUR`,
    [ip]
  );
  if (Number(recent[0].n) >= REQUESTS_PER_IP_PER_HOUR) {
    redirect(toRegister("Too many requests from this network. Please try again later."));
  }

  const hash = await bcrypt.hash(password, 10);

  const [rows] = await pool.query<(RowDataPacket & { id: number; status: string })[]>(
    "SELECT id, status FROM students WHERE registration_no = ?",
    [reg]
  );
  const existing = rows[0];

  if (existing) {
    if (existing.status === "rejected") {
      // A rejected student may ask again
      await pool.query(
        `UPDATE students
         SET name = ?, password_hash = ?, status = 'pending', created_ip = ?,
             created_at = NOW(), decided_at = NULL, decided_by = NULL
         WHERE id = ?`,
        [name, hash, ip, existing.id]
      );
      redirect("/login?msg=" + encodeURIComponent("Request sent again. You can log in once the committee approves it."));
    }
    if (existing.status === "pending") {
      redirect(toRegister("A request for this registration number is already waiting for approval."));
    }
    if (existing.status === "approved") {
      redirect(toRegister("This registration number already has an account. Please log in."));
    }
    redirect(toRegister("This account is blocked. Please contact the committee."));
  }

  try {
    await pool.query(
      `INSERT INTO students (registration_no, name, password_hash, created_ip)
       VALUES (?, ?, ?, ?)`,
      [reg, name, hash, ip]
    );
  } catch (err) {
    if (hasCode(err, "ER_DUP_ENTRY")) {
      redirect(toRegister("A request for this registration number already exists."));
    }
    throw err;
  }

  redirect("/login?msg=" + encodeURIComponent("Request sent. You can log in once the committee approves it."));
}

export async function loginStudent(formData: FormData) {
  const reg = String(formData.get("registration_no") ?? "").trim().slice(0, 30);
  const password = String(formData.get("password") ?? "").slice(0, 200);

  const ip = await clientIp();
  // Separate counters so student typos can never lock out the admin login
  const key = `s:${reg.toLowerCase()}`.slice(0, 50);
  const ipKey = `student:${ip}`.slice(0, 45);

  if (await isBlocked(key, ipKey, 200)) redirect("/login?error=locked");

  const [rows] = await pool.query<
    (RowDataPacket & { id: number; password_hash: string; status: string })[]
  >("SELECT id, password_hash, status FROM students WHERE registration_no = ?", [reg]);
  const student = rows[0];

  const ok = await bcrypt.compare(password, student ? student.password_hash : DUMMY_HASH);
  if (!student || !ok) {
    await recordAttempt(key, ipKey, false);
    redirect("/login?error=1");
  }

  // The status is revealed only after the password is proven correct
  if (student.status !== "approved") {
    redirect(`/login?error=${student.status}`);
  }

  await recordAttempt(key, ipKey, true);
  await clearFailures(key);
  await createStudentSession(student.id);
  await pool.query("UPDATE students SET last_login_at = NOW() WHERE id = ?", [student.id]);
  redirect("/my-books");
}

export async function logoutStudent() {
  await destroyStudentSession();
  redirect("/");
}