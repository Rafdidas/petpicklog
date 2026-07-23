import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient
}));

import { fetchCategoryTopDrops, fetchSitemapProducts } from "./catalog";

const foodRow = {
  external_product_id: "p1",
  title: "테스트 사료",
  category_slug: "food",
  pet_type: "dog",
  mall_name: "테스트몰",
  product_url: "https://example.com/p1",
  image_url: null,
  current_price: 10000,
  last_checked_at: "2026-07-20T00:00:00Z",
  max_price_14d: 12000,
  drop_pct: 17,
  min_price_all: 9000
};

function makeSupabaseMock(rowsBySlug: Record<string, unknown[]>) {
  return {
    from: () => {
      let slug = "";
      const query = {
        select: () => query,
        eq: (_column: string, value: string) => {
          slug = value;
          return query;
        },
        order: () => query,
        limit: () => Promise.resolve({ data: rowsBySlug[slug] ?? [] })
      };
      return query;
    }
  };
}

describe("fetchCategoryTopDrops", () => {
  beforeEach(() => {
    mocks.createServerSupabaseClient.mockReset();
  });

  it("Supabase 미설정 시 빈 객체를 반환한다", async () => {
    mocks.createServerSupabaseClient.mockReturnValue(null);

    expect(await fetchCategoryTopDrops(8)).toEqual({});
  });

  it("카테고리 slug별로 매핑된 상품 목록을 반환한다", async () => {
    mocks.createServerSupabaseClient.mockReturnValue(makeSupabaseMock({ food: [foodRow] }));

    const result = await fetchCategoryTopDrops(8);

    expect(Object.keys(result)).toHaveLength(8);
    expect(result.food).toHaveLength(1);
    expect(result.food[0]).toMatchObject({
      externalProductId: "p1",
      title: "테스트 사료",
      currentPrice: 10000,
      dropPct: 17
    });
    expect(result.toy).toEqual([]);
  });
});

describe("fetchSitemapProducts", () => {
  beforeEach(() => {
    mocks.createServerSupabaseClient.mockReset();
  });

  it("sitemap 상품의 snake_case 필드를 camelCase로 매핑한다", async () => {
    const rows = [{ external_product_id: "p1", last_checked_at: "2026-07-22T00:00:00Z" }];
    const query = {
      select: () => query,
      not: () => query,
      order: () => Promise.resolve({ data: rows })
    };
    mocks.createServerSupabaseClient.mockReturnValue({ from: () => query });

    await expect(fetchSitemapProducts()).resolves.toEqual([
      { externalProductId: "p1", lastCheckedAt: "2026-07-22T00:00:00Z" }
    ]);
  });
});

describe("catalog 폴백 헬퍼 (supabase 미가용)", () => {
  beforeEach(() => {
    mocks.createServerSupabaseClient.mockReset();
  });

  it("fetchExternalProduct는 null을 반환한다", async () => {
    mocks.createServerSupabaseClient.mockReturnValue(null);
    const { fetchExternalProduct } = await import("./catalog");
    await expect(fetchExternalProduct("missing")).resolves.toBeNull();
  });

  it("fetchProductReviews는 빈 배열을 반환한다", async () => {
    mocks.createServerSupabaseClient.mockReturnValue(null);
    const { fetchProductReviews } = await import("./catalog");
    await expect(fetchProductReviews("missing")).resolves.toEqual([]);
  });
});

describe("catalog 폴백 헬퍼 (supabase 가용, 성공 경로)", () => {
  beforeEach(() => {
    mocks.createServerSupabaseClient.mockReset();
  });

  it("fetchExternalProduct는 조회된 행을 필드 그대로 반환한다", async () => {
    const row = {
      id: "ext-1",
      source: "coupang",
      title: "테스트 상품",
      category: "food",
      mall_name: "테스트몰",
      product_url: "https://example.com/ext-1",
      image_url: "https://example.com/ext-1.jpg",
      latest_price: 15000,
      last_synced_at: "2026-07-22T00:00:00Z"
    };
    const eqSpy = vi.fn(() => query);
    const query = {
      select: vi.fn(() => query),
      eq: eqSpy,
      maybeSingle: () => Promise.resolve({ data: row })
    };
    mocks.createServerSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });

    const { fetchExternalProduct } = await import("./catalog");
    await expect(fetchExternalProduct("ext-1")).resolves.toEqual(row);
    expect(eqSpy).toHaveBeenCalledWith("id", "ext-1");
  });

  it("fetchExternalProduct는 대상 상품이 없으면(data: null) null을 반환한다", async () => {
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: () => Promise.resolve({ data: null })
    };
    mocks.createServerSupabaseClient.mockReturnValue({ from: () => query });

    const { fetchExternalProduct } = await import("./catalog");
    await expect(fetchExternalProduct("missing")).resolves.toBeNull();
  });

  it("fetchProductReviews는 created_at 내림차순으로 정렬 조회하고 필드를 그대로 반환한다", async () => {
    const rows = [
      { id: "r1", user_id: "u1", rating: 5, repurchase_intent: true, content: "좋아요", created_at: "2026-07-20T00:00:00Z" },
      { id: "r2", user_id: "u2", rating: 3, repurchase_intent: false, content: "보통", created_at: "2026-07-18T00:00:00Z" }
    ];
    const orderSpy = vi.fn(() => Promise.resolve({ data: rows }));
    const eqSpy = vi.fn(() => query);
    const query = {
      select: vi.fn(() => query),
      eq: eqSpy,
      order: orderSpy
    };
    mocks.createServerSupabaseClient.mockReturnValue({ from: vi.fn(() => query) });

    const { fetchProductReviews } = await import("./catalog");
    await expect(fetchProductReviews("ext-1")).resolves.toEqual(rows);
    expect(eqSpy).toHaveBeenCalledWith("external_product_id", "ext-1");
    expect(orderSpy).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});
