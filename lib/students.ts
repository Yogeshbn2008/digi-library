import { RowDataPacket } from "mysql2";
import { pool } from "./db";

export const STUDENT_FILTERS = ["pending", "approved", "rejected", "blocked", "all"] as const;
export type StudentFilter = (typeof STUDENT_FILTERS)[number];

export interface StudentRow extends RowDataPacket {
  id: number;
  registration_no: string;
  name: string;
  room_no: string | null;
  status: "pending" | "approved" | "rejected" | "blocked";
  created_at: Date;
  decided_by: string | null;
  last_login_at: Date | null;
}

export async function countPendingStudents() {
  const [rows] = await pool.query<(RowDataPacket & { n: number })[]>(
    "SELECT COUNT(*) AS n FROM students WHERE status = 'pending'"
  );
  return Number(rows[0].n);
}

export async function searchStudents({
  q,
  status = "pending",
  page = 1,
  pageSize = 30,
}: {
  q?: string;
  status?: StudentFilter;
  page?: number;
  pageSize?: number;
}) {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status !== "all") {
    conditions.push("status = ?");
    params.push(status);
  }
  if (q) {
    conditions.push("(registration_no LIKE ? OR name LIKE ? OR room_no LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = status === "pending" ? "ASC" : "DESC"; // oldest requests first

  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM students ${where}`,
    params
  );
  const total = Number(countRows[0].total);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);

  const [students] = await pool.query<StudentRow[]>(
    `SELECT id, registration_no, name, room_no, status, created_at, decided_by, last_login_at
     FROM students ${where}
     ORDER BY created_at ${order}, id ${order}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, (current - 1) * pageSize]
  );
  return { students, total, page: current, pages };
}