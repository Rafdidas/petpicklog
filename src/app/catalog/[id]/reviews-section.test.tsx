import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => null
}));

import ReviewsSection from "./reviews-section";

describe("ReviewsSection", () => {
  it("초기 후기와 집계 타일을 SSR로 렌더한다", () => {
    const html = renderToStaticMarkup(
      <ReviewsSection
        externalProductId="prod-1"
        initialReviews={[
          { id: "r1", user_id: "u1", rating: 5, repurchase_intent: true, content: "아주 좋아요", created_at: "2026-07-20T00:00:00Z" },
          { id: "r2", user_id: "u2", rating: 3, repurchase_intent: false, content: "보통이에요", created_at: "2026-07-19T00:00:00Z" }
        ]}
      />
    );

    expect(html).toContain("아주 좋아요");
    expect(html).toContain("보통이에요");
    expect(html).toContain("2개");
  });
});
