import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("home content density", () => {
  it("requests five top drops and ten category products", () => {
    const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

    expect(source).toContain("fetchTopDrops(5)");
    expect(source).toContain("fetchCategoryTopDrops(10)");
  });
});
