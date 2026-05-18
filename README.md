# PetPick Log

반려동물 용품 가격 비교, 찜, 가격 기록, 공공데이터 기반 동물병원 정보를 실험하는 MVP입니다.

## 실행

```bash
npm install
npm run dev
```

## 환경 변수

`.env.example`을 기준으로 `.env.local`을 만들면 됩니다.

- `NAVER_SHOPPING_CLIENT_ID`, `NAVER_SHOPPING_CLIENT_SECRET`: 네이버 쇼핑 검색 API
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase 브라우저 클라이언트

API 키가 없으면 상품 검색 화면은 데모 데이터를 사용합니다.
