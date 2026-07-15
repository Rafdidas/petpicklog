import { describe, expect, it } from "vitest";
import type { ExternalProduct } from "@/types/product";
import { buildDiscoveryRows } from "./discovery";

function buildProduct(overrides: Partial<ExternalProduct> = {}): ExternalProduct {
  return {
    externalId: "1000",
    title: "테스트 사료",
    brand: "테스트브랜드",
    category: "사료 > 건식",
    imageUrl: "https://example.com/a.jpg",
    productUrl: "https://example.com/a",
    mallName: "테스트몰",
    latestPrice: 10000,
    source: "NAVER",
    lastSyncedAt: "2026-07-15T00:00:00.000Z",
    ...overrides
  };
}

describe("buildDiscoveryRows", () => {
  it("상품을 upsert 행으로 변환하고 카테고리/펫타입을 채운다", () => {
    const rows = buildDiscoveryRows([buildProduct()], "food", "dog");

    expect(rows).toEqual([
      {
        source: "NAVER",
        external_id: "1000",
        title: "테스트 사료",
        brand: "테스트브랜드",
        category: "사료 > 건식",
        image_url: "https://example.com/a.jpg",
        product_url: "https://example.com/a",
        mall_name: "테스트몰",
        latest_price: 10000,
        raw_data: buildProduct(),
        last_synced_at: "2026-07-15T00:00:00.000Z",
        is_tracked: true,
        category_slug: "food",
        pet_type: "dog"
      }
    ]);
  });

  it("가격이 0 이하인 상품은 제외한다", () => {
    const rows = buildDiscoveryRows([buildProduct({ latestPrice: 0 })], "food", "dog");
    expect(rows).toHaveLength(0);
  });
});
