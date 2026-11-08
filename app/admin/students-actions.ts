"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAction } from "@/lib/audit";

const ALLOWED = ["approved", "rejected", "blocked"];

const to = (key: "msg" | "error", text: string) =>
  `/admin/students?${key}=${encodeURIComponent(text)}`;

async function findStudent(id: number) {
  const [rows] = await pool.query<
    (RowDataPacket & { registration_no: string; name: string })[]
  >("SELECT registration_no, name FROM students WHERE id = ?", [id]);
  return rows[0] ?? null;
}

export async function setStudentStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(id) || id <= 0 || !ALLOWED.includes(status)) {
    redirect("/admin/students");
  }

  const student = await findStudent(id);
  if (!student) redirect(to("error", "Student not found."));

  await pool.query(
    "UPDATE students SET status = ?, decided_at = NOW(), decided_by = ? WHERE id = ?",
    [status, admin.username, id]
  );
  // Anything other than approved logs the student out of every device
  if (status !== "approved") {
    await pool.query("DELETE FROM student_sessions WHERE student_id = ?", [id]);
  }

  await logAction(admin, `student.${status}`, student.registration_no, student.name);
  revalidatePath("/admin/students");
  redirect(to("msg", `${student.name}: ${status}.`));
}

export async function resetStudentPassword(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/students");

  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    redirect(to("error", "New password must be 8 to 72 characters."));
  }
  const student = await findStudent(id);
  if (!student) redirect(to("error", "Student not found."));

  const hash = await bcrypt.hash(password, 10);
  await pool.query("UPDATE students SET password_hash = ? WHERE id = ?", [hash, id]);
  await pool.query("DELETE FROM student_sessions WHERE student_id = ?", [id]);

  await logAction(admin, "student.reset_password", student.registration_no, student.name);
  redirect(to("msg", `Password reset for ${student.name}. Tell them the new password in person.`));
}