import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Typography from "@/components/ui/Typography";

export const metadata: Metadata = {
  alternates: {
    canonical: "/guide"
  }
};

const guides = [
  { category: "사료", title: "우리 아이에게 맞는 사료 고르는 방법", description: "연령, 체중, 활동량과 원재료를 기준으로 사료를 살펴보는 기본 방법을 정리합니다." },
  { category: "간식", title: "간식 선택 시 확인할 것", description: "하루 급여량과 알레르기 유발 가능 원료를 확인하는 습관을 알아봅니다." },
  { category: "배변·위생", title: "배변용품과 위생용품 고르는 법", description: "생활 환경과 반려동물의 습관에 맞는 제품을 선택할 때 볼 항목을 정리합니다." },
  { category: "건강", title: "동물병원 방문 전 체크리스트", description: "증상 기록, 복용 중인 약, 문의할 내용을 미리 준비하는 방법을 안내합니다." },
  { category: "공공데이터", title: "동물병원 정보 이용 안내", description: "공공데이터 기반 병원 정보를 확인할 때 함께 살펴봐야 할 내용을 안내합니다." }
];

export default function GuidePage() {
  return (
    <main className="guide-page">
      <section className="page-heading">
        <Typography as="p" type="label" size="xs" className="section-label">반려생활 가이드</Typography>
        <Typography as="h1" type="headline" size="md">반려생활에 필요한 기본 정보를 차근차근 확인하세요.</Typography>
        <Typography as="p" type="body" size="lg" className="page-heading__copy">가이드는 일반적인 정보 제공을 위한 콘텐츠입니다. 건강과 진료에 관한 판단은 수의사와 상담해주세요.</Typography>
      </section>
      <section className="guide-list">
        {guides.map((guide) => (
          <article className="guide-card" key={guide.title}>
            <Badge variant="category">{guide.category}</Badge>
            <Typography as="h2" type="title" size="sm">{guide.title}</Typography>
            <Typography as="p" type="body" size="sm">{guide.description}</Typography>
            <Typography as="small" type="caption" size="lg">콘텐츠 준비 중</Typography>
          </article>
        ))}
      </section>
      <section className="guide-cta">
        <div>
          <Typography as="p" type="label" size="xs" className="guide-cta__label">용품 가격 확인</Typography>
          <Typography as="strong" type="title" size="sm">가이드에서 살펴본 용품의 가격도 확인해보세요.</Typography>
        </div>
        <Button href="/catalog" variant="green-dark">가격 확인하기</Button>
      </section>
    </main>
  );
}
