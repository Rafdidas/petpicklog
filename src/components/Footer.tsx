import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="inner-cont">
          <span>펫픽 · 반려동물 용품 가격추적 서비스</span>
          <span> · </span>
          <span>표시 가격은 수집 시점 기준이며 실제 판매가와 다를 수 있습니다.</span>
        </div>
        <Link href="/price-tracking">가격 기록 방식</Link>
      </div>
    </footer>
  );
}
