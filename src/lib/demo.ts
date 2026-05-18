import type { AnimalHospital, ExternalProduct } from "@/types/product";

export const demoProducts: ExternalProduct[] = [
  {
    externalId: "demo-food-01",
    title: "오리젠 오리지널 독 2kg",
    brand: "Orijen",
    category: "사료",
    imageUrl: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80",
    productUrl: "https://search.shopping.naver.com/search/all?query=%EC%98%A4%EB%A6%AC%EC%A0%A0%20%EC%98%A4%EB%A6%AC%EC%A7%80%EB%84%90%20%EB%8F%85%202kg",
    mallName: "데모몰",
    latestPrice: 39800,
    source: "DEMO",
    lastSyncedAt: "2026-05-18T14:30:00+09:00"
  },
  {
    externalId: "demo-litter-01",
    title: "벤토나이트 고양이 모래 무향 6kg",
    brand: "Clean Paws",
    category: "고양이 모래",
    imageUrl: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80",
    productUrl: "https://search.shopping.naver.com/search/all?query=%EA%B3%A0%EC%96%91%EC%9D%B4%20%EB%AA%A8%EB%9E%98%206kg",
    mallName: "데모펫",
    latestPrice: 12900,
    source: "DEMO",
    lastSyncedAt: "2026-05-18T14:30:00+09:00"
  },
  {
    externalId: "demo-pad-01",
    title: "대형 배변패드 100매",
    brand: "Pet Daily",
    category: "배변용품",
    imageUrl: "https://images.unsplash.com/photo-1601758063541-d2f50b4aafb2?auto=format&fit=crop&w=600&q=80",
    productUrl: "https://search.shopping.naver.com/search/all?query=%EB%B0%B0%EB%B3%80%ED%8C%A8%EB%93%9C%20100%EB%A7%A4",
    mallName: "데모스토어",
    latestPrice: 17800,
    source: "DEMO",
    lastSyncedAt: "2026-05-18T14:30:00+09:00"
  }
];

export const demoHospitals: AnimalHospital[] = [
  {
    id: "hospital-seoul-01",
    name: "송파 24시 동물의료센터",
    status: "영업 중",
    phone: "02-0000-1234",
    roadAddress: "서울특별시 송파구 백제고분로 000",
    sido: "서울",
    sigungu: "송파구"
  },
  {
    id: "hospital-seoul-02",
    name: "마포 우리동네 동물병원",
    status: "영업 중",
    phone: "02-0000-5678",
    roadAddress: "서울특별시 마포구 월드컵북로 000",
    sido: "서울",
    sigungu: "마포구"
  },
  {
    id: "hospital-busan-01",
    name: "해운대 반려동물 클리닉",
    status: "확인 필요",
    phone: "051-000-2468",
    roadAddress: "부산광역시 해운대구 해운대로 000",
    sido: "부산",
    sigungu: "해운대구"
  }
];
