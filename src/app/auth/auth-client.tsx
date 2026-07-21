"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

type AuthMode = "login" | "signup";

const COPY: Record<AuthMode, { badge: string; title: string; subtitle: string; formTitle: string; formSubtitle: string }> = {
  login: {
    badge: "반려용품 가격추적 서비스",
    title: "반려동물 용품,\n가격으로 똑똑하게",
    subtitle: "매일 기록되는 가격과 급락 특가를 한곳에서 확인하세요.",
    formTitle: "로그인",
    formSubtitle: "펫픽 계정으로 로그인해요."
  },
  signup: {
    badge: "반려용품 가격추적 서비스",
    title: "1분이면\n시작할 수 있어요",
    subtitle: "가입하고 관심상품의 가격 변화를 바로 추적해보세요.",
    formTitle: "회원가입",
    formSubtitle: "무료로 펫픽을 시작해요."
  }
};

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [mode, setMode] = useState<AuthMode>(() => (searchParams.get("mode") === "signup" ? "signup" : "login"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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

  function switchMode(next: AuthMode) {
    setMode(next);
    setMessage("");
    setPassword("");
    setPasswordConfirm("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    if (mode === "signup" && password !== passwordConfirm) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { name: name.trim() } } });

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

  const copy = COPY[mode];

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-brand">
          <div className="auth-brand__top">
            <span className="auth-brand__mark" aria-hidden="true">P</span>
            <strong>펫픽</strong>
          </div>
          <div className="auth-brand__body">
            <h1>
              {copy.title.split("\n").map((line, index) => (
                <span key={index}>{line}</span>
              ))}
            </h1>
            <p>{copy.subtitle}</p>
            <ul className="auth-brand__benefits">
              <li>관심상품 저장</li>
              <li>가격 변화 알림</li>
              <li>상품 후기 작성</li>
            </ul>
          </div>
          <span className="auth-brand__foot">{copy.badge}</span>
          <span className="auth-brand__blob auth-brand__blob--1" aria-hidden="true" />
          <span className="auth-brand__blob auth-brand__blob--2" aria-hidden="true" />
        </aside>

        <div className="auth-form-panel">
          <header className="auth-form-panel__head">
            <h2>{copy.formTitle}</h2>
            <p>{copy.formSubtitle}</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <label htmlFor="name">
                이름
                <input
                  className="ui-input"
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="성함을 입력해주세요"
                  autoComplete="name"
                />
              </label>
            ) : null}

            <label htmlFor="email">
              이메일
              <input
                className="ui-input"
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
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
                placeholder={mode === "signup" ? "8자 이상 입력해주세요" : "비밀번호를 입력해주세요"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={mode === "signup" ? 8 : 6}
                required
              />
            </label>

            {mode === "signup" ? (
              <label htmlFor="password-confirm">
                비밀번호 확인
                <input
                  className="ui-input"
                  id="password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="비밀번호를 한번 더 입력해주세요"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            ) : null}

            {message ? <p className="notice notice--error">{message}</p> : null}

            <Button type="submit" variant="primary" className="auth-form__submit" disabled={isLoading}>
              {isLoading ? "처리 중" : copy.formTitle}
            </Button>
          </form>

          <p className="auth-form-panel__switch">
            {mode === "login" ? (
              <>
                아직 계정이 없으신가요?{" "}
                <button type="button" onClick={() => switchMode("signup")}>회원가입</button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{" "}
                <button type="button" onClick={() => switchMode("login")}>로그인</button>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
