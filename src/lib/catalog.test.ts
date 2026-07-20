import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient
}));

import { fetchCategoryTopDrops } from "./catalog";

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
