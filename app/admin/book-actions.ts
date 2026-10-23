"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function readBook(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim(),
    genre: String(formData.get("genre") ?? "").trim(),
    isbn: String(formData.get("isbn") ?? "").trim() || null,
  };
}

function validate(b: ReturnType<typeof readBook>): string | null {
  if (!b.title || !b.author || !b.genre) {
    return "Title, author and genre are required.";
  }
  if (b.title.length > 255 || b.author.length > 255) {
    return "Title and author must be 255 characters or fewer.";
  }
  if (b.genre.length > 100) return "Genre must be 100 characters or fewer.";
  if (b.isbn && b.isbn.length > 20) return "ISBN must be 20 characters or fewer.";
  return null;
}

function hasCode(err: unknown, code: string) {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === code;
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
      "INSERT INTO books (title, author, genre, isbn) VALUES (?, ?, ?, ?)",
      [book.title, book.author, book.genre, book.isbn]
    );
  } catch (err) {
    if (hasCode(err, "ER_DUP_ENTRY")) {
      redirect(to("/admin", "error", "That book (same title and author) already exists."));
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

  try {
    await pool.query(
      "UPDATE books SET title = ?, author = ?, genre = ?, isbn = ? WHERE id = ?",
      [book.title, book.author, book.genre, book.isbn, id]
    );
  } catch (err) {
    if (hasCode(err, "ER_DUP_ENTRY")) {
      redirect(to(editPath, "error", "Another book with the same title and author already exists."));
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