import { Suspense } from "react";
import PriceCard from "@/components/PriceCard";
import EmptyState from "@/components/ui/EmptyState";
import { fetchCatalogPage } from "@/lib/catalog";
import DealsTabsClient from "./deals-tabs-client";
import { categories } from "@/lib/categories";

export const revalidate = 3600;

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;

  const { items, total } = await fetchCatalogPage({
    categorySlug: category,
    minDropPct: 1,
    sort: "drop",
    page: 1,
    pageSize: 60
  });

  return (
    <main className="deals-page">
      <section className="page-heading">
        <p className="section-label">급락 특가</p>
        <h1>최근 14일 최고가 대비 가격이 내려간 상품</h1>
        <p className="page-heading__copy">하락폭이 큰 순서대로 모았어요. 카테고리로 좁혀볼 수 있어요.</p>
      </section>

      <Suspense>
        <DealsTabsClient categories={categories} />
      </Suspense>

      <p className="result-summary">총 {total.toLocaleString("ko-KR")}개 · 하락률순</p>

      {items.length ? (
        <section className="card-grid">
          {items.map((stats) => (
            <PriceCard stats={stats} key={stats.externalProductId} />
          ))}
        </section>
      ) : (
        <EmptyState>아직 급락 특가가 없어요. 수집이 진행되면 이곳에 표시됩니다.</EmptyState>
      )}
    </main>
  );
}
