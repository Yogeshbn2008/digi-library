import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { todayIST } from "@/lib/dates";
import { logAction } from "@/lib/audit";

export async function GET(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
    await logAction(admin, "export.books");   // use "export.loans" in the loans file

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.id, b.book_code, b.title, l.borrower_name, l.registration_no,
            l.issue_date, l.due_date, l.return_date, a.username AS issued_by
     FROM loans l
     JOIN books b ON b.id = l.book_id
     LEFT JOIN admins a ON a.id = l.issued_by
     ORDER BY l.issue_date DESC, l.id DESC`
  );

  const header = [
    "loan_id", "book_code", "title", "borrower_name", "registration_no",
    "issue_date", "due_date", "return_date", "issued_by",
  ];
  const data = rows.map((r) => [
    r.id, r.book_code, r.title, r.borrower_name, r.registration_no,
    r.issue_date, r.due_date, r.return_date, r.issued_by,
  ]);

  const csv = "\uFEFF" + toCsv([header, ...data]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="loans-${todayIST()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}