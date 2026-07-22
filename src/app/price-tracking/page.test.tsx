import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PriceTrackingPage, { metadata } from "./page";

describe("PriceTrackingPage", () => {
  it("renders the four public tracking explanations and required notice", () => {
    const html = renderToStaticMarkup(<PriceTrackingPage />);

    expect(html).toContain("펫픽이 기록하는 가격");
    expect(html).toContain("가격은 어떻게 수집하나요?");
    expect(html).toContain("14일 하락률은 어떻게 계산하나요?");
    expect(html).toContain("마지막 확인 시각은 무엇인가요?");
    expect(html).toContain("최종 가격·배송비·재고 여부는 판매처에서 확인해주세요.");
  });

  it("publishes matching AboutPage and FAQPage JSON-LD", () => {
    const html = renderToStaticMarkup(<PriceTrackingPage />);

    expect(html).toContain("\"@type\":\"AboutPage\"");
    expect(html).toContain("\"@type\":\"FAQPage\"");
    expect(html).toContain("펫픽은 카탈로그에 등록된 반려용품의 네이버 쇼핑 기준 가격을 매일 기록합니다.");
    expect(html).toContain("하락률은 최근 14일 동안 기록된 최고가와 가장 최근 수집 가격을 비교해 계산합니다.");
  });

  it("defines the page title, description, and canonical URL", () => {
    expect(metadata.title).toEqual({ absolute: "가격 기록 방식 | 펫픽" });
    expect(metadata.description).toBe("펫픽이 반려용품 가격을 수집하고 하락률을 계산하는 기준을 안내합니다.");
    expect(metadata.alternates?.canonical).toBe("/price-tracking");
  });
});
