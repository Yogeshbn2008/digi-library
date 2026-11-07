import { RowDataPacket } from "mysql2";
import { pool } from "./db";

type Actor = { id: number; username: string };

// Never throws: a logging problem must not break the action itself
export async function logAction(
  actor: Actor | null,
  action: string,
  target?: string | null,
  details?: string | null
) {
  try {
    await pool.query(
      `INSERT INTO audit_log (admin_id, admin_username, action, target, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        actor?.id ?? null,
        (actor?.username ?? "unknown").slice(0, 50),
        action.slice(0, 40),
        target ? target.slice(0, 120) : null,
        details ? details.slice(0, 255) : null,
      ]
    );
  } catch (err) {
    console.error("Audit log write failed", err);
  }
}

// A readable label for a book, e.g. "MBBS-01 - PRACTICAL PHYSIOLOGY"
export async function bookLabel(bookId: number) {
  const [rows] = await pool.query<
    (RowDataPacket & { book_code: string | null; title: string })[]
  >("SELECT book_code, title FROM books WHERE id = ?", [bookId]);
  const b = rows[0];
  return b ? `${b.book_code ?? "no code"} - ${b.title}` : `book #${bookId}`;
}

export interface AuditRow extends RowDataPacket {
  id: number;
  admin_username: string;
  action: string;
  target: string | null;
  details: string | null;
  created_at: Date;
}

export async function searchAudit({
  q,
  page = 1,
  pageSize = 50,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const params: (string | number)[] = [];
  let where = "";
  if (q) {
    where = `WHERE (admin_username LIKE ? OR action LIKE ? OR target LIKE ? OR details LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM audit_log ${where}`,
    params
  );
  const total = Number(countRows[0].total);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);

  const [entries] = await pool.query<AuditRow[]>(
    `SELECT id, admin_username, action, target, details, created_at
     FROM audit_log ${where}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, (current - 1) * pageSize]
  );
  return { entries, total, page: current, pages };
}