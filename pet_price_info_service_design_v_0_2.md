# 반려동물 용품 가격 비교·정보 서비스 설계서 v0.1

## 1. 서비스 개요

### 1.1 서비스 한 줄 정의

반려동물 용품의 쇼핑몰 가격을 비교하고, 관심 상품을 저장하며, 공공데이터 기반 반려동물 생활 정보를 함께 제공하는 서비스.

### 1.2 서비스 방향

초기에는 **가격 비교 + 찜/링크 저장 + 공공정보 제공**을 핵심으로 시작한다.

이후 사용자 행동 데이터와 구매 후 리뷰 데이터를 축적하여, 장기적으로는 **반려동물 용품 리뷰·추천 플랫폼**으로 확장한다.

초기부터 “반려동물판 화해”를 완성하려고 하지 않는다. 상품 DB와 리뷰 데이터가 없는 상태에서 시작하기 어렵기 때문에, 외부 쇼핑 API와 공공데이터를 활용해 초기 기능을 구성하고, 사용자의 저장/리뷰 데이터를 내부 자산으로 쌓아간다.

### 1.3 단계별 확장 방향

```txt
1단계: 반려동물 용품 검색 / 가격 비교
2단계: 찜 / 링크 저장 / 가격 추이 확인
3단계: 구매 후 리뷰 작성 유도
4단계: 사용자 리뷰 기반 추천 / 랭킹
5단계: 내부 상품 DB 정제 및 반려동물 조건별 추천 고도화
```

---

## 2. 핵심 문제 정의

반려동물 보호자는 용품을 구매할 때 다음과 같은 문제를 겪는다.

```txt
같은 상품인데 쇼핑몰마다 가격이 다르다.
최저가가 자주 바뀐다.
사료, 간식, 배변용품, 고양이 모래 등을 어디서 봤는지 기억하기 어렵다.
관심 상품을 따로 저장해두기 번거롭다.
구매 후 실제 사용 후기를 남기거나 참고할 곳이 부족하다.
동물병원, 반려동물 관련 공공정보가 여러 곳에 흩어져 있다.
```

이 서비스는 초기에는 **구매 전 탐색과 저장 문제**를 해결하는 것을 목표로 한다.

---

## 3. 주요 기능

## 3.1 반려동물 용품 검색

사용자는 사료, 간식, 배변패드, 고양이 모래, 영양제, 장난감 등의 반려동물 용품을 검색할 수 있다.

초기 상품 데이터는 직접 보유하지 않고, 쇼핑몰 검색 API를 통해 가져온다.

### 검색 결과 정보

```txt
상품명
쇼핑몰명
가격
상품 이미지
상품 링크
브랜드 추정값
카테고리
API 출처
```

### 설계 원칙

검색 API 결과를 곧바로 내부의 정식 상품 DB로 보지 않는다.

```txt
외부 API 검색 결과 = external_products
내부에서 정제한 상품 = products
```

즉, `external_products`는 외부 검색 결과 기반의 상품 후보이며, `products`는 나중에 관리자가 정제하거나 사용자 데이터가 쌓인 뒤 승격된 내부 상품이다.

---

## 3.2 최저가 비교

동일하거나 유사한 상품을 기준으로 쇼핑몰별 가격을 비교한다.

초기에는 완벽한 동일 상품 자동 매칭을 목표로 하지 않는다. 상품명, 브랜드, 용량, 카테고리 등을 기반으로 유사 상품 후보를 보여주는 수준으로 시작한다.

### 1차 방식

```txt
검색어 기준으로 쇼핑 API 결과 표시
사용자가 원하는 상품을 찜
찜한 상품 기준으로 가격 재조회
제목 유사도 + 브랜드 + 용량을 기준으로 동일 상품 후보 그룹핑
```

### 가격 비교 화면 정보

```txt
상품명
현재 최저가
쇼핑몰별 가격 목록
최근 가격 확인 시각
구매 링크
찜 버튼
```

---

## 3.3 가격 추이

사용자가 찜한 상품은 주기적으로 가격을 저장하여 가격 변화를 확인할 수 있게 한다.

처음부터 모든 상품의 가격을 추적하지 않는다.

### 가격 추적 대상

```txt
사용자가 찜한 상품
리뷰가 작성된 상품
관리자가 주요 상품으로 지정한 상품
```

