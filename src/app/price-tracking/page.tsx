import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "가격 기록 방식 | 펫픽" },
  description: "펫픽이 반려용품 가격을 수집하고 하락률을 계산하는 기준을 안내합니다.",
  alternates: {
    canonical: "/price-tracking"
  }
};

const trackingFacts = [
  {
    question: "펫픽이 기록하는 가격",
    answer: "펫픽은 카탈로그에 등록된 반려용품의 네이버 쇼핑 기준 가격을 매일 기록합니다. 카탈로그에 없는 상품은 실시간 검색으로 확인할 수 있지만, 가격 기록은 카탈로그 상품을 기준으로 제공합니다."
  },
  {
    question: "가격은 어떻게 수집하나요?",
    answer: "등록된 상품을 기준으로 네이버 쇼핑 검색 결과의 가격을 매일 수집해 가격 기록에 남깁니다. 수집 결과는 검색 시점과 판매처의 상품 정보에 따라 달라질 수 있습니다."
  },
  {
    question: "14일 하락률은 어떻게 계산하나요?",
    answer: "하락률은 최근 14일 동안 기록된 최고가와 가장 최근 수집 가격을 비교해 계산합니다. 최근 가격이 14일 최고가보다 낮을 때에만 하락한 것으로 표시합니다."
  },
  {
    question: "마지막 확인 시각은 무엇인가요?",
    answer: "마지막 확인 시각은 해당 가격을 가장 최근에 수집한 시점입니다. 표시 가격은 수집 시점 기준입니다. 최종 가격·배송비·재고 여부는 판매처에서 확인해주세요."
  }
] as const;

function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function PriceTrackingPage() {
  const pageUrl = getAbsoluteUrl("/price-tracking");
  const aboutPage = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "가격 기록 방식 | 펫픽",
    description: "펫픽이 반려용품 가격을 수집하고 하락률을 계산하는 기준을 안내합니다.",
    url: pageUrl
  };
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: trackingFacts.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    }))
  };

  return (
    <main className="price-tracking">
      <section className="price-tracking__intro" aria-labelledby="price-tracking-title">
        <p className="section-label">가격 추적 기준</p>
        <h1 id="price-tracking-title">가격 기록 방식을 안내합니다.</h1>
        <p>펫픽에서 보이는 가격 기록과 하락률이 어떤 기준으로 만들어지는지 확인하세요.</p>
      </section>

      <div className="price-tracking__facts">
        {trackingFacts.map(({ question, answer }) => (
          <section className="price-tracking__fact" key={question}>
            <h2>{question}</h2>
            <p>{answer}</p>
          </section>
        ))}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(aboutPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqPage) }} />
    </main>
  );
}
