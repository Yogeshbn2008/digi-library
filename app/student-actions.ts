"use server";

import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { clientIp } from "@/lib/client-ip";
import { isBlocked, recordAttempt, clearFailures } from "@/lib/rate-limit";
import { destroySession } from "@/lib/auth";
import {
  createStudentSession,
  destroyStudentSession,
  destroyOtherStudentSessions,
  requireStudent,
} from "@/lib/student-auth";

const REG_PATTERN = /^[A-Za-z0-9._/-]{2,30}$/;
const ROOM_PATTERN = /^[A-Za-z0-9 ./-]{1,10}$/;
const REQUESTS_PER_IP_PER_HOUR = 30;
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const toRegister = (text: string) => `/register?error=${encodeURIComponent(text)}`;
const toProfile = (key: "msg" | "error", text: string) =>
  `/profile?${key}=${encodeURIComponent(text)}`;

function codeMatches(given: string, expected: string) {
  const a = createHash("sha256").update(given.trim().toLowerCase()).digest();
  const b = createHash("sha256").update(expected.trim().toLowerCase()).digest();
  return timingSafeEqual(a, b);
}

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
  const room = String(formData.get("room_no") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const expectedCode = process.env.JOIN_CODE;
  if (expectedCode) {
    const given = String(formData.get("join_code") ?? "");
    if (!codeMatches(given, expectedCode)) {
      redirect(toRegister("The hostel code is not correct. Ask the committee for it."));
    }
  }

  if (!REG_PATTERN.test(reg)) {
    redirect(toRegister("Enter your registration number (letters, numbers, . - / only)."));
  }
  if (!name || name.length > 100) redirect(toRegister("Enter your full name."));
  if (!ROOM_PATTERN.test(room)) {
    redirect(toRegister("Enter your room number (for example B-214)."));
  }
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
         SET name = ?, room_no = ?, password_hash = ?, status = 'pending', created_ip = ?,
             created_at = NOW(), decided_at = NULL, decided_by = NULL
         WHERE id = ?`,
        [name, room, hash, ip, existing.id]
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
      `INSERT INTO students (registration_no, name, room_no, password_hash, created_ip)
       VALUES (?, ?, ?, ?, ?)`,
      [reg, name, room, hash, ip]
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
  await destroySession(); // one role at a time: log out any admin in this browser
  await pool.query("UPDATE students SET last_login_at = NOW() WHERE id = ?", [student.id]);
  redirect("/my-books");
}

export async function logoutStudent() {
  await destroyStudentSession();
  redirect("/");
}

export async function updateRoom(formData: FormData) {
  const student = await requireStudent();
  const room = String(formData.get("room_no") ?? "").trim();

  if (!ROOM_PATTERN.test(room)) {
    redirect(toProfile("error", "Enter a valid room number (for example B-214)."));
  }
  await pool.query("UPDATE students SET room_no = ? WHERE id = ?", [room, student.id]);

  revalidatePath("/profile");
  redirect(toProfile("msg", "Room number updated."));
}

export async function changeStudentPassword(formData: FormData) {
  const student = await requireStudent();

  const current = String(formData.get("current") ?? "").slice(0, 200);
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  // Same counters as the student login, so guessing here is limited too
  const ip = await clientIp();
  const key = `s:${student.registration_no.toLowerCase()}`.slice(0, 50);
  const ipKey = `student:${ip}`.slice(0, 45);

  if (await isBlocked(key, ipKey, 200)) {
    redirect(toProfile("error", "Too many failed attempts. Please wait 15 minutes and try again."));
  }

  const [rows] = await pool.query<(RowDataPacket & { password_hash: string })[]>(
    "SELECT password_hash FROM students WHERE id = ?",
    [student.id]
  );
  const ok = rows[0] ? await bcrypt.compare(current, rows[0].password_hash) : false;
  if (!ok) {
    await recordAttempt(key, ipKey, false);
    redirect(toProfile("error", "Your current password is not correct."));
  }

  if (next.length < 8 || Buffer.byteLength(next, "utf8") > 72) {
    redirect(toProfile("error", "New password must be 8 to 72 characters."));
  }
  if (next !== confirm) redirect(toProfile("error", "The two new passwords do not match."));
  if (next === current) redirect(toProfile("error", "The new password must be different."));

  const hash = await bcrypt.hash(next, 10);
  await pool.query("UPDATE students SET password_hash = ? WHERE id = ?", [hash, student.id]);
  await destroyOtherStudentSessions(student.id);
  await clearFailures(key);

  redirect(toProfile("msg", "Password changed. Your other devices were logged out."));
}