### 가격 추이 데이터

```txt
상품 ID
외부 상품 ID
API 출처
가격
쇼핑몰명
상품 URL
수집 시각
```

### 표시 정책

```txt
가격은 실시간 또는 최근 수집 기준으로 표시한다.
오래된 가격에는 마지막 확인 시각을 함께 표시한다.
정확한 최종 가격은 쇼핑몰 이동 후 확인하도록 안내한다.
```

예시 문구:

```txt
최종 가격은 쇼핑몰에서 확인해주세요.
마지막 가격 확인: 2026-05-18 14:30
```

---

## 3.4 링크 저장 / 찜하기

사용자는 관심 있는 상품을 저장할 수 있다.

### 찜 상태

```txt
관심 있음
구매 예정
사용 중
사용해봄
다시 살 예정
```

초기 MVP에서는 단순 찜 기능만 제공해도 된다.

### 1차 기능

```txt
상품 찜하기
찜 목록 보기
상품 링크로 이동
현재 가격 확인
저장 당시 가격과 현재 가격 비교
```

---

## 3.5 외부 쇼핑몰 링크 이동

서비스 자체에서 직접 결제를 처리하지 않는다.

사용자는 상품 검색 및 가격 비교 후 외부 쇼핑몰 링크로 이동하여 구매한다.

### 구매 플로우

```txt
상품 검색
→ 가격 비교
→ 쇼핑몰 링크 클릭
→ 외부 쇼핑몰에서 구매
→ 서비스로 돌아와서 사용 후기 작성 유도
```

### 정책

```txt
서비스는 쇼핑몰이 아니다.
결제, 배송, 환불은 외부 쇼핑몰에서 처리된다.
서비스는 가격 비교, 저장, 후기, 정보 제공 역할을 한다.
```

---

## 3.6 구매 후 리뷰 유도

초기에는 리뷰가 핵심 기능이 아니라 보조 기능이다.

하지만 장기적으로는 리뷰가 서비스의 핵심 자산이 된다.

### 리뷰 작성 유도 시점

```txt
찜한 상품을 “사용해봄” 상태로 변경할 때
상품 상세에서 “사용 후기 남기기” 버튼 클릭 시
구매 링크 클릭 후 일정 시간이 지난 뒤
```

### 사료 / 간식 / 영양제 리뷰 항목

```txt
반려동물 종류: 강아지 / 고양이
품종
나이
체중
주요 고민: 눈물 / 피부 / 장 / 입맛 / 알러지 / 체중관리
기호성
변 상태
피부 반응
눈물 변화
구토 여부
재구매 의사
한줄 후기
상세 후기
```

### 일반 용품 리뷰 항목

```txt
내구성
세척 편의성
가성비
소음
크기 적합성
재구매 의사
상세 후기
```

---

## 3.7 공공데이터 기반 반려동물 정보

초반 핵심 기능으로 공공데이터 기반 반려동물 정보를 제공한다.

사용자 리뷰가 없어도 공공데이터 기반 페이지는 초기 콘텐츠와 SEO 유입원이 될 수 있다.

### 우선 제공할 공공정보

```txt
전국 동물병원 정보
지역별 동물병원 검색
반려동물 사료 관련 공공데이터
동물병원 주소 / 영업상태 / 전화번호
지역별 반려동물 관련 시설 정보
```

### 초기 공공정보 기능

```txt
지역 선택
동물병원 목록 조회
주소 확인
전화번호 확인
영업상태 확인
네이버 지도 / 카카오맵 외부 링크 이동
```

초기에는 지도 SDK를 붙이지 않아도 된다. 주소 기반 리스트와 외부 지도 링크만으로 MVP를 구성할 수 있다.

---

# 4. 서비스 구조

## 4.1 데이터 원천 분리

이 설계에서 가장 중요한 원칙은 데이터 원천을 분리하는 것이다.

```txt
외부 쇼핑 API 데이터
공공데이터
사용자 저장 데이터
사용자 리뷰 데이터
내부 정제 상품 데이터
```

이 5가지를 섞지 않는다.

### 분리하는 이유

```txt
쇼핑 API 데이터는 변동성이 크다.
공공데이터는 주기적으로 갱신된다.
사용자 찜/리뷰는 우리 서비스의 핵심 자산이다.
내부 정제 상품 DB는 나중에 천천히 구축한다.
```

