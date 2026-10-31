import { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { todayIST } from "./dates";

export interface AdminBook extends RowDataPacket {
  id: number;
  title: string;
  author: string| null;
  genre: string;
  status: "available" | "borrowed" | "lost" | "unverified";
  due_date: Date | null;
  borrower_name: string | null;
  registration_no: string | null;
  book_code: string | null;
}

const SELECT = `
  SELECT b.id, b.title, b.author, b.genre, b.status, b.due_date,
         l.borrower_name, l.registration_no
  FROM books b
  LEFT JOIN loans l ON l.book_id = b.id AND l.return_date IS NULL
`;

export async function getAdminBooks() {
  const [rows] = await pool.query<AdminBook[]>(`${SELECT} ORDER BY b.title`);
  return rows;
}

export async function getOverdue() {
  const [rows] = await pool.query<AdminBook[]>(
    `${SELECT} WHERE b.status = 'borrowed' AND b.due_date < ? ORDER BY b.due_date`,
    [todayIST()]
  );
  return rows;
}

export async function searchAdminBooks({
  q,
  page = 1,
  pageSize = 30,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const params: (string | number)[] = [];
  let where = "";
  if (q) {
    where = `WHERE (b.title LIKE ? OR b.author LIKE ? OR b.book_code LIKE ?
                    OR l.borrower_name LIKE ? OR l.registration_no LIKE ?)`;
    params.push(...Array(5).fill(`%${q}%`));
  }

  const from = `FROM books b
                LEFT JOIN loans l ON l.book_id = b.id AND l.return_date IS NULL
                ${where}`;

  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total ${from}`,
    params
  );
  const total = Number(countRows[0].total);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);

  const [books] = await pool.query<AdminBook[]>(
    `SELECT b.id, b.book_code, b.title, b.author, b.genre, b.status, b.due_date,
            l.borrower_name, l.registration_no
     ${from} ORDER BY b.title LIMIT ? OFFSET ?`,
    [...params, pageSize, (current - 1) * pageSize]
  );
  return { books, total, page: current, pages };
}