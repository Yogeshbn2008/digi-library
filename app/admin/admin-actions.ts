"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const to = (key: "msg" | "error", text: string) =>
  `/admin/admins?${key}=${encodeURIComponent(text)}`;

function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters.";
  // bcrypt only uses the first 72 bytes, so longer passwords are refused
  if (Buffer.byteLength(pw, "utf8") > 72) return "Password is too long (72 bytes maximum).";
  return null;
}

function hasCode(err: unknown, code: string) {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === code
  );
}

export async function addAdmin(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!name || name.length > 100) {
    redirect(to("error", "Enter a name (100 characters or fewer)."));
  }
  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    redirect(to("error", "Username must be 3-50 characters: letters, numbers, dot, dash or underscore."));
  }
  const problem = passwordProblem(password);
  if (problem) redirect(to("error", problem));
  if (password !== confirm) redirect(to("error", "The two passwords do not match."));

  const hash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO admins (name, username, password_hash) VALUES (?, ?, ?)",
      [name, username, hash]
    );
  } catch (err) {
    if (hasCode(err, "ER_DUP_ENTRY")) {
      redirect(to("error", "That username is already taken."));
    }
    throw err;
  }

  revalidatePath("/admin/admins");
  redirect(to("msg", `Admin "${username}" added.`));
}

export async function changeOwnPassword(formData: FormData) {
  const me = await requireAdmin();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const [rows] = await pool.query<(RowDataPacket & { password_hash: string })[]>(
    "SELECT password_hash FROM admins WHERE id = ?",
    [me.id]
  );
  const ok = rows[0] ? await bcrypt.compare(current, rows[0].password_hash) : false;
  if (!ok) redirect(to("error", "Your current password is incorrect."));

  const problem = passwordProblem(next);
  if (problem) redirect(to("error", problem));
  if (next !== confirm) redirect(to("error", "The two new passwords do not match."));
  if (next === current) redirect(to("error", "The new password must be different."));

  const hash = await bcrypt.hash(next, 10);
  await pool.query("UPDATE admins SET password_hash = ? WHERE id = ?", [hash, me.id]);

  redirect(to("msg", "Password changed."));
}

export async function setAdminActive(formData: FormData) {
  const me = await requireAdmin();

  const id = Number(formData.get("id"));
  const active = Number(formData.get("active")) === 1 ? 1 : 0;
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/admins");

  if (id === me.id) {
    redirect(to("error", "You can't deactivate your own account."));
  }

  // Deactivating also clears the session, so that person is logged out at once
  await pool.query(
    `UPDATE admins
     SET is_active = ?,
         active_session_id = CASE WHEN ? = 0 THEN NULL ELSE active_session_id END
     WHERE id = ?`,
    [active, active, id]
  );

  revalidatePath("/admin/admins");
  redirect(to("msg", active ? "Admin reactivated." : "Admin deactivated."));
}