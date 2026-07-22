import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#e8f0f5",
          color: "#17222b",
          display: "flex",
          height: "100%",
          padding: "80px 96px",
          width: "100%"
        }}
      >
        <svg aria-label="펫픽" height="220" viewBox="0 0 512 512" width="220">
          <rect fill="#c3e17e" height="512" rx="44" ry="44" width="512" />
          <g fill="#17222b" transform="rotate(12 256 256)">
            <ellipse cx="140" cy="230" rx="38" ry="48" transform="rotate(-20 140 230)" />
            <ellipse cx="215" cy="155" rx="40" ry="54" transform="rotate(-5 215 155)" />
            <ellipse cx="305" cy="155" rx="40" ry="54" transform="rotate(5 305 155)" />
            <ellipse cx="380" cy="230" rx="38" ry="48" transform="rotate(20 380 230)" />
            <path d="M260 230C210 230 160 270 160 320C160 370 200 400 260 400C320 400 360 370 360 320C360 270 310 230 260 230Z" />
            <circle cx="315" cy="350" fill="#c3e17e" r="32" />
            <path d="M300 350L310 360L330 338" fill="none" stroke="#17222b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
          </g>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: "54px" }}>
          <div style={{ fontSize: "76px", fontWeight: 800, letterSpacing: "-5px", lineHeight: 1.1 }}>펫픽</div>
          <div style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-1px", marginTop: "18px" }}>반려용품 가격추적</div>
          <div style={{ color: "#4a5a65", fontSize: "24px", marginTop: "28px" }}>반려용품 최저가를 매일 기록합니다.</div>
        </div>
      </div>
    ),
    size
  );
}
