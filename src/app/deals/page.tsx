import { Suspense } from "react";
import type { Metadata } from "next";
import EmptyState from "@/components/ui/EmptyState";
import { fetchCatalogPage } from "@/lib/catalog";
import { getAbsoluteUrl, SITE_NAME } from "@/lib/site";
import DealsTabsClient from "./deals-tabs-client";
import DealsListClient from "./deals-list-client";
import { categories } from "@/lib/categories";

export const revalidate = 3600;

const dealsDescription = "최근 14일 최고가 대비 가격이 내려간 반려용품을 하락폭 순으로 확인하세요.";

export const metadata: Metadata = {
  title: { absolute: "급락 특가 | 펫픽" },
  description: dealsDescription,
  alternates: {
    canonical: "/deals"
  },
  openGraph: {
    title: "급락 특가 | 펫픽",
    description: dealsDescription,
    url: getAbsoluteUrl("/deals"),
    images: "/opengraph-image",
    locale: "ko_KR",
    siteName: SITE_NAME,
    type: "website"
  }
};

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
        <DealsListClient items={items} />
      ) : (
        <EmptyState>아직 급락 특가가 없어요. 수집이 진행되면 이곳에 표시됩니다.</EmptyState>
      )}
    </main>
  );
}
