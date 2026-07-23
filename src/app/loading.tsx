import Loading from "@/components/ui/Loading";

// App Router 규약: 라우트 세그먼트가 로딩되는 동안 자동으로 표시되는 Suspense 폴백.
// 루트에 두어 모든 페이지 진입 시 공통으로 적용된다.
export default function RootLoading() {
  return <Loading />;
}
