export type SortOption = { value: string; label: string };

// 카탈로그·급락특가: 데이터로 구분 가능한 축(하락률·가격·수집일) 기준.
// "추천순"은 하락률순과 동일해 중복을 피해 "할인율순"을 기본으로 둔다.
export const catalogSortOptions: SortOption[] = [
  { value: "drop", label: "할인율순" },
  { value: "price", label: "낮은 가격순" },
  { value: "price_desc", label: "높은 가격순" },
  { value: "recent", label: "최신순" }
];

// 검색(네이버 쇼핑): value는 네이버 API의 sort 파라미터와 동일하게 맞춘다.
export const searchSortOptions: SortOption[] = [
  { value: "sim", label: "추천순" },
  { value: "asc", label: "낮은 가격순" },
  { value: "dsc", label: "높은 가격순" },
  { value: "date", label: "최신순" }
];
