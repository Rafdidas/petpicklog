import { Suspense } from "react";
import { searchShoppingProducts } from "@/lib/naver-shopping";
import type { ExternalProduct } from "@/types/product";
import ProductSearchClient from "./product-search-client";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const { query } = await searchParams;
  const initialQuery = query || "";
  let initialProducts: ExternalProduct[] = [];
  let initialError = "";

  if (initialQuery.trim()) {
    try {
      initialProducts = await searchShoppingProducts(initialQuery);
    } catch (error) {
      initialError = error instanceof Error ? error.message : "상품 검색에 실패했습니다.";
    }
  }

  return (
    <Suspense>
      <ProductSearchClient initialError={initialError} initialProducts={initialProducts} initialQuery={initialQuery} />
    </Suspense>
  );
}
