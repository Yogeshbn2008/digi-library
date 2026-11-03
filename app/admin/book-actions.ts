"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const EDITABLE_STATUSES = ["available", "lost", "unverified"];

function readBook(formData: FormData) {
  return {
    bookCode: String(formData.get("book_code") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim() || null,
    genre: String(formData.get("genre") ?? "").trim(),
    isbn: String(formData.get("isbn") ?? "").trim() || null,
    remarks: String(formData.get("remarks") ?? "").trim() || null,
  };
}

function validate(b: ReturnType<typeof readBook>): string | null {
  if (!b.bookCode || !b.title || !b.genre) {
    return "Book code, title and category are required.";
  }
  if (b.bookCode.length > 30) return "Book code must be 30 characters or fewer.";
  if (b.title.length > 255 || (b.author && b.author.length > 255)) {
    return "Title and author must be 255 characters or fewer.";
  }
  if (b.genre.length > 100) return "Category must be 100 characters or fewer.";
  if (b.isbn && b.isbn.length > 20) return "ISBN must be 20 characters or fewer.";
  if (b.remarks && b.remarks.length > 255) {
    return "Remarks must be 255 characters or fewer.";
  }
  return null;
}

function hasCode(err: unknown, code: string) {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === code
  );
}

const to = (path: string, key: "msg" | "error", text: string) =>
  `${path}?${key}=${encodeURIComponent(text)}`;

export async function addBook(formData: FormData) {
  await requireAdmin();
  const book = readBook(formData);

  const problem = validate(book);
  if (problem) redirect(to("/admin", "error", problem));

  try {
    await pool.query(
      `INSERT INTO books (book_code, title, author, genre, isbn, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [book.bookCode, book.title, book.author, book.genre, book.isbn, book.remarks]
    );
  } catch (err) {
    if (hasCode(err, "ER_DUP_ENTRY")) {
      redirect(to("/admin", "error", "A book with that code already exists."));
    }
    throw err;
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(to("/admin", "msg", "Book added."));
}

export async function updateBook(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const editPath = `/admin/books/${id}/edit`;
  if (!Number.isInteger(id) || id <= 0) redirect("/admin");

  const book = readBook(formData);
  const problem = validate(book);
  if (problem) redirect(to(editPath, "error", problem));

  // The status box is not shown for borrowed books, so it may be missing
  const statusRaw = String(formData.get("status") ?? "").trim();
  if (statusRaw && !EDITABLE_STATUSES.includes(statusRaw)) {
    redirect(to(editPath, "error", "Invalid status."));
  }
  const status = statusRaw || null;

  try {
    // A borrowed book keeps its status; only return/issue can change that
    await pool.query(
      `UPDATE books
       SET book_code = ?, title = ?, author = ?, genre = ?, isbn = ?, remarks = ?,
           status = IF(status = 'borrowed', status, COALESCE(?, status))
       WHERE id = ?`,
      [book.bookCode, book.title, book.author, book.genre, book.isbn, book.remarks, status, id]
    );
  } catch (err) {
    if (hasCode(err, "ER_DUP_ENTRY")) {
      redirect(to(editPath, "error", "Another book already uses that code."));
    }
    throw err;
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(to("/admin", "msg", "Book updated."));
}

export async function deleteBook(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin");

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT status FROM books WHERE id = ?",
    [id]
  );
  if (rows[0]?.status === "borrowed") {
    redirect(to("/admin", "error", "This book is currently borrowed. Return it before deleting."));
  }

  try {
    await pool.query("DELETE FROM books WHERE id = ?", [id]);
  } catch (err) {
    if (hasCode(err, "ER_ROW_IS_REFERENCED_2")) {
      redirect(to("/admin", "error", "This book has loan history, so it can't be deleted."));
    }
    throw err;
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(to("/admin", "msg", "Book deleted."));
}