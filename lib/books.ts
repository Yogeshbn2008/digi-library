import { RowDataPacket } from "mysql2";
import { pool } from "./db";

export interface Book extends RowDataPacket {
  id: number;
  book_code: string | null;
  title: string;
  author: string | null;
  genre: string;
  isbn: string | null;
  price: string | null;
  donated: number;
  remarks: string | null;
  status: "available" | "borrowed" | "lost" | "unverified";
  due_date: Date | null;
}

function buildWhere(q?: string, genre?: string) {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (genre) {
    conditions.push("genre = ?");
    params.push(genre);
  }
  if (q) {
    conditions.push("(title LIKE ? OR author LIKE ? OR book_code LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

// Used by the JSON API: every matching book
export async function getBooks({ q, genre }: { q?: string; genre?: string }) {
  const { where, params } = buildWhere(q, genre);
  const [rows] = await pool.query<Book[]>(
    `SELECT * FROM books ${where} ORDER BY title`,
    params
  );
  return rows;
}

// Used by the public page: one page of results plus the total count
export async function searchBooks({
  q,
  genre,
  page = 1,
  pageSize = 25,
}: {
  q?: string;
  genre?: string;
  page?: number;
  pageSize?: number;
}) {
  const { where, params } = buildWhere(q, genre);

  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM books ${where}`,
    params
  );
  const total = Number(countRows[0].total);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);

  const [books] = await pool.query<Book[]>(
    `SELECT * FROM books ${where} ORDER BY title LIMIT ? OFFSET ?`,
    [...params, pageSize, (current - 1) * pageSize]
  );
  return { books, total, page: current, pages };
}

export async function getGenres() {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT DISTINCT genre FROM books ORDER BY genre"
  );
  return rows.map((r) => r.genre as string);
}

export async function getBookById(id: number) {
  const [rows] = await pool.query<Book[]>("SELECT * FROM books WHERE id = ?", [
    id,
  ]);
  return rows[0] ?? null;
}