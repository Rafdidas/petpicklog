"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/categories";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";

const petOptions = [
  { value: "", label: "전체" },
  { value: "dog", label: "강아지" },
  { value: "cat", label: "고양이" }
];

const maxPriceOptions = [
  { value: "", label: "전체 가격대" },
  { value: "10000", label: "1만원 이하" },
  { value: "30000", label: "3만원 이하" },
  { value: "50000", label: "5만원 이하" },
  { value: "100000", label: "10만원 이하" }
];

export default function CatalogFiltersClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "";
  const currentPet = searchParams.get("pet") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const [queryInput, setQueryInput] = useState(searchParams.get("query") ?? "");

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    router.push(`/catalog?${next.toString()}`);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam("query", queryInput.trim());
  }

  return (
    <div className="filter-card">
      <form className="filter-card__search" onSubmit={handleSearchSubmit}>
        <input
          className="ui-input"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="상품명 검색"
          aria-label="카탈로그 검색"
        />
        <Button type="submit" variant="dark">검색</Button>
      </form>

      <div className="filter-card__chips" aria-label="카테고리 필터">
        <Chip active={currentCategory === ""} onClick={() => updateParam("category", "")}>
          전체
        </Chip>
        {categories.map((category) => (
          <Chip
            active={currentCategory === category.slug}
            key={category.slug}
            onClick={() => updateParam("category", category.slug)}
          >
            {category.label}
          </Chip>
        ))}
      </div>

      <div className="filter-card__chips">
        <label className="filter-card__field">
          반려동물
          <select className="ui-input" value={currentPet} onChange={(event) => updateParam("pet", event.target.value)}>
            {petOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="filter-card__field">
          가격대
          <select className="ui-input" value={currentMaxPrice} onChange={(event) => updateParam("maxPrice", event.target.value)}>
            {maxPriceOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
