"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { createSession, destroySession, getCurrentAdmin } from "@/lib/auth";
import { isBlocked, recordAttempt, clearFailures } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";

// Used when the username does not exist, so a wrong username takes the
// same time as a wrong password and does not reveal which usernames exist
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown";
  return ip.trim().slice(0, 45);
}

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 50);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const ip = await clientIp();

  if (await isBlocked(username, ip)) {
    await logAction(null, "login.blocked", username, ip);
    redirect("/admin/login?error=locked");
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
    redirect("/admin/login?error=1");
  }

  await recordAttempt(username, ip, true);
  await clearFailures(username);
  await createSession(admin.id);
  await logAction({ id: admin.id, username }, "login", null, ip);
  redirect("/admin");
}

export async function logout() {
  const me = await getCurrentAdmin();
  if (me) await logAction(me, "logout");
  await destroySession();
  redirect("/admin/login");
}