---

# 5. DB 설계

## 5.1 profiles

Supabase Auth를 사용할 경우, 별도 users 테이블은 프로필 역할만 한다.

```sql
profiles
- id uuid primary key
- nickname text
- created_at timestamptz
- updated_at timestamptz
```

---

## 5.2 pet_profiles

반려동물 프로필은 장기적으로 리뷰 추천과 조건별 필터에 필요하다.

```sql
pet_profiles
- id uuid primary key
- user_id uuid
- name text
- pet_type text -- DOG, CAT
- breed text
- birth_year int
- weight numeric
- concerns text[] -- TEAR, SKIN, STOMACH, ALLERGY, PICKY, WEIGHT
- allergies text[]
- created_at timestamptz
- updated_at timestamptz
```

초기에는 선택 입력으로 둔다.

---

## 5.3 external_products

쇼핑 API에서 가져온 원본 상품 후보를 저장한다.

```sql
external_products
- id uuid primary key
- source text -- NAVER, COUPANG
- external_id text
- title text
- brand text
- category text
- image_url text
- product_url text
- mall_name text
- latest_price int
- raw_data jsonb
- first_seen_at timestamptz
- last_synced_at timestamptz
```

### 역할

```txt
API 검색 결과 캐시
사용자가 찜하거나 리뷰한 상품 후보
가격 추적 대상
```

### 주의

`external_products`는 정식 상품 DB가 아니다.

---

## 5.4 products

나중에 리뷰가 쌓인 상품만 내부 정제 상품으로 승격한다.

```sql
products
- id uuid primary key
- name text
- brand text
- category text
- pet_type text -- DOG, CAT, BOTH
- product_type text -- FOOD, SNACK, SUPPLEMENT, PAD, LITTER, TOY, ETC
- description text
- ingredients_text text
- nutrition_text text
- image_url text
- status text -- DRAFT, ACTIVE, HIDDEN
- created_at timestamptz
- updated_at timestamptz
```

---

## 5.5 product_sources

내부 상품과 외부 쇼핑 API 상품을 연결한다.

동일 상품의 쇼핑몰별 링크를 묶기 위한 테이블이다.

```sql
product_sources
- id uuid primary key
- product_id uuid
- external_product_id uuid
- source text
- product_url text
- mall_name text
- is_primary boolean
- created_at timestamptz
```

이 테이블이 있으면 나중에 네이버, 쿠팡, 직접 등록 상품을 하나의 내부 상품으로 묶을 수 있다.

---

## 5.6 price_histories

상품 가격 추이 데이터를 저장한다.

```sql
price_histories
- id uuid primary key
- external_product_id uuid
- product_id uuid null
- source text
- mall_name text
- price int
- product_url text
- checked_at timestamptz
```

### 설계 포인트

초기에는 `external_product_id` 기준으로 가격을 저장한다.

나중에 정제된 상품으로 묶이면 `product_id`도 연결한다.

이렇게 하면 나중에 내부 상품 DB가 생겨도 기존 가격 데이터를 버리지 않아도 된다.

---

## 5.7 saved_products

사용자의 찜 / 링크 저장 데이터를 저장한다.

```sql
saved_products
- id uuid primary key
- user_id uuid
- external_product_id uuid null
- product_id uuid null
- status text -- WISHLIST, WANT_TO_BUY, USING, USED, REPURCHASE
- memo text
- saved_price int null
- created_at timestamptz
- updated_at timestamptz
```

### 설계 포인트

초기에는 `external_product_id`만 있어도 된다.

나중에 정식 상품으로 승격되면 `product_id`를 연결한다.

---

## 5.8 product_reviews

상품 리뷰의 공통 정보를 저장한다.

```sql
product_reviews
- id uuid primary key
- user_id uuid
- pet_profile_id uuid null
- external_product_id uuid null
- product_id uuid null
- rating int
- repurchase_intent boolean
- review_type text -- FOOD, ITEM
- content text
- created_at timestamptz
- updated_at timestamptz
```

리뷰는 공통 리뷰와 상세 리뷰를 분리한다.

---

## 5.9 food_review_details

사료, 간식, 영양제 리뷰 상세 정보.

