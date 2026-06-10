const petKeywords = ["반려동물", "반려견", "반려묘", "강아지", "개", "고양이", "고양이용", "강아지용", "댕댕이", "냥이"];

export type PetSearchTarget = {
  petType?: string;
  customPet?: string;
  scoped?: boolean;
};

export function getPetSearchPrefix({ petType = "all", customPet = "" }: PetSearchTarget) {
  if (petType === "dog") {
    return "강아지";
  }

  if (petType === "cat") {
    return "고양이";
  }

  if (petType === "custom" && customPet.trim()) {
    return customPet.trim().replace(/\s+/g, " ");
  }

  return "반려동물";
}

export function buildPetShoppingQuery(query: string, options: PetSearchTarget = {}) {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  if (!normalizedQuery) {
    return "";
  }

  if (options.scoped === false || petKeywords.some((keyword) => normalizedQuery.includes(keyword))) {
    return normalizedQuery;
  }

  return `${getPetSearchPrefix(options)} ${normalizedQuery}`;
}
