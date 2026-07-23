"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Typography from "./Typography";

const LOADING_LOTTIE_SRC = "/petpick_loading.lottie";

type LoadingProps = {
  /** 오버레이 표시 여부. false면 아무것도 렌더링하지 않습니다. */
  show?: boolean;
  /** 애니메이션 한 변의 크기(px). 기본 160. */
  size?: number;
  /** 애니메이션 아래에 표시할 안내 문구(선택). */
  label?: string;
};

export default function Loading({ show = true, size = 160, label }: LoadingProps) {
  if (!show) return null;

  return (
    <div
      className="loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? "로딩 중"}
    >
      <div className="loading-overlay__anim" style={{ width: size, height: size }}>
        <DotLottieReact src={LOADING_LOTTIE_SRC} loop autoplay />
      </div>
      {label ? <Typography as="p" type="body" size="lg" className="loading-overlay__label">{label}</Typography> : null}
    </div>
  );
}
