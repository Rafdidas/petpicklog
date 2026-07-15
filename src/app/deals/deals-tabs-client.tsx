"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DealsTabsClient({ categories }: { categories: { slug: string; label: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  function handleSelect(slug: string) {
    router.push(slug ? `/deals?category=${slug}` : "/deals");
  }

  return (
    <div className="filter-strip" aria-label="카테고리 필터">
      <button
        className={current === "" ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
        type="button"
        onClick={() => handleSelect("")}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          className={current === category.slug ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
          key={category.slug}
          type="button"
          onClick={() => handleSelect(category.slug)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