```sql
food_review_details
- review_id uuid primary key
- palatability_score int
- stool_status text -- BETTER, SAME, SOFT, DIARRHEA
- tear_status text -- BETTER, SAME, WORSE, UNKNOWN
- skin_status text -- GOOD, ITCHY, REDNESS, UNKNOWN
- vomit_status text -- NONE, OCCASIONAL, FREQUENT
```

---

## 5.10 item_review_details

일반 용품 리뷰 상세 정보.

```sql
item_review_details
- review_id uuid primary key
- durability_score int
- cleaning_score int
- noise_score int
- size_fit_score int
- value_score int
```

---

## 5.11 animal_hospitals

공공데이터 기반 동물병원 정보를 저장한다.

```sql
animal_hospitals
- id uuid primary key
- source_id text
- name text
- status text
- phone text
- road_address text
- lot_address text
- sido text
- sigungu text
- latitude numeric
- longitude numeric
- license_date date
- raw_data jsonb
- synced_at timestamptz
```

---

## 5.12 saved_hospitals

사용자가 저장한 동물병원 정보.

```sql
saved_hospitals
- id uuid primary key
- user_id uuid
- hospital_id uuid
- memo text
- created_at timestamptz
```

초기 MVP에서는 제외해도 된다.

---

## 5.13 hospital_reviews

동물병원 리뷰 정보.

```sql
hospital_reviews
- id uuid primary key
- user_id uuid
- hospital_id uuid
- rating int
- content text
- created_at timestamptz
```

초기 MVP에서는 제외해도 된다.

---

# 6. 페이지 설계

## 6.1 랜딩 페이지

### 포함 내용

```txt
서비스 소개
반려동물 용품 최저가 비교
찜하고 가격 추이 확인
동물병원 / 공공정보 제공
```

### CTA

```txt
용품 검색하기
우리 동네 동물병원 찾기
```

---

## 6.2 상품 검색 페이지

### 구성

```txt
검색창
카테고리 필터
강아지 / 고양이 필터
가격 정렬
쇼핑몰 필터
검색 결과 카드
```

### 상품 카드

```txt
상품 이미지
상품명
가격
쇼핑몰명
찜 버튼
구매하러 가기 버튼
```

---

## 6.3 상품 상세 / 가격 비교 페이지

초기에는 외부 상품 상세 페이지 성격으로 구성한다.

### 구성

```txt
상품명
현재 최저가
쇼핑몰별 가격 목록
최근 가격 변화
찜하기
구매 링크 이동
후기 작성
```

---

## 6.4 찜 목록 페이지

### 구성

```txt
내가 저장한 상품
현재 가격
저장 당시 가격
가격 변화
구매 링크
상태 변경
후기 작성
```

### 상태 예시

```txt
관심 있음
구매 예정
사용 중
사용해봄
다시 살 예정
```

---

## 6.5 가격 추이 페이지

### 구성

```txt
상품별 가격 그래프
최저가 변화
최근 확인일
쇼핑몰별 가격 차이
```

초기에는 그래프 없이 아래 정보만 제공해도 된다.

```txt
저장 당시 가격
현재 확인 가격
차액
마지막 확인 시각
```

---

## 6.6 동물병원 정보 페이지

### 구성

```txt
지역 선택
동물병원 목록
주소
전화번호
영업상태
지도 외부 링크
저장하기
```

초기에는 지도 SDK 없이 주소 기반 리스트와 외부 지도 링크만 제공한다.

---

# 7. API 설계

## 7.1 내부 API

```txt
GET /api/products/search?query=
외부 쇼핑 API 검색 후 결과 반환

POST /api/products/save
상품 찜하기

GET /api/products/saved
내 찜 목록 조회

GET /api/price-history/:externalProductId
가격 추이 조회

POST /api/reviews
리뷰 작성

GET /api/hospitals?region=
동물병원 조회
```

---

## 7.2 외부 API 연동 역할

### 네이버 쇼핑 API

```txt
상품 검색
가격 참고
상품 링크 제공
상품 이미지 참고
```

### 쿠팡 API

```txt
구매 링크
상품 후보
제휴 수익화
가격 비교 보조
```

단, 쿠팡 API는 정책 변경 가능성이 있으므로 서비스 핵심 데이터 원천으로 강하게 의존하지 않는다.

### 공공데이터 API

```txt
동물병원 정보
반려동물 사료 관련 정보
지역 기반 반려동물 인프라 정보
```

---

# 8. 데이터 수집 전략

