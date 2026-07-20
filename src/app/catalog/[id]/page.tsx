import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchPriceHistory, fetchProductStats } from "@/lib/catalog";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { formatDropLabel, isNearAllTimeLow } from "@/lib/price-stats";
import PriceChart from "./price-chart";
import SaveButtonClient from "./save-button-client";

export const revalidate = 3600;

const getProductStats = cache(fetchProductStats);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const stats = await getProductStats(id);

  if (!stats) {
    return { title: "상품을 찾을 수 없습니다 | 펫픽" };
  }

  return {
    title: `${stats.title} 최저가 ${formatPrice(stats.currentPrice)} | 펫픽`,
    description: `${stats.title}의 최근 가격 추이와 최저가를 확인하세요.`
  };
}

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stats = await getProductStats(id);

  if (!stats) {
    notFound();
  }

  const history = await fetchPriceHistory(id, 60);
  const dropLabel = formatDropLabel(stats.dropPct);
  const nearAllTimeLow = isNearAllTimeLow(stats);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: stats.title,
    image: stats.imageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      price: stats.currentPrice,
      priceCurrency: "KRW",
      url: stats.productUrl
    }
  };

  return (
    <main className="catalog-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="catalog-detail">
        {stats.imageUrl ? (
          <Image src={stats.imageUrl} alt="" width={480} height={360} />
        ) : (
          <div className="catalog-detail__image" />
        )}
        <div className="catalog-detail__content">
          <p className="section-label">{stats.mallName ?? "쇼핑몰 확인 필요"}</p>
          <h1>{stats.title}</h1>
          <div className="catalog-detail__price-row">
            <strong>{formatPrice(stats.currentPrice)}</strong>
            {dropLabel ? <em className="catalog-detail__drop">{dropLabel}</em> : null}
          </div>
          <dl className="detail-list">
            <div><dt>14일 최고가</dt><dd>{formatPrice(stats.maxPrice14d)}</dd></div>
            <div>
              <dt>역대 최저가</dt>
              <dd>
                {formatPrice(stats.minPriceAll)}
                {nearAllTimeLow ? <span className="badge badge--highlight">최저가 근접</span> : null}
              </dd>
            </div>
            <div><dt>마지막 확인</dt><dd>{formatCheckedAt(stats.lastCheckedAt)}</dd></div>
          </dl>
          <div className="catalog-detail__actions">
            <a className="button button--primary" href={stats.productUrl} target="_blank" rel="noreferrer">구매하러 가기</a>
            <SaveButtonClient externalProductId={stats.externalProductId} currentPrice={stats.currentPrice} />
          </div>
          <p className="product-detail__notice">표시된 가격은 최근 수집된 가격이며, 실제 구매 가격은 쇼핑몰에서 달라질 수 있습니다.</p>
        </div>
      </section>

      <section className="detail-section">
        <div className="dashboard-section__heading">
          <div>
            <p className="section-label">가격 추이</p>
            <h2>최근 가격 기록</h2>
          </div>
        </div>
        {history.length >= 2 ? (
          <PriceChart points={history} />
        ) : (
          <div className="empty-state"><p>가격 기록이 더 쌓이면 추이 차트가 표시됩니다.</p></div>
        )}
      </section>
    </main>
  );
}
