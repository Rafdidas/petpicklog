import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.scss";

export const metadata: Metadata = {
  title: "펫픽 | 반려동물 생활 플랫폼",
  description: "반려동물 용품 가격과 우리 동네 동물병원, 반려생활 정보를 한 곳에서 확인합니다."
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