## 8.1 초기 데이터

초기에는 직접 상품 DB를 만들지 않는다.

```txt
상품 검색 → 외부 쇼핑 API
공공정보 → 공공데이터
사용자 데이터 → 찜 / 리뷰 / 프로필
```

---

## 8.2 내부 상품 DB 승격 기준

아래 조건 중 하나를 만족하면 `products`로 승격한다.

```txt
찜 5회 이상
리뷰 3개 이상
가격 추적 대상 지정
관리자가 직접 등록
검색 빈도 높음
```

---

## 8.3 가격 수집 정책

전체 API 상품을 계속 수집하지 않는다.

가격 추적 대상은 제한한다.

```txt
사용자가 찜한 상품
리뷰가 있는 상품
관리자가 지정한 상품
```

---

# 9. MVP 범위

## 9.1 1차 MVP 포함 기능

```txt
네이버 쇼핑 API 기반 상품 검색
상품 찜하기
찜한 상품 목록
외부 쇼핑몰 링크 이동
공공데이터 기반 동물병원 목록
상품 리뷰 작성 기본 구조
가격 기록 저장 구조
```

---

## 9.2 1차 MVP 제외 기능

```txt
완벽한 동일 상품 자동 매칭
전체 쇼핑몰 가격 비교
정교한 추천 알고리즘
성분 분석
푸시 알림
커뮤니티
지도 SDK
쿠팡 제휴 수익화
AI 추천
```

---

# 10. 개발 순서

## Step 1. 프로젝트 생성

```txt
Next.js
TypeScript
SCSS
Supabase
Vercel
```

---

## Step 2. DB 생성

우선 생성할 테이블:

```txt
profiles
external_products
saved_products
price_histories
animal_hospitals
product_reviews
```

`products`는 만들어두되, 초반에는 거의 사용하지 않아도 된다.

---

## Step 3. 네이버 쇼핑 API 연동

```txt
검색 API Route 생성
검색 결과 화면 구성
상품 카드 UI 구현
```

---

## Step 4. 찜 기능 구현

```txt
로그인 사용자만 찜 가능
external_products에 상품 후보 저장
saved_products에 유저 찜 저장
```

---

## Step 5. 공공데이터 동물병원 기능 구현

```txt
동물병원 데이터 수집
지역별 목록 화면
주소 검색 / 필터
```

---

## Step 6. 가격 기록 기능 구현

```txt
찜한 상품 가격 저장
저장 당시 가격과 현재 가격 비교
price_histories 테이블 저장
```

---

## Step 7. 리뷰 기능 구현

```txt
구매 / 사용 후 리뷰 작성
상품별 리뷰 목록
반려동물 프로필 연결
```

---

# 11. 핵심 설계 원칙

## 원칙 1. 외부 API 데이터와 내부 상품 데이터를 분리한다

```txt
external_products ≠ products
```

이 설계에서 가장 중요한 원칙이다.

---

## 원칙 2. 처음부터 상품 DB를 직접 만들지 않는다

초기 상품 정보는 쇼핑 API로 검색한다.

내부 DB에는 사용자가 찜하거나 리뷰한 상품만 저장한다.

---

## 원칙 3. 가격 정보는 항상 변동 가능하다고 표시한다

```txt
최종 가격은 쇼핑몰에서 확인해주세요.
마지막 가격 확인 시각을 함께 표시한다.
```

---

## 원칙 4. 리뷰 데이터는 처음부터 구조화한다

후기를 자유 텍스트로만 받으면 나중에 추천/랭킹에 쓰기 어렵다.

```txt
기호성
변 상태
피부 반응
재구매 의사
```

같은 선택형 데이터를 반드시 같이 받는다.

---

## 원칙 5. 공공데이터는 초기 콘텐츠 자산으로 쓴다

사용자 데이터가 0이어도 공공데이터 기반 페이지는 바로 제공 가능하다.

```txt
동물병원
사료 공공정보
지역별 반려동물 정보
```

---

# 12. 서비스 포지션

## 12.1 초기 카피

```txt
반려동물 용품, 어디가 제일 저렴할까?

사료, 간식, 배변용품, 고양이 모래까지
쇼핑몰 가격을 비교하고 관심 상품을 저장해보세요.
우리 동네 동물병원 정보도 함께 확인할 수 있어요.
```

