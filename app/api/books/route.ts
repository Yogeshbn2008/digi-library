import { NextRequest, NextResponse } from "next/server";
import { getBooks } from "@/lib/books";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const genre = req.nextUrl.searchParams.get("genre") ?? undefined;
  const books = await getBooks({ q, genre });
  return NextResponse.json(books);
}