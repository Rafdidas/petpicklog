import Link from "next/link";
import Image from "next/image";
import { demoHospitals, demoProducts } from "@/lib/demo";

const formatPrice = (price: number) => new Intl.NumberFormat("ko-KR").format(price);

export default function HomePage() {
  const lowestProduct = demoProducts.reduce((lowest, product) => (product.latestPrice < lowest.latestPrice ? product : lowest));

  return (
    <main className="home">
      <section className="home--hero">
        <div className="home--hero__content">
          <p className="home--hero__eyebrow">가격 비교부터 동네 정보까지</p>
          <h1>우리 애 용품, 다시 찾기 쉽게 저장하고 비교하세요.</h1>
          <p className="home--hero__copy">
            쇼핑 API 기반 상품 검색, 찜한 상품 가격 기록, 공공데이터 기반 동물병원 목록을 MVP 범위로 시작합니다.
          </p>
          <div className="home--hero__actions">
            <Link className="button button--primary" href="/products">
              용품 검색하기
            </Link>
            <Link className="button button--secondary" href="/hospitals">
              동물병원 찾기
            </Link>
          </div>
        </div>
        <div className="home--hero__panel" aria-label="오늘의 가격 확인 예시">
          <span>최근 확인 상품</span>
          <strong>{lowestProduct.title}</strong>
          <p>{formatPrice(lowestProduct.latestPrice)}원</p>
          <small>최종 가격은 쇼핑몰에서 확인해주세요.</small>
        </div>
      </section>

      <section className="home--summary" aria-label="MVP 핵심 기능">
        <article>
          <span>01</span>
          <h2>외부 검색 결과 분리</h2>
          <p>검색 API 결과는 `external_products` 후보로 다루고, 내부 정제 상품과 섞지 않습니다.</p>
        </article>
        <article>
          <span>02</span>
          <h2>찜 기반 가격 기록</h2>
          <p>처음부터 모든 상품을 추적하지 않고 사용자가 저장한 상품부터 가격 변화를 쌓습니다.</p>
        </article>
        <article>
          <span>03</span>
          <h2>공공정보로 초기 콘텐츠 확보</h2>
          <p>지도 SDK 없이도 주소와 외부 지도 링크 중심의 동물병원 목록을 먼저 제공합니다.</p>
        </article>
      </section>

      <section className="home--preview">
        <div>
          <p className="section-label">상품 후보</p>
          <h2>데모 데이터가 있어 API 키 없이도 화면을 확인할 수 있습니다.</h2>
        </div>
        <div className="product-grid">
          {demoProducts.slice(0, 2).map((product) => (
            <article className="product-card" key={product.externalId}>
              <Image src={product.imageUrl} alt="" width={600} height={450} />
              <div className="product-card--body">
                <span>{product.mallName}</span>
                <h3>{product.title}</h3>
                <p>{formatPrice(product.latestPrice)}원</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home--preview">
        <div>
          <p className="section-label">동물병원</p>
          <h2>지역 기반 공공데이터 화면의 첫 형태입니다.</h2>
        </div>
        <div className="hospital-list">
          {demoHospitals.slice(0, 2).map((hospital) => (
            <article className="hospital-item" key={hospital.id}>
              <div>
                <strong>{hospital.name}</strong>
                <p>{hospital.roadAddress}</p>
              </div>
              <span>{hospital.status}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
