import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchPriceHistory, fetchProductStats } from "@/lib/catalog";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { formatDropLabel, isNearAllTimeLow } from "@/lib/price-stats";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeading from "@/components/ui/SectionHeading";
import PriceChart from "./price-chart";
import SaveButtonClient from "./save-button-client";
import { getAbsoluteUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

const getProductStats = cache(fetchProductStats);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const stats = await getProductStats(id);

  if (!stats) {
    return { title: "상품을 찾을 수 없습니다 | 펫픽" };
  }

  const title = `${stats.title} 최근 수집 가격 ${formatPrice(stats.currentPrice)} | 펫픽`;
  const description = `${stats.title}의 최근 수집 가격과 가격 추이를 확인하세요.`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/catalog/${id}`
    },
    openGraph: {
      title,
      description,
      url: getAbsoluteUrl(`/catalog/${id}`),
      images: "/opengraph-image",
      locale: "ko_KR",
      siteName: SITE_NAME,
      type: "website"
    }
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
    additionalProperty: {
      "@type": "PropertyValue",
      name: "마지막 가격 확인 시각",
      value: stats.lastCheckedAt
    },
    offers: {
      "@type": "Offer",
      price: stats.currentPrice,
      priceCurrency: "KRW",
      url: stats.productUrl
    }
  };

  return (
    <main className="detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="detail-card">
        <div className="detail-card__media">
          {stats.imageUrl ? <Image src={stats.imageUrl} alt="" width={480} height={360} /> : <span>상품 이미지</span>}
        </div>
        <div className="detail-card__body">
          <p className="detail-card__source">{stats.mallName ?? "쇼핑몰 확인 필요"}</p>
          <h1>{stats.title}</h1>
          <div className="detail-card__price">
            <strong>{formatPrice(stats.currentPrice)}</strong>
            {dropLabel ? <Badge variant="drop">{dropLabel}</Badge> : null}
          </div>
          <dl className="detail-meta">
            <div><dt>14일 최고가</dt><dd>{formatPrice(stats.maxPrice14d)}</dd></div>
            <div>
              <dt>역대 최저가</dt>
              <dd>
                {formatPrice(stats.minPriceAll)}
                {nearAllTimeLow ? <Badge variant="state">최저가 근접</Badge> : null}
              </dd>
            </div>
            <div><dt>마지막 가격 확인</dt><dd>{formatCheckedAt(stats.lastCheckedAt)}</dd></div>
          </dl>
          <div className="detail-card__actions">
            <SaveButtonClient externalProductId={stats.externalProductId} currentPrice={stats.currentPrice} />
            <Button href={stats.productUrl} external variant="primary">구매하러 가기</Button>
          </div>
          <p className="detail-card__notice">표시된 가격은 최근 확인된 가격이며, 실제 구매 가격은 쇼핑몰에서 달라질 수 있습니다.</p>
        </div>
      </section>

      <section className="detail-section">
        <SectionHeading eyebrow="가격 기록" title="최근 확인된 가격 기록" />
        {history.length >= 2 ? (
          <div className="detail-chart-card"><PriceChart points={history} /></div>
        ) : (
          <EmptyState>가격 기록이 더 쌓이면 추이 차트가 표시됩니다.</EmptyState>
        )}
      </section>
    </main>
  );
}
