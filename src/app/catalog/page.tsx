import { Suspense } from "react";
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import { fetchCatalogPage, type CatalogSort } from "@/lib/catalog";
import CatalogFiltersClient from "./catalog-filters-client";
import { categories } from "@/lib/categories";

export const revalidate = 3600;

const PAGE_SIZE = 24;

type CatalogSearchParams = {
  query?: string;
  category?: string;
  pet?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

function toSort(value: string | undefined): CatalogSort {
  return value === "price" || value === "recent" ? value : "drop";
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const sort = toSort(params.sort);
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const { items, total } = await fetchCatalogPage({
    query: params.query,
    categorySlug: params.category,
    petType: params.pet,
    maxPrice,
    sort,
    page,
    pageSize: PAGE_SIZE
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="catalog-page">
      <section className="page-heading">
        <p className="section-label">카탈로그</p>
        <h1>추적 중인 반려용품을 둘러보세요.</h1>
        <p className="page-heading__copy">매일 수집된 가격 기록을 바탕으로 최저가와 하락률을 확인할 수 있어요.</p>
      </section>

      <Suspense>
        <CatalogFiltersClient categories={categories} />
      </Suspense>

      <p className="result-summary">총 {total.toLocaleString("ko-KR")}개 상품 · {page} / {totalPages} 페이지</p>

      {items.length ? (
        <section className="card-grid">
          {items.map((stats) => (
            <PriceCard stats={stats} key={stats.externalProductId} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <p>조건에 맞는 상품이 아직 없어요. 수집이 진행되면 이곳에 표시됩니다.</p>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="페이지 이동">
          {page > 1 ? <Link href={{ pathname: "/catalog", query: { ...params, page: page - 1 } }}>이전</Link> : null}
          <span>{page} / {totalPages}</span>
          {page < totalPages ? <Link href={{ pathname: "/catalog", query: { ...params, page: page + 1 } }}>다음</Link> : null}
        </nav>
      ) : null}
    </main>
  );
}
