import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/catalog", () => ({
  fetchSitemapProducts: vi.fn().mockResolvedValue([])
}));

import sitemap, { revalidate } from "./sitemap";

describe("sitemap cache policy", () => {
  it("refreshes hourly so catalog changes do not require a deployment", () => {
    expect(revalidate).toBe(3600);
  });

  it("keeps the public routes when no catalog products are available", async () => {
    const entries = await sitemap();

    expect(entries.map(({ url }) => new URL(url).pathname)).toEqual([
      "/",
      "/catalog",
      "/deals",
      "/products",
      "/hospitals",
      "/guide",
      "/price-tracking"
    ]);
  });
});
