import { Suspense } from "react";
import { searchShoppingProducts } from "@/lib/naver-shopping";
import type { ExternalProduct } from "@/types/product";
import ProductSearchClient from "./product-search-client";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ query?: string; petType?: string; customPet?: string }> }) {
  const { query, petType, customPet } = await searchParams;
  const initialQuery = query || "";
  const initialPetType = petType || "all";
  const initialCustomPet = customPet || "";
  let initialProducts: ExternalProduct[] = [];
  let initialError = "";

  if (initialQuery.trim()) {
    try {
      initialProducts = await searchShoppingProducts(initialQuery, { petType: initialPetType, customPet: initialCustomPet });
    } catch (error) {
      initialError = error instanceof Error ? error.message : "상품 검색에 실패했습니다.";
    }
  }

  return (
    <Suspense>
      <ProductSearchClient
        initialCustomPet={initialCustomPet}
        initialError={initialError}
        initialPetType={initialPetType}
        initialProducts={initialProducts}
        initialQuery={initialQuery}
      />
    </Suspense>
  );
}
