import { describe, expect, it } from "vitest";
import { buildProductJsonLd, computeReviewAggregate } from "./product-detail";

describe("computeReviewAggregate", () => {
  it("후기가 없으면 0을 반환한다", () => {
    expect(computeReviewAggregate([])).toEqual({ count: 0, averageRating: 0, repurchaseRate: 0 });
  });

  it("별점 평균과 재구매율을 계산한다", () => {
    const result = computeReviewAggregate([
      { rating: 5, repurchase_intent: true },
      { rating: 4, repurchase_intent: true },
      { rating: 3, repurchase_intent: false }
    ]);
    expect(result.count).toBe(3);
    expect(result.averageRating).toBeCloseTo(4);
    expect(result.repurchaseRate).toBe(67);
  });
});

describe("buildProductJsonLd", () => {
  const base = {
    title: "강아지 사료",
    imageUrl: "https://img/1.jpg",
    price: 15000,
    productUrl: "https://shop/1",
    lastCheckedAt: "2026-07-20T00:00:00Z"
  };

  it("후기가 없으면 aggregateRating을 넣지 않는다", () => {
    const jsonLd = buildProductJsonLd({ ...base, aggregate: { count: 0, averageRating: 0, repurchaseRate: 0 } });
    expect(jsonLd.aggregateRating).toBeUndefined();
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.additionalProperty).toBeDefined();
  });

  it("후기가 있으면 aggregateRating을 넣는다", () => {
    const jsonLd = buildProductJsonLd({ ...base, aggregate: { count: 4, averageRating: 4.5, repurchaseRate: 75 } });
    expect(jsonLd.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: 4
    });
  });

  it("lastCheckedAt이 null이면 additionalProperty를 넣지 않는다", () => {
    const jsonLd = buildProductJsonLd({
      ...base,
      lastCheckedAt: null,
      aggregate: { count: 0, averageRating: 0, repurchaseRate: 0 }
    });
    expect(jsonLd.additionalProperty).toBeUndefined();
  });
});
