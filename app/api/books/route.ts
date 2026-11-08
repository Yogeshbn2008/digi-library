import { NextRequest, NextResponse } from "next/server";
import { getBooks } from "@/lib/books";
import { canViewCatalog } from "@/lib/student-auth";

export async function GET(req: NextRequest) {
  if (!(await canViewCatalog())) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const genre = req.nextUrl.searchParams.get("genre") ?? undefined;
  const books = await getBooks({ q, genre });
  return NextResponse.json(books);
}