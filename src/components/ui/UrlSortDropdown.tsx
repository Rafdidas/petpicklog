"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SortDropdown from "./SortDropdown";
import type { SortOption } from "@/lib/sort-options";

export default function UrlSortDropdown({
  options,
  defaultValue
}: {
  options: SortOption[];
  defaultValue: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("sort") ?? defaultValue;

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === defaultValue) {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return <SortDropdown options={options} value={value} onChange={handleChange} />;
}
