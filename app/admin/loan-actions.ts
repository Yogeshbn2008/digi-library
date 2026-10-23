"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ResultSetHeader } from "mysql2";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { todayIST, addDays } from "@/lib/dates";

const to = (path: string, key: "msg" | "error", text: string) =>
  `${path}?${key}=${encodeURIComponent(text)}`;

export async function issueBook(formData: FormData) {
  const admin = await requireAdmin();

  const bookId = Number(formData.get("bookId"));
  const name = String(formData.get("borrowerName") ?? "").trim();
  const regNo = String(formData.get("registrationNo") ?? "").trim();
  const due = String(formData.get("dueDate") ?? "");
  const issuePath = `/admin/books/${bookId}/issue`;

  if (!Number.isInteger(bookId) || bookId <= 0) redirect("/admin");
  if (!name || !regNo) redirect(to(issuePath, "error", "Borrower name and registration number are required."));
  if (name.length > 100 || regNo.length > 30) redirect(to(issuePath, "error", "Name or registration number is too long."));

  const today = todayIST();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || due < today || due > addDays(today, 90)) {
    redirect(to(issuePath, "error", "Choose a due date from today up to 90 days ahead."));
  }

  let problem: string | null = null;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Only succeeds if the book is still available at this exact moment
    const [res] = await conn.query<ResultSetHeader>(
      "UPDATE books SET status = 'borrowed', due_date = ? WHERE id = ? AND status = 'available'",
      [due, bookId]
    );

    if (res.affectedRows !== 1) {
      await conn.rollback();
      problem = "This book is not available (it may have just been issued).";
    } else {
      await conn.query(
        `INSERT INTO loans (book_id, borrower_name, registration_no, issue_date, due_date, issued_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bookId, name, regNo, today, due, admin.id]
      );
      await conn.commit();
    }
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  if (problem) redirect(to("/admin", "error", problem));

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(to("/admin", "msg", "Book issued."));
}

export async function returnBook(formData: FormData) {
  await requireAdmin();

  const bookId = Number(formData.get("bookId"));
  if (!Number.isInteger(bookId) || bookId <= 0) redirect("/admin");

  let problem: string | null = null;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "UPDATE loans SET return_date = ? WHERE book_id = ? AND return_date IS NULL",
      [todayIST(), bookId]
    );
    const [res] = await conn.query<ResultSetHeader>(
      "UPDATE books SET status = 'available', due_date = NULL WHERE id = ? AND status = 'borrowed'",
      [bookId]
    );

    if (res.affectedRows !== 1) {
      await conn.rollback();
      problem = "This book is not currently borrowed.";
    } else {
      await conn.commit();
    }
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  if (problem) redirect(to("/admin", "error", problem));

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(to("/admin", "msg", "Book returned."));
}