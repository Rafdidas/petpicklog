"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

type AuthMode = "login" | "signup";

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [mode, setMode] = useState<AuthMode>(() => (searchParams.get("mode") === "signup" ? "signup" : "login"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const redirectTo = searchParams.get("redirect") || "/products";

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(redirectTo);
      }
    });
  }, [redirectTo, router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    setIsLoading(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해주세요.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="auth-page">
      <div className="auth-head">
        <span className="auth-head__mark" aria-hidden="true">P</span>
        <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
        <p>로그인 후 관심상품 저장과 가격 변화 알림을 이용할 수 있어요.</p>
      </div>
      <section className="auth-card">
        <div className="auth-card__benefits">
          <strong>로그인 후 이용할 수 있어요.</strong>
          <span>· 관심상품 저장</span>
          <span>· 저장한 상품 가격 변화 확인</span>
          <span>· 상품 후기 작성</span>
        </div>
        <form className="auth-card__form" onSubmit={handleSubmit}>
          <label htmlFor="email">
            이메일
            <input
              className="ui-input"
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label htmlFor="password">
            비밀번호
            <input
              className="ui-input"
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="········"
              minLength={6}
              required
            />
          </label>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "처리 중" : mode === "login" ? "로그인" : "회원가입"}
          </Button>
        </form>
        {message ? <p className="notice notice--error">{message}</p> : null}
        <button className="auth-card__switch" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "계정이 없으면 회원가입" : "이미 계정이 있으면 로그인"}
        </button>
      </section>
    </main>
  );
}
