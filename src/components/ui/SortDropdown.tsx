"use client";

import { useEffect, useRef, useState } from "react";
import type { SortOption } from "@/lib/sort-options";

export default function SortDropdown({
  options,
  value,
  onChange
}: {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="sort-dropdown" ref={ref}>
      <button
        type="button"
        className="sort-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{current?.label}</span>
        <svg
          className={open ? "sort-dropdown__chevron sort-dropdown__chevron--open" : "sort-dropdown__chevron"}
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M2 4l4 4 4-4z" />
        </svg>
      </button>
      {open ? (
        <ul className="sort-dropdown__menu" role="listbox">
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                type="button"
                className={
                  option.value === value
                    ? "sort-dropdown__item sort-dropdown__item--active"
                    : "sort-dropdown__item"
                }
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
