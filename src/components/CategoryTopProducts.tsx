"use client";

import { useState } from "react";
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import type { Category } from "@/lib/categories";
import type { CategoryTopMap } from "@/lib/catalog";

type Props = {
  categories: Category[];
  productsByCategory: CategoryTopMap;
};

export default function CategoryTopProducts({ categories, productsByCategory }: Props) {
  const [selected, setSelected] = useState(categories[0]?.slug ?? "");
  const selectedCategory = categories.find((category) => category.slug === selected);
  const items = productsByCategory[selected] ?? [];

  return (
    <div className="category-top">
      <div className="filter-strip" role="tablist" aria-label="카테고리별 인기상품">
        {categories.map((category) => (
          <button
            className={
              selected === category.slug ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"
            }
            key={category.slug}
            id={`category-top-tab-${category.slug}`}
            type="button"
            role="tab"
            aria-selected={selected === category.slug}
            aria-controls="category-top-panel"
            onClick={() => setSelected(category.slug)}
          >
            {category.label}
          </button>
        ))}
      </div>
      {items.length ? (
        <div
          className="card-grid"
          id="category-top-panel"
          role="tabpanel"
          aria-labelledby={`category-top-tab-${selected}`}
        >
          {items.map((stats) => (
            <PriceCard stats={stats} key={stats.externalProductId} />
          ))}
        </div>
      ) : (
        <div
          className="empty-state"
          id="category-top-panel"
          role="tabpanel"
          aria-labelledby={`category-top-tab-${selected}`}
        >
          <p>아직 추적 중인 상품이 없어요.</p>
        </div>
      )}
      {selectedCategory ? (
        <Link className="category-top__more" href={`/catalog?category=${selectedCategory.slug}`}>
          {selectedCategory.label} 전체 보기 <span aria-hidden="true">›</span>
        </Link>
      ) : null}
    </div>
  );
}
