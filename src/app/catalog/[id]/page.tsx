import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchExternalProduct, fetchPriceHistory, fetchProductReviews, fetchProductStats } from "@/lib/catalog";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { formatDropLabel, isNearAllTimeLow } from "@/lib/price-stats";
import { buildProductJsonLd, computeReviewAggregate } from "@/lib/product-detail";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeading from "@/components/ui/SectionHeading";
import PriceChart from "./price-chart";
import ReviewsSection from "./reviews-section";
import SaveButtonClient from "./save-button-client";
import { getAbsoluteUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

const getProductStats = cache(fetchProductStats);
const getExternalProduct = cache(fetchExternalProduct);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const stats = await getProductStats(id);
  const product = stats ? null : await getExternalProduct(id);

  if (!stats && !product) {
    return { title: "상품을 찾을 수 없습니다 | 펫픽" };
  }

  const title = stats
    ? `${stats.title} 최근 수집 가격 ${formatPrice(stats.currentPrice)} | 펫픽`
    : `${product!.title} | 펫픽`;
  const description = stats
    ? `${stats.title}의 최근 수집 가격과 가격 추이를 확인하세요.`
    : `${product!.title}의 최신 가격과 후기를 확인하세요.`;

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
  const product = stats ? null : await getExternalProduct(id);

  if (!stats && !product) {
    notFound();
  }

  const [history, reviews] = await Promise.all([fetchPriceHistory(id, 60), fetchProductReviews(id)]);
  const aggregate = computeReviewAggregate(reviews);

  const title = stats ? stats.title : product!.title;
  const imageUrl = stats ? stats.imageUrl : product!.image_url;
  const mallName = stats ? stats.mallName : product!.mall_name;
  const price = stats ? stats.currentPrice : product!.latest_price;
  const productUrl = stats ? stats.productUrl : product!.product_url;
  const lastCheckedAt = stats ? stats.lastCheckedAt : product!.last_synced_at;

  const dropLabel = stats ? formatDropLabel(stats.dropPct) : null;
  const nearAllTimeLow = stats ? isNearAllTimeLow(stats) : false;

  const jsonLd = buildProductJsonLd({ title, imageUrl, price, productUrl, lastCheckedAt, aggregate });

  return (
    <main className="detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="detail-card">
        <div className="detail-card__media">
          {imageUrl ? <Image src={imageUrl} alt="" width={480} height={360} /> : <span>상품 이미지</span>}
        </div>
        <div className="detail-card__body">
          <p className="detail-card__source">{mallName ?? "쇼핑몰 확인 필요"}</p>
          <h1>{title}</h1>
          <div className="detail-card__price">
            <strong>{formatPrice(price)}</strong>
            {dropLabel ? <Badge variant="drop">{dropLabel}</Badge> : null}
          </div>
          <dl className="detail-meta">
            {stats ? (
              <>
                <div><dt>14일 최고가</dt><dd>{formatPrice(stats.maxPrice14d)}</dd></div>
                <div>
                  <dt>역대 최저가</dt>
                  <dd>
                    {formatPrice(stats.minPriceAll)}
                    {nearAllTimeLow ? <Badge variant="state">최저가 근접</Badge> : null}
                  </dd>
                </div>
                <div><dt>마지막 가격 확인</dt><dd>{formatCheckedAt(stats.lastCheckedAt)}</dd></div>
              </>
            ) : (
              <>
                <div><dt>카테고리</dt><dd>{product!.category || "카테고리 확인 필요"}</dd></div>
                <div><dt>쇼핑몰</dt><dd>{product!.mall_name || "쇼핑몰 확인 필요"}</dd></div>
                <div><dt>마지막 가격 확인</dt><dd>{formatCheckedAt(product!.last_synced_at)}</dd></div>
              </>
            )}
          </dl>
          <div className="detail-card__actions">
            <SaveButtonClient externalProductId={id} currentPrice={price ?? 0} />
            <Button href={productUrl} external variant="primary">구매하러 가기</Button>
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

      <ReviewsSection externalProductId={id} initialReviews={reviews} />
    </main>
  );
}
