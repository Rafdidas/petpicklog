import { describe, expect, it } from "vitest";
import { categories } from "./categories";

describe("categories", () => {
  it("defines twelve unique category slugs", () => {
    expect(categories).toHaveLength(12);
    expect(new Set(categories.map((category) => category.slug)).size).toBe(12);
  });
});
