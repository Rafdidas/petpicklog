import { describe, expect, it } from "vitest";
import type { ExternalProduct } from "@/types/product";
import { findMatchingProduct } from "./match";

function buildProduct(overrides: Partial<ExternalProduct> = {}): ExternalProduct {
  return {
    externalId: "1000",
    title: "테스트 사료",
    brand: null,
    category: "사료",
    imageUrl: "https://example.com/a.jpg",
    productUrl: "https://example.com/a",
    mallName: "테스트몰",
    latestPrice: 10000,
    source: "NAVER",
    lastSyncedAt: "2026-07-15T00:00:00.000Z",
    ...overrides
  };
}

describe("findMatchingProduct", () => {
  it("externalId가 일치하는 상품을 반환한다", () => {
    const target = buildProduct({ externalId: "2000", title: "다른 상품" });
    const candidates = [buildProduct({ externalId: "1000" }), target, buildProduct({ externalId: "3000" })];

    expect(findMatchingProduct(candidates, "2000")).toEqual(target);
  });

  it("일치하는 상품이 없으면 null을 반환한다", () => {
    const candidates = [buildProduct({ externalId: "1000" })];
    expect(findMatchingProduct(candidates, "9999")).toBeNull();
  });

  it("후보 목록이 비어 있으면 null을 반환한다", () => {
    expect(findMatchingProduct([], "1000")).toBeNull();
  });
});
