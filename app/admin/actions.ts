"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { clientIp } from "@/lib/client-ip";
import { createSession, destroySession, getCurrentAdmin } from "@/lib/auth";
import { destroyStudentSession } from "@/lib/student-auth";
import { isBlocked, recordAttempt, clearFailures } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";

// Used when the username does not exist, so a wrong username takes the
// same time as a wrong password and does not reveal which usernames exist
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const back = (error: string) => `/login?as=committee&error=${error}`;

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 50);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const ip = await clientIp();

  if (await isBlocked(username, ip)) {
    await logAction(null, "login.blocked", username, ip);
    redirect(back("locked"));
  }

  const [rows] = await pool.query<
    (RowDataPacket & { id: number; password_hash: string })[]
  >("SELECT id, password_hash FROM admins WHERE username = ? AND is_active = 1", [
    username,
  ]);

  const admin = rows[0];
  const ok = await bcrypt.compare(password, admin ? admin.password_hash : DUMMY_HASH);

  if (!admin || !ok) {
    await recordAttempt(username, ip, false);
    await logAction(null, "login.failed", username, ip);
    redirect(back("1"));
  }

  await recordAttempt(username, ip, true);
  await clearFailures(username);
  await destroyStudentSession(); // one role at a time in this browser
  await createSession(admin.id);
  await logAction({ id: admin.id, username }, "login", null, ip);
  redirect("/admin");
}

export async function logout() {
  const me = await getCurrentAdmin();
  if (me) await logAction(me, "logout");
  await destroySession();
  redirect("/login?as=committee");
}