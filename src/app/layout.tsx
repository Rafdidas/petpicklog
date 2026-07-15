import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import Header from "@/components/Header";
import "./globals.scss";

export const metadata: Metadata = {
  title: "펫픽 | 반려용품 가격추적",
  description: "반려동물 용품의 가격을 매일 기록하고, 급락 특가와 가격 추이를 확인하는 가격추적 서비스입니다."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
