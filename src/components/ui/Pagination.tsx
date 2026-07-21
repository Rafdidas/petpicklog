"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
};

function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  const range: (number | "ellipsis")[] = [1];

  if (left > 2) {
    range.push("ellipsis");
  }
  for (let i = left; i <= right; i += 1) {
    range.push(i);
  }
  if (right < total - 1) {
    range.push("ellipsis");
  }
  range.push(total);

  return range;
}

export default function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = pageList(page, totalPages);

  return (
    <nav className={["pagination", className].filter(Boolean).join(" ")} aria-label="페이지 이동">
      <button
        type="button"
        className="pagination__nav"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {pages.map((item, index) =>
        item === "ellipsis" ? (
          <span className="pagination__ellipsis" key={`ellipsis-${index}`} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            className={item === page ? "pagination__page pagination__page--active" : "pagination__page"}
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className="pagination__nav"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}
