"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/categories";

const petOptions = [
  { value: "", label: "전체" },
  { value: "dog", label: "강아지" },
  { value: "cat", label: "고양이" }
];

const sortOptions = [
  { value: "drop", label: "하락률순" },
  { value: "price", label: "낮은가격순" },
  { value: "recent", label: "최신순" }
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
  const currentSort = searchParams.get("sort") ?? "drop";
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
    <div className="catalog-filters">
      <form className="catalog-filters__search" onSubmit={handleSearchSubmit}>
        <input
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="상품명 검색"
          aria-label="카탈로그 검색"
        />
        <button className="button button--ghost" type="submit">검색</button>
      </form>

      <div className="filter-strip" aria-label="카테고리 필터">
        <button
          className={currentCategory === "" ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
          type="button"
          onClick={() => updateParam("category", "")}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            className={currentCategory === category.slug ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
            key={category.slug}
            type="button"
            onClick={() => updateParam("category", category.slug)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="catalog-filters__row">
        <label>
          반려동물
          <select value={currentPet} onChange={(event) => updateParam("pet", event.target.value)}>
            {petOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          정렬
          <select value={currentSort} onChange={(event) => updateParam("sort", event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          가격대
          <select value={currentMaxPrice} onChange={(event) => updateParam("maxPrice", event.target.value)}>
            {maxPriceOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
