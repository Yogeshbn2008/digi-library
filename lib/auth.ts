import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function createSession(adminId: number) {
  const sessionId = randomBytes(32).toString("hex"); // 64 characters

  // Only one active session across all admins
  await pool.query("UPDATE admins SET active_session_id = NULL");
  await pool.query("UPDATE admins SET active_session_id = ? WHERE id = ?", [
    sessionId,
    adminId,
  ]);

  const store = await cookies();
  store.set(COOKIE_NAME, `${adminId}.${sessionId}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getCurrentAdmin() {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return null;

  const [idStr, sessionId] = value.split(".");
  const id = Number(idStr);
  if (!id || !sessionId) return null;

  const [rows] = await pool.query<
    (RowDataPacket & { id: number; name: string; username: string })[]
  >(
    "SELECT id, name, username FROM admins WHERE id = ? AND active_session_id = ? AND is_active = 1",
    [id, sessionId]
  );
  return rows[0] ?? null;
}

export async function destroySession() {
  const admin = await getCurrentAdmin();
  if (admin) {
    await pool.query("UPDATE admins SET active_session_id = NULL WHERE id = ?", [
      admin.id,
    ]);
  }
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}