import Link from "next/link";
import Typography from "@/components/ui/Typography";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="inner-cont">
          <Typography type="body" size="sm">펫픽 · 반려동물 용품 가격추적 서비스</Typography>
          <Typography type="body" size="sm"> · </Typography>
          <Typography type="body" size="sm">표시 가격은 수집 시점 기준이며 실제 판매가와 다를 수 있습니다.</Typography>
        </div>
        <Link href="/price-tracking"><Typography type="label" size="sm">가격 기록 방식</Typography></Link>
      </div>
    </footer>
  );
}
