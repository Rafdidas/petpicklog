import Link from "next/link";
import HomeDashboardClient from "./home-dashboard-client";

const recommendedQueries = ["강아지 사료", "고양이 모래", "배변패드", "강아지 샴푸", "고양이 간식", "관절 영양제", "피부 영양제", "장난감"];

const quickFeatures = [
  { key: "price", title: "용품 가격 확인", description: "사료, 간식, 배변용품 등 가격을 검색해보세요.", href: "/products", cta: "가격 확인하기" },
  { key: "saved", title: "관심상품", description: "저장한 상품의 가격 변화를 다시 확인해보세요.", href: "/saved", cta: "관심상품 보기" },
  { key: "hospital", title: "동물병원", description: "공공데이터 기반 우리 동네 동물병원 정보를 확인해보세요.", href: "/hospitals", cta: "동물병원 찾기" },
  { key: "guide", title: "반려생활 가이드", description: "사료, 위생, 건강 관련 정보를 차근차근 확인해보세요.", href: "/guide", cta: "가이드 보기" }
];

const categories = [
  { label: "사료", query: "강아지 사료", key: "food" },
  { label: "간식", query: "반려동물 간식", key: "snack" },
  { label: "배변패드", query: "배변패드", key: "pad" },
  { label: "고양이 모래", query: "고양이 모래", key: "litter" },
  { label: "샴푸·위생용품", query: "강아지 샴푸", key: "shampoo" },
  { label: "영양제", query: "반려동물 영양제", key: "supplement" },
  { label: "장난감", query: "반려동물 장난감", key: "toy" },
  { label: "하우스·이동장", query: "반려동물 이동장", key: "house" }
];

const guideItems = [
  { tag: "사료 가이드", title: "우리 아이에게 맞는 사료 고르는 방법", date: "기초 가이드" },
  { tag: "간식 정보", title: "강아지 간식을 고를 때 확인할 것", date: "기초 가이드" },
  { tag: "위생 관리", title: "고양이 화장실 관리 체크리스트", date: "기초 가이드" },
  { tag: "병원 안내", title: "동물병원 방문 전 확인할 것", date: "기초 가이드" }
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    price: <><path d="M6 7h12l-1 12H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></>,
    saved: <path d="M7 4h10v16l-5-3-5 3V4Z" />,
    hospital: <><path d="M5 20V8h14v12" /><path d="M9 8V4h6v4M9 13h6M12 10v6" /></>,
    guide: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></>,
    food: <><path d="M5 9h14l-1.5 10h-11L5 9Z" /><path d="M9 9c0-3 6-3 6 0" /></>,
    snack: <><path d="M8 9 5 6l2-2 3 3h4l3-3 2 2-3 3v6l3 3-2 2-3-3h-4l-3 3-2-2 3-3V9Z" /></>,
    pad: <><path d="M5 6h14v12H5z" /><path d="m8 9 8 6M16 9l-8 6" /></>,
    litter: <><path d="M4 12h16l-2 7H6l-2-7Z" /><path d="M7 12c2-4 8-4 10 0" /></>,
    shampoo: <><path d="M9 7h6v3l2 2v8H7v-8l2-2V7Z" /><path d="M10 4h5M15 4v3" /></>,
    supplement: <><path d="M8 5h8v3H8zM7 8h10v12H7z" /><path d="M10 14h4M12 12v4" /></>,
    toy: <><circle cx="12" cy="12" r="7" /><path d="M7 9c3 1 7 5 10 6M9 17c1-3 5-7 6-10" /></>,
    house: <><path d="m4 11 8-7 8 7v9H4v-9Z" /><path d="M9 20v-6h6v6" /></>
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function HomePage() {
  return (
    <main className="home home-platform">
      <section className="platform-hero">
        <div className="platform-hero__content">
          <p className="section-label">반려동물 생활 플랫폼</p>
          <h1>반려생활에 필요한<br />정보를 한곳에서 확인하세요.</h1>
          <p>사료, 간식, 배변용품 가격을 검색하고 관심상품으로 저장해보세요.<br />우리 동네 동물병원 정보와 반려생활 가이드도 함께 확인할 수 있어요.</p>
          <form className="platform-search" action="/products">
            <span aria-hidden="true">⌕</span>
            <input name="query" aria-label="용품 검색어" placeholder="강아지 사료, 고양이 모래, 배변패드 검색" />
            <button className="button button--primary" type="submit">가격 확인하기</button>
          </form>
          <div className="platform-keywords" aria-label="추천 검색어">
            <strong>추천 검색어</strong>
            {recommendedQueries.map((query) => (
              <Link href={`/products?query=${encodeURIComponent(query)}`} key={query}>{query}</Link>
            ))}
          </div>
        </div>
        <aside className="platform-hero__aside">
          <span>바로가기</span>
          <strong>우리 동네 동물병원을<br />찾아보세요.</strong>
          <Link className="button button--secondary" href="/hospitals">동물병원 찾기</Link>
        </aside>
      </section>

      <section className="platform-section">
        <div className="platform-section__heading"><h2>빠른 기능</h2></div>
        <div className="feature-grid">
          {quickFeatures.map((feature) => (
            <Link className={`feature-card feature-card--${feature.key}`} href={feature.href} key={feature.title}>
              <span className="feature-card__icon"><Icon name={feature.key} /></span>
              <div><h3>{feature.title}</h3><p>{feature.description}</p></div>
              <strong>{feature.cta} <span aria-hidden="true">›</span></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="platform-section">
        <div className="platform-section__heading">
          <div><h2>많이 찾는 용품</h2><p>자주 구매하는 반려동물 용품의 가격을 바로 확인해보세요.</p></div>
          <Link href="/products">전체 보기 <span aria-hidden="true">›</span></Link>
        </div>
        <div className="popular-grid">
          {categories.map((category) => (
            <Link href={`/products?query=${encodeURIComponent(category.query)}`} key={category.label}>
              <span><Icon name={category.key} /></span><strong>{category.label}</strong>
            </Link>
          ))}
        </div>
      </section>

      <HomeDashboardClient />

      <section className="platform-section">
        <div className="platform-section__heading">
          <div><h2>반려생활 가이드</h2><p>사료, 위생, 건강 관리에 필요한 정보를 하나씩 정리해보세요.</p></div>
          <Link href="/guide">더 많은 정보 보기 <span aria-hidden="true">›</span></Link>
        </div>
        <div className="guide-preview-grid">
          {guideItems.map((item) => (
            <Link href="/guide" key={item.title}>
              <span>{item.tag}</span><h3>{item.title}</h3><small>{item.date}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="platform-source-note">
        <div><strong>상품 가격 안내</strong><p>상품 가격은 외부 쇼핑 API 또는 데모 데이터를 기준으로 표시됩니다. 최종 가격, 배송비, 재고 여부는 쇼핑몰에서 확인해주세요.</p></div>
        <div><strong>동물병원 정보 안내</strong><p>동물병원 정보는 공공데이터를 기반으로 제공됩니다. 방문 전 운영 여부와 진료 가능 여부를 병원에 직접 확인해주세요.</p></div>
      </section>
    </main>
  );
}