## 12.2 서비스명 후보

```txt
우리애픽
펫픽
멍냥픽
펫템픽
우리애템
```

## 12.3 서브카피 후보

```txt
우리 애 용품 가격 비교부터 찜, 후기까지
```

---


---

# 13. 프론트엔드 스타일링 규칙

## 14.1 CSS Module은 사용하지 않는다

이 프로젝트에서는 `*.module.css` 또는 `*.module.scss` 방식의 CSS Module을 사용하지 않는다.

스타일은 전역 SCSS 구조를 기반으로 작성하며, 클래스명은 명확한 계층 구조를 가진 방식으로 작성한다.

### 기본 클래스 작성 방식

```scss
.header {
  // header 전체 영역
}

.header--inner {
  // header 내부 정렬 영역
}

.header--inner__content {
  // inner 내부의 실제 콘텐츠 영역
}
```

### 선호하는 네이밍 규칙

```txt
.block
.block--element
.block--element__child
```

예시:

```txt
.product-card
.product-card--inner
.product-card--inner__image
.product-card--inner__content
.product-card--inner__price
```

### 사용하는 이유

```txt
클래스 구조를 HTML에서 바로 파악하기 쉽다.
컴포넌트와 스타일의 연결이 직관적이다.
CSS Module의 해시 클래스명보다 디버깅이 편하다.
기존 퍼블리싱 작업 방식과 잘 맞는다.
SCSS 중첩 구조와 함께 사용하기 좋다.
```

## 14.2 SCSS 작성 방식

스타일은 페이지 또는 컴포넌트 단위로 SCSS 파일을 분리하되, CSS Module처럼 import해서 스코프를 강제하지 않는다.

예시:

```txt
src/styles/pages/_landing.scss
src/styles/pages/_product-search.scss
src/styles/components/_header.scss
src/styles/components/_product-card.scss
src/styles/components/_button.scss
```

전역 스타일 진입점에서 필요한 SCSS 파일을 모아서 관리한다.

```scss
@use "./components/header";
@use "./components/product-card";
@use "./pages/landing";
@use "./pages/product-search";
```

## 14.3 스타일링 원칙

```txt
CSS Module 사용 안 함
Tailwind CSS 사용 안 함
SCSS 기반으로 작성
클래스명은 의미 있게 작성
페이지 / 컴포넌트 단위로 SCSS 파일 분리
공통 색상, 여백, 반응형 기준은 변수 또는 mixin으로 관리
```

## 14.4 예시 컴포넌트 구조

```tsx
<header className="header">
  <div className="header--inner">
    <div className="header--inner__content">
      <h1 className="header--inner__logo">펫픽</h1>
      <nav className="header--inner__nav">
        <a href="/products">용품 검색</a>
        <a href="/hospitals">동물병원 찾기</a>
      </nav>
    </div>
  </div>
</header>
```

```scss
.header {
  width: 100%;
  border-bottom: 1px solid #eee;

  &--inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;

    &__content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }

    &__logo {
      font-size: 20px;
      font-weight: 700;
    }

    &__nav {
      display: flex;
      gap: 24px;
    }
  }
}
```

## 14.5 개발 환경 기준

```txt
Next.js
TypeScript
SCSS
Supabase
Vercel
```

따라서 기존 개발 순서의 기술 스택은 다음처럼 확정한다.

```txt
Next.js
TypeScript
SCSS
CSS Module 미사용
Tailwind CSS 미사용
Supabase
Vercel
```

# 14. 결론

이번 서비스는 처음부터 “반려동물판 화해”로 만들지 않는다.

대신 다음 흐름으로 시작한다.

```txt
공공데이터로 초기 콘텐츠 확보
쇼핑 API로 상품 검색 제공
찜 / 가격추이로 반복 사용 유도
구매 링크 이동으로 쇼핑몰 연결
구매 후 리뷰로 자체 데이터 축적
리뷰가 쌓인 상품만 내부 DB로 승격
```

핵심 DB는 다음과 같다.

```txt
external_products
products
product_sources
price_histories
saved_products
product_reviews
animal_hospitals
```

이렇게 설계하면 외부 API, 공공데이터, 사용자 데이터, 내부 정제 상품 데이터를 분리할 수 있고, 나중에 기능이 커져도 DB를 다시 갈아엎을 가능성을 줄일 수 있다.

