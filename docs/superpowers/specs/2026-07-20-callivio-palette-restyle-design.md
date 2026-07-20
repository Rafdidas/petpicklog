# Callivio 팔레트 리스킨

날짜: 2026-07-20
상태: 설계 확정 대기 (사용자 리뷰 전)

## 1. 개요 & 목표

사용자가 공유한 Callivio 스타일 참고 팔레트(Blue #82ADD4, White #FFFFFF, Black #000000, Yellow #DDFD2C, Gray #F0F0ED)를 petpick-log 전체에 적용한다. 2026-07-15 개편으로 확립된 "블랙&화이트 에디토리얼 + 오렌지 포인트" 시스템을, 무채색 베이스는 유지하되 포인트 컬러를 오렌지에서 이 팔레트로 교체하는 방향으로 재작업한다.

디자인 시스템이 `_tokens.scss` 하나의 CSS 변수로 완전히 집중되어 있어, 대부분의 반영은 토큰값 교체만으로 자동 전파된다. 이번 작업의 핵심은 (1) 브랜드 원색을 그대로 텍스트에 쓸 수 없는 접근성 문제를 토큰 분리로 해결하고, (2) 새로 추가되는 3개 토큰(surface/highlight/danger)을 어디에 연결할지 정하는 것이다.

## 2. 색상 토큰 (`_tokens.scss`)

| 토큰 | 기존값 | 신규값 | 용도 |
|---|---|---|---|
| `--color-canvas` | `#ffffff` | 유지 | 배경 |
| `--color-ink` | `#000000` | 유지 | 본문·제목·버튼 등 기본 UI색 |
| `--color-muted` / `-ink-secondary` / `-ink-tertiary` | 회색 계열 | 유지 | 보조 텍스트 |
| `--color-border` | `#dddddd` | 유지 | 1px 테두리선 |
| `--color-accent` | `#ff4800` | **`#2c6496`** | 가격 하락률·차액 텍스트, 가이드 카드 라벨. 흰 배경 대비 6.2:1 (WCAG AA 통과) |
| `--color-accent-soft` *(신규)* | 없음 | `#82add4` | Callivio 브랜드 블루 원색. 검정 텍스트와만 조합(대비 8.9:1) — 홈 히어로 배경 전용 |
| `--color-surface` *(신규)* | 없음 | `#f0f0ed` | 통계 카드·빈 상태 박스 등 옅은 면 배경 |
| `--color-highlight` *(신규)* | 없음 | `#ddfd2c` | 배지 배경. 검정 텍스트와 조합(대비 18.1:1) |
| `--color-danger` *(신규)* | 없음 | `#ff4800` | 위험 버튼·에러 배너 전용. 기존 오렌지 값을 그대로 이관해 룩 변화 없음 |

대비 계산은 WCAG 2.1 상대휘도 공식 기준, 흰 배경(`#ffffff`) 또는 명시된 배경 대비 텍스트 색 기준이다.

## 3. `--color-accent` → `--color-danger` 분리 (버그 수정)

기존 스펙(2026-07-15)은 "`--color-accent`는 가격 하락 정보 전용"이라 명시했지만, 실제 구현은 `.button--danger`와 `.notice--error`에도 같은 토큰을 재사용하고 있었다. 이대로 accent를 블루로 바꾸면 에러 메시지가 파란색으로 표시되어 사용자에게 혼동을 준다.

수정 대상 (accent → danger로 참조 교체):
- [src/app/styles/_base.scss:126](../../../src/app/styles/_base.scss) `.button--danger` 의 `color`
- [src/app/styles/_base.scss:130](../../../src/app/styles/_base.scss) `.button--danger:hover` 의 `border-color`
- [src/app/styles/_base.scss:143-144](../../../src/app/styles/_base.scss) `.notice--error` 의 `color`, `border`

`--color-danger` 값은 기존 오렌지(`#ff4800`)를 그대로 사용해 이 두 컴포넌트의 시각적 결과는 이번 리스킨 전후로 동일하게 유지된다.

## 4. 자동 반영 (토큰 교체만으로 전파)

`--color-accent`를 참조하는 나머지 지점은 코드 변경 없이 토큰값 교체만으로 오렌지 → 블루(`#2c6496`)로 전환된다:
- [src/app/styles/_catalog.scss:31](../../../src/app/styles/_catalog.scss) `.price-card__drop`
- [src/app/styles/_catalog.scss:332](../../../src/app/styles/_catalog.scss) `.catalog-detail__drop`
- [src/app/styles/_saved.scss:62](../../../src/app/styles/_saved.scss) `.saved-item__diff--down`
- [src/app/styles/_guide.scss:19](../../../src/app/styles/_guide.scss) `.guide-card span`

## 5. `--color-surface` 적용

옅은 회색 면을 아래 3곳에 추가한다:
- [src/app/styles/_catalog.scss:108](../../../src/app/styles/_catalog.scss) `.home-stats article` 의 `background`를 `--color-canvas` → `--color-surface`로
- [src/app/styles/_base.scss:185](../../../src/app/styles/_base.scss) `.metric-grid article` 의 `background`를 `--color-canvas` → `--color-surface`로
- [src/app/styles/_base.scss:154-168](../../../src/app/styles/_base.scss) `.empty-state`에 `background: var(--color-surface);` 신규 추가 (기존엔 배경 없이 테두리만 있었음)

두 그리드(`.home-stats`, `.metric-grid`) 모두 바깥 그리드 배경이 `--color-border`라 셀 사이 1px 하이라인은 그대로 유지되고, 셀 안쪽만 흰색에서 옅은 회색 채움으로 바뀐다.

## 6. `--color-highlight` 배지 적용

[src/app/catalog/[id]/page.tsx:39](../../../src/app/catalog/%5Bid%5D/page.tsx)에서 이미 계산만 되고 시각적으로 활용되지 않던 `nearAllTimeLow`(역대 최저가 근접 여부)를, 현재의 `" · 최저가 근접"` 텍스트 이어붙이기 대신 노란 배지로 표시한다.

**변경 전** (`page.tsx:72`):
```tsx
<div><dt>역대 최저가</dt><dd>{formatPrice(stats.minPriceAll)}{nearAllTimeLow ? " · 최저가 근접" : ""}</dd></div>
```

**변경 후**:
```tsx
<div>
  <dt>역대 최저가</dt>
  <dd>
    {formatPrice(stats.minPriceAll)}
    {nearAllTimeLow ? <span className="badge badge--highlight">최저가 근접</span> : null}
  </dd>
</div>
```

`_base.scss`에 새 공용 배지 클래스 추가 (다른 배지가 생기면 재사용):
```scss
.badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-chip);
  font-size: 11px;
  font-weight: 700;

  &--highlight {
    background: var(--color-highlight);
    color: var(--color-ink);
  }
}
```

## 7. `--color-accent-soft` 홈 히어로 적용

[src/app/styles/_catalog.scss:52-93](../../../src/app/styles/_catalog.scss) `.home-hero` 섹션 배경을 `--color-accent-soft`(연한 블루)로 채운다. 이 색은 검정 텍스트와만 조합해야 대비가 보장되므로(8.9:1), 섹션 내부 두 곳을 함께 조정한다:

- `.home-hero`: `background: var(--color-accent-soft);` 추가
- `.home-hero p`(인트로 카피): `color: var(--color-muted)` → `color: var(--color-ink)` — muted 회색(`#5d5d5d`)은 연한 블루 배경 위에서 대비 2.8:1로 WCAG AA(4.5:1) 미달이라 조정 필요
- `.home-hero__search`: `background: var(--color-canvas);` 추가 — 검색창을 블루 섹션 위에 뜬 흰색 필(pill)로 만들어 입력 텍스트·플레이스홀더 대비를 확보

`h1`은 이미 `--color-ink`라 조정 불필요(대비 8.9:1로 충분).

## 8. 범위 밖 (이번에 건드리지 않음)

- 탭/버튼의 active 상태(`--color-ink` 배경 + `--color-canvas` 텍스트, 예: `.filter-strip__item--active`, `.button--primary`)는 무채색 그대로 유지한다. 블루·옐로우를 인터랙션 상태 색으로 확장하는 건 이번 스코프가 아니다.
- `--color-accent-soft`는 홈 히어로 외 다른 곳에는 연결하지 않는다.
- 폰트, 레이아웃, radius/spacing 토큰은 변경하지 않는다.

## 9. 테스트

이 작업은 순수 스타일(SCSS) + 마크업(JSX 한 곳) 변경으로, 새 로직이 없어 단위 테스트 대상은 아니다. 검증은 다음으로 수행한다:
- `npx tsc --noEmit`, `npm run lint`, `npm run build` (기존 테스트 스위트 회귀 없음 확인)
- 브라우저로 홈/카탈로그/카탈로그 상세/급락특가/관심상품/가이드/인증 페이지를 순회하며 색상 반영 확인
- 카탈로그 상세 페이지에서 역대 최저가 근접 상품 1건을 찾아 노란 배지 렌더링 확인
- 위에서 계산한 대비비가 실제 렌더링에서도 육안상 문제없는지 스크린샷으로 확인
