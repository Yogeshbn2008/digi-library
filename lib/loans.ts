import { RowDataPacket } from "mysql2";
import { pool } from "./db";
import { todayIST } from "./dates";

export interface AdminBook extends RowDataPacket {
  id: number;
  title: string;
  author: string;
  genre: string;
  status: "available" | "borrowed";
  due_date: Date | null;
  borrower_name: string | null;
  registration_no: string | null;
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