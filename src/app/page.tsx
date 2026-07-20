import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import { fetchCatalogSummary, fetchTopDrops } from "@/lib/catalog";
import { formatCheckedAt } from "@/lib/format";
import { categories } from "@/lib/categories";

export const revalidate = 3600;

export default async function HomePage() {
  const [summary, topDrops] = await Promise.all([fetchCatalogSummary(), fetchTopDrops(6)]);

  return (
    <main className="home">
      <section className="home-hero">
        <p className="section-label">가격추적 카탈로그</p>
        <h1>반려용품 최저가를<br />매일 기록합니다.</h1>
        <p>등록된 상품의 가격을 매일 확인해 최근 14일 최고가 대비 하락한 상품을 모아 보여드려요.</p>
        <form className="home-hero__search" action="/catalog">
          <span aria-hidden="true">⌕</span>
          <input name="query" aria-label="상품 검색어" placeholder="강아지 사료, 고양이 모래, 배변패드 검색" />
          <button className="button button--primary" type="submit">검색하기</button>
        </form>
      </section>

      <section className="home-stats" aria-label="카탈로그 현황">
        <article>
          <span>추적 상품</span>
          <strong>{summary.trackedCount.toLocaleString("ko-KR")}개</strong>
        </article>
        <article>
          <span>가격 기록</span>
          <strong>{summary.historyCount.toLocaleString("ko-KR")}건</strong>
        </article>
        <article>
          <span>최근 수집</span>
          <strong>{summary.lastCollectedAt ? formatCheckedAt(summary.lastCollectedAt) : "수집 전"}</strong>
        </article>
      </section>

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <p className="section-label">급락 특가</p>
            <h2>최근 가격이 내려간 상품</h2>
          </div>
          <Link href="/deals">전체 보기 <span aria-hidden="true">›</span></Link>
        </div>
        {topDrops.length ? (
          <div className="card-grid">
            {topDrops.map((stats) => (
              <PriceCard stats={stats} key={stats.externalProductId} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>아직 수집된 가격이 없어요. 매일 자동 수집이 시작되면 이곳에 급락 특가가 표시됩니다.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <p className="section-label">카테고리</p>
            <h2>카테고리로 둘러보기</h2>
          </div>
        </div>
        <div className="category-tiles">
          {categories.map((category) => (
            <Link href={`/catalog?category=${category.slug}`} key={category.slug}>
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="home-links">
        <Link className="home-links__card" href="/hospitals">
          <strong>동물병원 찾기</strong>
          <p>공공데이터 기반으로 우리 동네 동물병원을 확인하세요.</p>
        </Link>
        <Link className="home-links__card" href="/guide">
          <strong>반려생활 가이드</strong>
          <p>사료, 위생, 건강 관리에 필요한 정보를 확인하세요.</p>
        </Link>
      </section>
    </main>
  );
}
