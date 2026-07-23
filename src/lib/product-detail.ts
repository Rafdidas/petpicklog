export type ReviewAggregate = {
  count: number;
  averageRating: number;
  repurchaseRate: number;
};

export function computeReviewAggregate(
  reviews: { rating: number; repurchase_intent: boolean | null }[]
): ReviewAggregate {
  const count = reviews.length;
  if (count === 0) {
    return { count: 0, averageRating: 0, repurchaseRate: 0 };
  }

  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
  const repurchaseCount = reviews.filter((review) => review.repurchase_intent).length;

  return {
    count,
    averageRating: ratingSum / count,
    repurchaseRate: Math.round((repurchaseCount / count) * 100)
  };
}

export type ProductJsonLdInput = {
  title: string;
  imageUrl: string | null;
  price: number | null;
  productUrl: string;
  lastCheckedAt: string | null;
  aggregate: ReviewAggregate;
};

export function buildProductJsonLd(input: ProductJsonLdInput): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    image: input.imageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      price: input.price ?? undefined,
      priceCurrency: "KRW",
      url: input.productUrl
    }
  };

  if (input.lastCheckedAt) {
    jsonLd.additionalProperty = {
      "@type": "PropertyValue",
      name: "마지막 가격 확인 시각",
      value: input.lastCheckedAt
    };
  }

  if (input.aggregate.count > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.aggregate.averageRating.toFixed(1),
      reviewCount: input.aggregate.count
    };
  }

  return jsonLd;
}
