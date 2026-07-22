import { describe, expect, it } from "vitest";
import { getAbsoluteUrl, getSiteUrl } from "./site";

describe("site URL helpers", () => {
  it("uses localhost when no site URL exists", () => {
    expect(getSiteUrl(undefined).toString()).toBe("http://localhost:3000/");
  });
  it("builds paths from the configured URL", () => {
    expect(getAbsoluteUrl("/catalog", "https://petpick.kr/")).toBe("https://petpick.kr/catalog");
  });
});
