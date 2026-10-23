import { RowDataPacket } from "mysql2";
import { pool } from "./db";

export interface Book extends RowDataPacket {
  id: number;
  title: string;
  author: string;
  genre: string;
  isbn: string | null;
  status: "available" | "borrowed";
  due_date: Date | null;
}

export async function getBooks({ q, genre }: { q?: string; genre?: string }) {
  const conditions: string[] = [];
  const params: string[] = [];

  if (genre) {
    conditions.push("genre = ?");
    params.push(genre);
  }
  if (q) {
    conditions.push("(title LIKE ? OR author LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query<Book[]>(
    `SELECT * FROM books ${where} ORDER BY title`,
    params
  );
  return rows;
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