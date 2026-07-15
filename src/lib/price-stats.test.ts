import { describe, expect, it } from "vitest";
import { formatDropLabel, hasPriceDrop, isNearAllTimeLow } from "./price-stats";

describe("hasPriceDrop", () => {
  it("dropPct가 양수면 true를 반환한다", () => {
    expect(hasPriceDrop({ dropPct: 23 })).toBe(true);
  });

  it("dropPct가 0이거나 음수면 false를 반환한다", () => {
    expect(hasPriceDrop({ dropPct: 0 })).toBe(false);
    expect(hasPriceDrop({ dropPct: -5 })).toBe(false);
  });
});

describe("formatDropLabel", () => {
  it("하락률을 -N% 형태로 포맷한다", () => {
    expect(formatDropLabel(23)).toBe("-23%");
  });

  it("하락이 없으면 빈 문자열을 반환한다", () => {
    expect(formatDropLabel(0)).toBe("");
    expect(formatDropLabel(-5)).toBe("");
  });
});

describe("isNearAllTimeLow", () => {
  it("현재가가 역대 최저가와 같으면 true를 반환한다", () => {
    expect(isNearAllTimeLow({ currentPrice: 10000, minPriceAll: 10000 })).toBe(true);
  });

  it("현재가가 역대 최저가 대비 임계값(기본 5%) 이내면 true를 반환한다", () => {
    expect(isNearAllTimeLow({ currentPrice: 10400, minPriceAll: 10000 })).toBe(true);
  });

  it("현재가가 역대 최저가 대비 임계값을 초과하면 false를 반환한다", () => {
    expect(isNearAllTimeLow({ currentPrice: 11000, minPriceAll: 10000 })).toBe(false);
  });

  it("minPriceAll이 0 이하이면 false를 반환한다", () => {
    expect(isNearAllTimeLow({ currentPrice: 10000, minPriceAll: 0 })).toBe(false);
  });
});
