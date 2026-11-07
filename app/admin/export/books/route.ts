import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { todayIST } from "@/lib/dates";
import { logAction } from "@/lib/audit";

export async function GET(req: Request) {
  // Route handlers are public URLs, so they must check the admin themselves
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
    await logAction(admin, "export.books");   // use "export.loans" in the loans file

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.book_code, b.title, b.author, b.genre, b.price, b.donated,
            b.status, b.remarks, b.due_date, l.borrower_name, l.registration_no
     FROM books b
     LEFT JOIN loans l ON l.book_id = b.id AND l.return_date IS NULL
     ORDER BY b.book_code, b.title`
  );

  const header = [
    "book_code", "title", "author", "category", "price", "donated",
    "status", "remarks", "due_date", "borrower_name", "registration_no",
  ];
  const data = rows.map((r) => [
    r.book_code, r.title, r.author, r.genre, r.price, r.donated,
    r.status, r.remarks, r.due_date, r.borrower_name, r.registration_no,
  ]);

  // The BOM at the start makes Excel read the file as UTF-8 (Kannada stays readable)
  const csv = "\uFEFF" + toCsv([header, ...data]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="books-${todayIST()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}