# 펫픽 로고·SEO·GEO 설계

날짜: 2026-07-22
상태: 사용자 승인

## 1. 목표

펫픽의 새 Pick Signal 발바닥 로고를 제품 UI와 검색 신호에 일관되게 적용한다. 검색엔진과 생성형 AI가 펫픽을 **반려용품 가격을 매일 기록하고, 가격 추이와 급락 정보를 보여주는 서비스**로 정확히 이해하고 인용할 수 있도록 공개 페이지의 사실·구조·접근성을 정비한다.

## 2. 로고 시스템

- 기준 심볼: `src/assets/brand/petpick-pick-signal.svg`
- 심볼은 라임 바탕의 강아지 발바닥과 가격 확인 체크로 구성한다.
- Header는 심볼과 한글 워드마크 `펫픽`, 한글 서브타이틀 `반려용품 가격추적`을 함께 사용한다.
- 앱 아이콘과 구조화 데이터의 `logo`는 같은 심볼을 사용한다.
- SVG 원본은 유지하고, 크롤러와 소셜 플랫폼이 접근 가능한 앱 아이콘 URL을 별도로 제공한다.

## 3. 사이트 URL과 메타데이터

- `NEXT_PUBLIC_SITE_URL`을 단일 운영 사이트 URL 환경 변수로 사용한다.
- 로컬 개발에서는 안전한 localhost 기본값을 사용하되, 배포 환경에는 반드시 실제 HTTPS 운영 도메인을 설정한다.
- 루트 metadata에 다음을 설정한다.
  - title template와 기본 description
  - `metadataBase`와 canonical URL
  - Open Graph title, description, locale `ko_KR`, site name `펫픽`, 공유 이미지
  - Twitter summary-large-image 카드
  - index/follow robots 정책
- 각 페이지는 고유 title·description·canonical을 제공한다. 필터·페이지네이션 URL은 색인 대상의 정규 목록 URL을 가리킨다.

## 4. 크롤링과 사이트맵

- `src/app/robots.ts`에서 일반 검색 크롤러와 `OAI-SearchBot`이 공개 페이지를 접근하도록 허용한다.
- robots 응답에 `/sitemap.xml` URL을 포함한다.
- `src/app/sitemap.ts`는 정적 핵심 URL과 추적 중인 모든 `/catalog/[id]` URL을 생성한다.
- 상품 URL의 `lastModified`는 마지막 가격 확인 시각을 사용한다.
- Supabase 클라이언트가 없는 개발 환경에서는 정적 URL만 반환한다.
- 로그인·관심상품처럼 개인별 상태가 필요한 경로는 사이트맵에 넣지 않는다.

## 5. 구조화 데이터

### 홈

- `OnlineStore` JSON-LD: 서비스명, 대체명, 운영 URL, 로고, 한국어 설명
- `WebSite` JSON-LD: 사이트명, URL, 언어, 카탈로그 검색 URL 템플릿

### 상품 상세

- 기존 `Product`/`Offer` JSON-LD를 유지·보강한다.
- 실제 수집 값만 사용한다: 상품명, 이미지, 현재 가격, KRW, 판매처 구매 URL, 마지막 확인 시각.
- 전체 쇼핑몰 최저가·가격 보장·실시간 가격 같은 검증 불가능한 주장은 사용하지 않는다.

### 가격 기록 방식 페이지

- `/price-tracking`에 `AboutPage`와 `FAQPage` JSON-LD를 포함한다.
- 서비스 목적, 일일 수집 방식, 네이버 쇼핑 기준 가격, 14일 하락률, 마지막 확인 시각, 실제 판매가·배송비·재고의 한계를 설명한다.
- FAQ는 페이지에 표시되는 질문·답변과 정확히 같은 내용만 제공한다.

## 6. Open Graph 이미지

- `src/app/opengraph-image.tsx`에서 1200×630 PNG를 동적으로 생성한다.
- 카드에는 새 심볼, `펫픽`, `반려용품 가격추적`, 서비스 가치 문구를 넣는다.
- 외부 폰트 의존 없이 읽을 수 있는 폰트 스택과 간결한 형태를 사용한다.
- OG 이미지는 로고 심볼의 라임과 기존 네이비·블루그레이 토큰을 사용한다.

## 7. 가격 기록 방식 페이지의 정보 구조

1. 펫픽이 기록하는 정보
2. 매일 수집되는 가격의 기준과 갱신 주기
3. 14일 최고가 대비 하락률의 계산 방식
4. 마지막 확인 시각의 의미
5. 가격·배송비·재고 확인에 대한 안내
6. 자주 묻는 질문

이 페이지는 마케팅 주장보다 데이터 출처·범위·한계를 앞에 배치한다.

## 8. 검증

- `npm run lint`와 `npm run build`
- `/robots.txt`, `/sitemap.xml`, `/opengraph-image`가 정상 응답하는지 확인
- 홈·가격 기록 방식·상품 상세의 metadata와 JSON-LD를 DOM에서 검증
- Header의 새 로고가 데스크톱과 모바일에서 잘리는 부분 없이 표시되는지 확인
- Supabase 환경 변수 없이 실행했을 때 사이트맵이 정적 URL을 반환하는지 확인

## 9. 제외 범위

- 자동 콘텐츠 생성이나 대량 AI용 랜딩 페이지
- 허위 리뷰·FAQ·가격 주장
- 개인화된 관심상품 또는 인증 페이지의 색인
- 외부 AI 플랫폼별 별도 계정 등록이나 유료 배포
