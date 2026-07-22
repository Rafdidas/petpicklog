import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/site";
import "./globals.scss";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: `${SITE_NAME} | 반려용품 가격추적`,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    description: SITE_DESCRIPTION,
    images: "/opengraph-image",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 반려용품 가격추적`,
    type: "website"
  },
  twitter: {
    card: "summary_large_image"
  },
  robots: {
    follow: true,
    index: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
