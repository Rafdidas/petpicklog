"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(() => !supabase);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close the mobile menu whenever the route changes.
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const loginHref = `/auth?redirect=${encodeURIComponent(pathname || "/catalog")}`;

  const navItems = [
    { href: "/catalog", label: "카탈로그" },
    { href: "/deals", label: "급락 특가" },
    { href: "/products", label: "실시간 검색" },
    { href: "/hospitals", label: "동물병원" },
    { href: "/guide", label: "가이드" },
    { href: "/saved", label: "관심상품" }
  ];

  return (
    <header className="header">
      <div className="header__inner">
        <Link className="header__logo" href="/">
          <span className="header__logo-mark" aria-hidden="true">P</span>
          <strong>펫픽</strong>
          <small>반려용품 가격추적</small>
        </Link>
        <button
          className="header__toggle"
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={menuOpen ? "header__toggle-icon header__toggle-icon--open" : "header__toggle-icon"} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <nav className={menuOpen ? "header__nav header__nav--open" : "header__nav"} aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link
              className={
                pathname === item.href || pathname?.startsWith(`${item.href}/`)
                  ? "header__nav-link header__nav-link--active"
                  : "header__nav-link"
              }
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {isReady && user ? (
            <button className="header__auth" type="button" onClick={handleSignOut}>로그아웃</button>
          ) : (
            <Link className="header__auth" href={loginHref}>로그인</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
