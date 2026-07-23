import type { Metadata } from "next";
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import CategoryTopProducts from "@/components/CategoryTopProducts";
import Button from "@/components/ui/Button";
import StatTile from "@/components/ui/StatTile";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import EmptyState from "@/components/ui/EmptyState";
import Typography from "@/components/ui/Typography";
import { fetchCatalogSummary, fetchCategoryTopDrops, fetchTopDrops } from "@/lib/catalog";
import { formatCheckedAt } from "@/lib/format";
import { categories } from "@/lib/categories";
import { getAbsoluteUrl, SITE_NAME } from "@/lib/site";

export const revalidate = 3600;

const homeDescription = "반려용품의 최근 수집 가격과 가격 추이, 최근 14일 최고가 대비 하락한 급락 특가를 확인하세요.";

export const metadata: Metadata = {
  title: { absolute: "반려용품 가격 추이와 급락 특가 | 펫픽" },
  description: homeDescription,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "반려용품 가격 추이와 급락 특가 | 펫픽",
    description: homeDescription,
    url: getAbsoluteUrl("/"),
    images: "/opengraph-image",
    locale: "ko_KR",
    siteName: SITE_NAME,
    type: "website"
  }
};

export default async function HomePage() {
  const [summary, topDrops, categoryTop] = await Promise.all([
    fetchCatalogSummary(),
    fetchTopDrops(5),
    fetchCategoryTopDrops(10)
  ]);

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero__copy">
          <Typography as="p" type="label" size="xs" className="home-hero__status">
            <span aria-hidden="true" />
            매일 오전 자동 수집 중
          </Typography>
          <Typography as="h1" type="display" size="xl" className="home-hero__title">
            반려용품 최저가를
            <br />
            매일 기록합니다.
          </Typography>
          <Typography as="p" type="bodyBold" size="xl" className="home-hero__subtitle">
            등록된 상품의 가격을 매일 확인해, 최근 14일 최고가 대비 하락한 상품을 모아
            보여드려요.
          </Typography>
          <form className="home-hero__search" action="/catalog">
            <input
              className="ui-input"
              name="query"
              aria-label="상품 검색어"
              placeholder="강아지 사료, 고양이 모래, 배변패드 검색"
            />
            <Button type="submit" variant="primary">
              검색
            </Button>
          </form>
        </div>
        <aside className="home-hero__panel">
          <Typography type="label" size="xs" className="home-hero__panel-label">
            오늘의 수집 현황
          </Typography>
          <div className="home-hero__stats">
            <StatTile
              label="추적 상품"
              value={`${summary.trackedCount.toLocaleString("ko-KR")}개`}
            />
            <StatTile
              label="가격 기록"
              value={`${summary.historyCount.toLocaleString("ko-KR")}건`}
            />
            <StatTile label="오늘 하락" value={`${topDrops.length}개`} />
          </div>
          <div className="home-hero__collect">
            <Typography type="body" size="sm">
              최근 수집 ·{" "}
              {summary.lastCollectedAt
                ? formatCheckedAt(summary.lastCollectedAt)
                : "수집 전"}
            </Typography>
            <Typography as="strong" type="label" size="xs">
              {summary.lastCollectedAt ? "정상 작동" : "대기 중"}
            </Typography>
          </div>
        </aside>
      </section>

      <Reveal>
        <section className="home-section">
          <SectionHeading
            eyebrow="급락 특가"
            title="최근 가격이 내려간 상품"
            action={
              <Link className="home-section__more" href="/deals">
                <Typography type="label" size="md">
                  전체 보기 →
                </Typography>
              </Link>
            }
          />
          {topDrops.length ? (
            <div className="card-grid">
              {topDrops.map((stats) => (
                <PriceCard stats={stats} key={stats.externalProductId} />
              ))}
            </div>
          ) : (
            <EmptyState>
              아직 수집된 가격이 없어요. 매일 자동 수집이 시작되면 이곳에 급락 특가가
              표시됩니다.
            </EmptyState>
          )}
        </section>
      </Reveal>

      <Reveal>
        <section className="home-section">
          <SectionHeading eyebrow="카테고리" title="카테고리로 둘러보기" />
          <div className="home-cats">
            {categories.map((category) => (
              <Link
                className="home-cats__item"
                href={`/catalog?category=${category.slug}`}
                key={category.slug}
              >
                <Typography type="bodyBold" size="lg">
                  {category.label}
                </Typography>
                <Typography as="small" type="caption" size="lg">
                  둘러보기 →
                </Typography>
              </Link>
            ))}
          </div>
          {Object.keys(categoryTop).length ? (
            <CategoryTopProducts
              categories={categories}
              productsByCategory={categoryTop}
            />
          ) : null}
        </section>
      </Reveal>

      <Reveal>
        <section className="home-links">
          <div className="home-links__card home-links__card--green">
            <Typography as="strong" type="title" size="sm">
              동물병원 찾기
            </Typography>
            <Typography as="p" type="body" size="sm">
              공공데이터 기반으로 우리 동네 동물병원을 확인하세요.
            </Typography>
            <Button href="/hospitals" variant="green-dark" size="sm">
              병원 보기
            </Button>
          </div>
          <div className="home-links__card">
            <Typography as="strong" type="title" size="sm">
              반려생활 가이드
            </Typography>
            <Typography as="p" type="body" size="sm">
              사료, 위생, 건강 관리에 필요한 정보를 확인하세요.
            </Typography>
            <Button href="/guide" variant="outline" size="sm">
              가이드 보기
            </Button>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
