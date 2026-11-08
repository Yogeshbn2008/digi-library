import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/books";
import { canViewCatalog } from "@/lib/student-auth";

export async function GET(req: NextRequest) {
  if (!(await canViewCatalog())) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const result = await searchBooks({
    q: sp.get("q") ?? undefined,
    genre: sp.get("genre") ?? undefined,
    page: Number(sp.get("page")) || 1,
    pageSize: 50,
  });

  // Only the fields the catalog page shows (no price, remarks or donated flag)
  const books = result.books.map((b) => ({
    id: b.id,
    book_code: b.book_code,
    title: b.title,
    author: b.author,
    genre: b.genre,
    status: b.status,
    due_date: b.due_date,
  }));

  return NextResponse.json(
    { total: result.total, page: result.page, pages: result.pages, books },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}