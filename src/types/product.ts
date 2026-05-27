export type ExternalProduct = {
  externalId: string;
  title: string;
  brand: string | null;
  category: string;
  imageUrl: string;
  productUrl: string;
  mallName: string;
  latestPrice: number;
  source: "NAVER";
  lastSyncedAt: string;
};

export type AnimalHospital = {
  id: string;
  name: string;
  status: string;
  phone: string;
  roadAddress: string;
  sido: string;
  sigungu: string;
};
