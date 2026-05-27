import Link from "next/link";

const recommendedQueries = ["강아지 사료", "고양이 모래", "배변패드", "강아지 샴푸", "고양이 간식", "관절 영양제"];

const shortcutCategories = [
  { label: "사료", query: "반려동물 사료" },
  { label: "간식", query: "반려동물 간식" },
  { label: "배변패드", query: "배변패드" },
  { label: "고양이 모래", query: "고양이 모래" },
  { label: "영양제", query: "반려동물 영양제" },
  { label: "샴푸", query: "강아지 샴푸" },
  { label: "장난감", query: "반려동물 장난감" },
  { label: "이동장", query: "반려동물 이동장" }
];

const todaySearches = [
  { label: "강아지 사료 인기상품 보기", query: "강아지 사료 인기상품" },
  { label: "고양이 모래 가격 보기", query: "고양이 모래" },
  { label: "배변패드 가격 보기", query: "배변패드" },
  { label: "관절 영양제 비교하기", query: "강아지 관절 영양제" }
];

export default function HomePage() {
  return (
    <main className="home">
      <section className="dashboard-hero dashboard-hero--search">
        <div className="dashboard-hero__content">
          <p className="section-label">용품 가격 검색</p>
          <h1>반려동물 용품 가격을 비교해보세요.</h1>
          <p>사료, 간식, 배변패드, 고양이 모래처럼 자주 사는 용품을 검색하고 관심 상품으로 저장해 가격 변화를 확인합니다.</p>
          <form className="dashboard-search" action="/products">
            <label htmlFor="dashboard-query">검색어</label>
            <input id="dashboard-query" name="query" placeholder="예: 강아지 사료, 고양이 모래" />
            <button className="button button--primary" type="submit">
              검색
            </button>
          </form>
          <div className="quick-links" aria-label="추천 검색어">
            {recommendedQueries.map((query) => (
              <Link className="quick-links__item" href={`/products?query=${encodeURIComponent(query)}`} key={query}>
                {query}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__heading">
          <div>
            <p className="section-label">많이 찾는 용품 바로가기</p>
            <h2>자주 구매하는 카테고리부터 확인하세요.</h2>
          </div>
        </div>
        <div className="category-grid">
          {shortcutCategories.map((category) => (
            <Link className="category-card" href={`/products?query=${encodeURIComponent(category.query)}`} key={category.label}>
              <span>{category.label}</span>
              <strong>가격 검색하기</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__heading">
          <div>
            <p className="section-label">오늘 확인해볼 상품/검색어</p>
            <h2>처음 확인하기 좋은 검색 흐름입니다.</h2>
          </div>
        </div>
        <div className="action-list">
          {todaySearches.map((item) => (
            <Link className="action-item" href={`/products?query=${encodeURIComponent(item.query)}`} key={item.label}>
              <span>{item.label}</span>
              <strong>바로 보기</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-band">
        <article>
          <p className="section-label">내 관심상품 가격 변화</p>
          <h2>저장한 상품이 생기면 가격 변화를 여기서 이어서 확인합니다.</h2>
          <p>아직 저장 상품이 없다면 먼저 상품을 검색해 관심 상품으로 저장해보세요.</p>
          <Link className="button button--primary" href="/products">
            관심상품 찾기
          </Link>
        </article>
        <article>
          <p className="section-label">최근 확인 상품</p>
          <h2>최근 검색하거나 저장한 상품 기록을 쌓아갈 예정입니다.</h2>
          <p>상품을 저장하면 저장 당시 가격과 마지막 확인 시각을 기준으로 가격 흐름을 볼 수 있습니다.</p>
          <Link className="button button--secondary" href="/saved">
            저장한 상품 보기
          </Link>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__heading">
          <div>
            <p className="section-label">반려생활 정보</p>
            <h2>가격 확인과 함께 필요한 생활 정보를 연결합니다.</h2>
          </div>
        </div>
        <div className="info-grid">
          <Link className="info-card" href="/hospitals">
            <span>동물병원 찾기</span>
            <strong>지역, 병원명, 주소로 공공데이터 기반 동물병원 정보를 검색합니다.</strong>
          </Link>
          <article className="info-card">
            <span>공공데이터 안내</span>
            <strong>방문 전 운영 여부와 진료 가능 여부는 병원에 직접 확인해주세요.</strong>
          </article>
        </div>
      </section>

      <section className="source-note">
        <h2>가격 정보 안내</h2>
        <p>상품 가격은 네이버 쇼핑 API 검색 결과를 기준으로 표시됩니다. 최종 가격, 배송비, 재고 여부는 쇼핑몰에서 확인해주세요.</p>
      </section>
    </main>
  );
}
