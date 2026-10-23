"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const [rows] = await pool.query<
    (RowDataPacket & { id: number; password_hash: string })[]
  >("SELECT id, password_hash FROM admins WHERE username = ? AND is_active = 1", [
    username,
  ]);

  const admin = rows[0];
  const ok = admin ? await bcrypt.compare(password, admin.password_hash) : false;

  if (!admin || !ok) {
    redirect("/admin/login?error=1");
  }

  await createSession(admin.id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}