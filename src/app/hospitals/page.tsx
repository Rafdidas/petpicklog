import { demoHospitals } from "@/lib/demo";

const getNaverMapSearchUrl = (keyword: string) => `https://map.naver.com/p/search/${encodeURIComponent(keyword)}`;

export default function HospitalsPage() {
  return (
    <main className="hospitals-page">
      <section className="page-heading">
        <p className="section-label">동물병원</p>
        <h1>지역별 동물병원 정보를 주소 기반 목록으로 확인합니다.</h1>
      </section>

      <section className="filter-strip" aria-label="지역 필터">
        <button className="filter-strip__item filter-strip__item--active" type="button">
          전체
        </button>
        <button className="filter-strip__item" type="button">
          서울
        </button>
        <button className="filter-strip__item" type="button">
          부산
        </button>
      </section>

      <section className="hospital-list">
        {demoHospitals.map((hospital) => (
          <article className="hospital-item" key={hospital.id}>
            <div>
              <span>
                {hospital.sido} {hospital.sigungu}
              </span>
              <strong>{hospital.name}</strong>
              <p>{hospital.roadAddress}</p>
              <small>{hospital.phone}</small>
            </div>
            <a
              className="button button--secondary"
              href={getNaverMapSearchUrl(`${hospital.name} ${hospital.roadAddress}`)}
              target="_blank"
              rel="noreferrer"
            >
              네이버 지도
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
