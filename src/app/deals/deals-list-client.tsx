"use client";

import { useState } from "react";
import PriceCard from "@/components/PriceCard";
import Pagination from "@/components/ui/Pagination";
import type { ProductPriceStats } from "@/lib/price-stats";

const PAGE_SIZE = 12;

export default function DealsListClient({ items }: { items: ProductPriceStats[] }) {
  const [page, setPage] = useState(1);
  const [prevItems, setPrevItems] = useState(items);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // Reset to the first page when the underlying list changes (e.g. category switch).
  if (prevItems !== items) {
    setPrevItems(items);
    setPage(1);
  }

  const start = (page - 1) * PAGE_SIZE;
  const visible = items.slice(start, start + PAGE_SIZE);

  function goTo(next: number) {
    setPage(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <>
      <section className="card-grid">
        {visible.map((stats) => (
          <PriceCard stats={stats} key={stats.externalProductId} />
        ))}
      </section>
      <Pagination page={page} totalPages={totalPages} onChange={goTo} />
    </>
  );
}
