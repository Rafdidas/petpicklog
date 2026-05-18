import { NextResponse } from "next/server";
import { searchShoppingProducts } from "@/lib/naver-shopping";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";

  try {
    const products = await searchShoppingProducts(query);
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "상품 검색에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
