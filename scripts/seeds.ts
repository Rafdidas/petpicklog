export type CategorySlug = "food" | "snack" | "pad" | "litter" | "shampoo" | "supplement" | "toy" | "house";

export type SeedCategory = {
  slug: CategorySlug;
  petType: "dog" | "cat" | "both";
  keywords: string[];
};

export const seedCategories: SeedCategory[] = [
  { slug: "food", petType: "dog", keywords: ["강아지 사료", "강아지 건식사료", "강아지 습식사료", "강아지 소형견 사료"] },
  { slug: "food", petType: "cat", keywords: ["고양이 사료", "고양이 건식사료", "고양이 습식사료"] },
  { slug: "snack", petType: "both", keywords: ["강아지 간식", "고양이 간식", "반려동물 트릿"] },
  { slug: "pad", petType: "dog", keywords: ["강아지 배변패드", "배변패드 대형"] },
  { slug: "litter", petType: "cat", keywords: ["고양이 모래", "고양이 벤토나이트 모래", "고양이 두부모래"] },
  { slug: "shampoo", petType: "both", keywords: ["강아지 샴푸", "고양이 샴푸"] },
  { slug: "supplement", petType: "both", keywords: ["강아지 영양제", "고양이 영양제", "반려동물 관절 영양제", "반려동물 피부 영양제"] },
  { slug: "toy", petType: "both", keywords: ["강아지 장난감", "고양이 장난감"] },
  { slug: "house", petType: "both", keywords: ["반려동물 이동장", "강아지 하우스", "고양이 캣타워"] }
];
