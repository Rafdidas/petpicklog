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

  return (
    <header className="header">
      <div className="header--inner">
        <Link className="header--inner__logo" href="/">
          <span className="header--inner__logo-mark" aria-hidden="true">P</span>
          <strong>펫픽</strong>
          <small>가격추적</small>
        </Link>
        <nav className="header--inner__nav" aria-label="주요 메뉴">
          <Link className="header--inner__nav-primary" href="/catalog">카탈로그</Link>
          <Link className="header--inner__nav-primary" href="/deals">급락 특가</Link>
          <Link href="/products">실시간 검색</Link>
          <Link href="/hospitals">동물병원</Link>
          <Link href="/guide">가이드</Link>
          <Link href="/saved">관심상품</Link>
          {isReady && user ? (
            <button className="header--inner__nav-button" type="button" onClick={handleSignOut}>
              로그아웃
            </button>
          ) : (
            <Link className="header--inner__auth-link--signup" href={loginHref}>
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
