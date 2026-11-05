import { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { todayIST, addDays } from "./dates";

export const LOAN_FILTERS = ["all", "open", "returned", "overdue"] as const;
export type LoanFilter = (typeof LOAN_FILTERS)[number];

export interface LoanRow extends RowDataPacket {
  id: number;
  book_code: string | null;
  title: string;
  borrower_name: string;
  registration_no: string;
  issue_date: Date;
  due_date: Date;
  return_date: Date | null;
  issued_by: string | null;
}

export async function searchLoans({
  q,
  filter = "all",
  page = 1,
  pageSize = 30,
}: {
  q?: string;
  filter?: LoanFilter;
  page?: number;
  pageSize?: number;
}) {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (q) {
    conditions.push(
      `(b.title LIKE ? OR b.book_code LIKE ? OR l.borrower_name LIKE ? OR l.registration_no LIKE ?)`
    );
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (filter === "open") conditions.push("l.return_date IS NULL");
  if (filter === "returned") conditions.push("l.return_date IS NOT NULL");
  if (filter === "overdue") {
    conditions.push("l.return_date IS NULL AND l.due_date < ?");
    params.push(todayIST());
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const from = `FROM loans l JOIN books b ON b.id = l.book_id ${where}`;

  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total ${from}`,
    params
  );
  const total = Number(countRows[0].total);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);

  const [loans] = await pool.query<LoanRow[]>(
    `SELECT l.id, b.book_code, b.title, l.borrower_name, l.registration_no,
            l.issue_date, l.due_date, l.return_date, a.username AS issued_by
     FROM loans l
     JOIN books b ON b.id = l.book_id
     LEFT JOIN admins a ON a.id = l.issued_by
     ${where}
     ORDER BY l.issue_date DESC, l.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, (current - 1) * pageSize]
  );

  return { loans, total, page: current, pages };
}

export async function getSummary() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM books) AS total_books,
       (SELECT COUNT(*) FROM books WHERE status = 'borrowed') AS borrowed,
       (SELECT COUNT(*) FROM books WHERE status = 'lost') AS lost,
       (SELECT COUNT(*) FROM books WHERE status = 'unverified') AS unverified,
       (SELECT COUNT(*) FROM loans) AS total_loans`
  );
  const r = rows[0];
  return {
    totalBooks: Number(r.total_books),
    borrowed: Number(r.borrowed),
    lost: Number(r.lost),
    unverified: Number(r.unverified),
    totalLoans: Number(r.total_loans),
  };
}

export async function getMostBorrowed() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.book_code, b.title, COUNT(*) AS times_borrowed
     FROM loans l
     JOIN books b ON b.id = l.book_id
     GROUP BY b.id, b.book_code, b.title
     ORDER BY times_borrowed DESC, b.title
     LIMIT 10`
  );
  return rows;
}

export async function getLoansByCategory() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.genre, COUNT(*) AS loans
     FROM loans l
     JOIN books b ON b.id = l.book_id
     GROUP BY b.genre
     ORDER BY loans DESC, b.genre`
  );
  return rows;
}

export async function getLoansPerMonth() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(issue_date, '%Y-%m') AS ym, COUNT(*) AS loans
     FROM loans
     WHERE issue_date >= ?
     GROUP BY ym
     ORDER BY ym DESC`,
    [addDays(todayIST(), -180)]
  );
  return rows;
}