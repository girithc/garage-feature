"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type HeaderNavProps = {
  links: Array<{ href: string; label: string }>;
};

export function HeaderNav({ links }: HeaderNavProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastRoutedQueryRef = useRef("");

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      if (!trimmedQuery.length) {
        lastRoutedQueryRef.current = "";
      }
      return;
    }

    const timeout = window.setTimeout(() => {
      if (lastRoutedQueryRef.current === trimmedQuery) {
        return;
      }

      lastRoutedQueryRef.current = trimmedQuery;
      router.push(`/listings?q=${encodeURIComponent(trimmedQuery)}`);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [isSearchOpen, query, router]);

  function runSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    lastRoutedQueryRef.current = trimmedQuery;
    router.push(`/listings?q=${encodeURIComponent(trimmedQuery)}`);
  }

  return (
    <div className="hidden items-center gap-6 text-sm font-semibold text-ink/82 md:flex">
      {links.map((link) => (
        <Link className="hover:text-ember" href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
      <div className="relative h-11" ref={searchWrapRef}>
        <div
          className={`flex h-11 items-center justify-end transition-all duration-200 ${
            isSearchOpen ? "w-[300px]" : "w-11"
          }`}
        >
          {isSearchOpen ? (
            <div className="relative w-full">
              <input
                className="h-11 w-full rounded-[12px] border border-ink/12 bg-white pl-4 pr-12 text-sm text-ink outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    runSearch();
                  }

                  if (event.key === "Escape") {
                    setIsSearchOpen(false);
                  }
                }}
                placeholder="Search listings"
                ref={searchInputRef}
                value={query}
              />
            </div>
          ) : null}
          <button
            aria-label="Search"
            className={`absolute right-0 top-0 flex h-11 items-center justify-center text-ink transition hover:text-ember ${
              isSearchOpen ? "w-11 bg-transparent" : "w-11 rounded-[12px] border border-ink/12 bg-white"
            }`}
            onClick={(event) => {
              event.preventDefault();
              setIsSearchOpen((current) => {
                const next = !current;
                if (!next) {
                  lastRoutedQueryRef.current = "";
                }
                return next;
              });
            }}
            type="button"
          >
            <span className="flex h-11 w-11 items-center justify-center text-[1rem] leading-none">⌕</span>
          </button>
        </div>
      </div>
    </div>
  );
}
