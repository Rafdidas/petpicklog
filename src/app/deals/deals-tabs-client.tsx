"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/lib/categories";
import Chip from "@/components/ui/Chip";

export default function DealsTabsClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  function handleSelect(slug: string) {
    router.push(slug ? `/deals?category=${slug}` : "/deals");
  }

  return (
    <div className="chip-row" aria-label="카테고리 필터">
      <Chip active={current === ""} onClick={() => handleSelect("")}>
        전체
      </Chip>
      {categories.map((category) => (
        <Chip active={current === category.slug} key={category.slug} onClick={() => handleSelect(category.slug)}>
          {category.label}
        </Chip>
      ))}
    </div>
  );
}
