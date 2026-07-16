# HANDOFF.md — AI 간 인수인계

다른 AI 세션이 이어받을 때 가장 먼저 읽는 파일이다. **"지금 어디까지 왔고, 다음에 뭘 하면 되는가"**를 담는다.
영구 규칙·아키텍처는 [AGENTS.md](AGENTS.md)와 [설계서](docs/superpowers/specs/2026-06-29-petfit-redesign-design.md)에 있다. 이 파일은 **휘발성 진행 상태**만 다룬다.

---

## 업데이트 규칙 (필수)

1. **작업을 끝내거나 세션을 넘기기 전에 반드시 이 파일을 갱신**한다.
2. 맨 위 `## 현재 상태`를 항상 최신으로 덮어쓴다. 과거 이력은 `## 변경 로그`에 한 줄로 누적한다.
3. 날짜는 절대값으로 적는다(예: 2026-06-29). "오늘/어제" 금지.
4. 영구적 사실(컨벤션·구조·결정의 근거)은 여기 두지 말고 `AGENTS.md`나 설계서로 옮긴다. 이 파일은 짧게 유지한다.
5. 확정되지 않은 결정은 `## 열린 질문`에 남기고, 임의로 구현하지 않는다.
6. 커밋 전 상태와 실제 파일 상태가 어긋나면 사실대로 적는다(거짓 "완료" 금지).

---

## 현재 상태 (2026-07-16)

**단계: 카탈로그 기반 가격추적 전면 개편 — 구현 완료, 배포됨, 실데이터로 검증됨.**

> ⚠️ **2026-06-29 "펫핏(PetFit)" 재설계 계획은 폐기되지 않고 그냥 구현되지 않은 채 방치됐다.** 그 계획(`docs/superpowers/specs/2026-06-29-petfit-redesign-design.md`, `AGENTS.md`가 가리키는 설계서)은 `/pets` 프로필, 룰 기반 큐레이션(`lib/curation.ts`), `/api/cron/refresh-prices` 방식을 전제로 했다. 이번 세션은 그 계획을 이어받지 않고 instmoa.com(악기 가격비교 서비스)을 참고해 **완전히 다른 방향**(카탈로그 자동 수집 + 급락 특가, 큐레이션 없음)으로 처음부터 다시 브레인스토밍해서 진행했다. 제품명도 "펫핏"이 아니라 "펫픽"으로 굳어졌다. **`AGENTS.md`는 이 사실을 반영하지 못한 채 옛 설계를 가리키고 있으니, 다음 세션에서 `AGENTS.md` 갱신 여부를 사용자에게 먼저 확인할 것.**

- 새 설계서: [docs/superpowers/specs/2026-07-15-catalog-price-redesign-design.md](docs/superpowers/specs/2026-07-15-catalog-price-redesign-design.md)
- 구현 계획: [백엔드](docs/superpowers/plans/2026-07-15-catalog-price-redesign-backend.md) / [프론트엔드](docs/superpowers/plans/2026-07-15-catalog-price-redesign-frontend.md) — 각 12~13개 태스크, 전부 완료·리뷰 승인됨.
- **커밋 26개, main에 직접 push 완료** (`ee6b0e8..5d8040a`). 워크트리/PR 없이 진행(사용자 명시 지시).
- **배포**: https://petpicklog.vercel.app (Vercel, env var 등록 완료). GitHub: https://github.com/Rafdidas/petpicklog
- **DB**: Supabase 마이그레이션(`supabase/patches/004_catalog_tracking.sql`) 사용자가 직접 SQL Editor에서 적용 완료.
- **자동 수집**: `.github/workflows/collect-prices.yml`, 매일 00:00 UTC(오전 9시 KST). 첫 수동 실행 성공 — 추적 상품 423개, 가격 기록 418건 실제 적재 확인.
- **최종 전체 리뷰**: opus 모델로 26개 커밋 diff 전체 리뷰, "Ready to merge — with fixes" 판정. Important 2건(JSON-LD 이스케이프, unhandled promise) 수정 반영(`5d8040a`). 나머지는 로드맵(아래).

### 다음 할 일 (우선순위 순)

1. **`AGENTS.md` 갱신 여부를 사용자에게 확인.** 옛 "펫핏" 설계를 가리키고 있어 지금 코드와 안 맞음(제품명, IA, 가격 갱신 방식 전부 다름). 사용자가 원하면 새 설계서(2026-07-15)를 가리키도록 다시 쓸 것.
2. 로드맵 항목(아래) 중 우선순위 있는 것부터 — 특히 "추적 상품이 계속 늘어나기만 함" 항목은 카탈로그가 커지기 전에 먼저 다루는 게 좋음.
3. CI가 `npm ci` 대신 `npm install`을 쓰는 것을 Linux 환경에서 lock 재생성 후 되돌리기 (급하지 않음).

### 로드맵 / 알려진 이슈 (merge를 막을 정도는 아님, 최종 리뷰에서 발견)

1. **추적 상품 집합에 TTL/캡이 없음.** `is_tracked=true`가 한번 되면 절대 해제 안 되고 계속 늘어나기만 함 — 카탈로그가 수천 개로 크면 수집 시간·네이버 쿼터 부담.
2. **네이버 재검색 top-20 밖으로 밀린 상품은 가격이 안 갱신되는데도 UI에는 계속 "최신"인 것처럼 보임.** staleness 표시나 뷰 레벨 컷오프 검토.
3. **CI가 `npm ci` 대신 `npm install`을 씀.** Windows에서 만든 lock 파일이 Linux 전용 옵셔널 네이티브 바인딩(`@rolldown/binding-linux-*` → `@emnapi/*`)을 못 담아 `npm ci`가 계속 실패했음(`824d408`/`4aaa605`/`f14f7a0` 참고). Linux(Docker 등)에서 lock 재생성하면 `npm ci`로 복귀 가능.
4. **`/deals`가 하락 상품 60개까지만 고정 표시**, 페이지네이션 없음.
5. **`next.config.ts`의 `images.remotePatterns`가 모든 HTTPS 호스트를 허용**(`hostname: "**"`). 실제 쓰이는 몰 호스트로 좁히면 더 안전.

### 손대면 안 되는 것 / 주의

- `SUPABASE_SERVICE_ROLE_KEY`는 로컬(.env.local)과 GitHub Actions Secrets에만 등록. **Vercel에는 등록 금지** — 배포된 앱은 이 키를 쓰는 코드가 없고, 불필요하게 관리자 키를 노출시키는 셈.
- `animal_hospitals`, `/hospitals`, `/guide`는 이번에도 삭제하지 않고 유지·재스타일만 함(옛 AGENTS.md 방침과 우연히 일치).
- 서버 시크릿(네이버 키, service-role 키) 클라이언트 노출 금지 — 기존 방침 그대로 유지됨.

---

## 열린 질문

- `AGENTS.md`를 새 설계(카탈로그/가격추적, "펫픽")에 맞게 갱신할지, 아니면 그대로 둘지 — 사용자 확인 필요.

---

## 변경 로그

- 2026-06-29 — 펫핏 재설계 브레인스토밍 완료, 설계서 작성, 이전 설계서 5개 삭제, AGENTS.md·HANDOFF.md 생성. 커밋/구현 전.
- 2026-07-16 — instmoa.com 참고해 카탈로그 기반 가격추적 서비스로 전면 재브레인스토밍(2026-06-29 계획과 무관하게 새로 진행). 백엔드(수집 파이프라인)·프론트엔드(29CM 스타일 재설계) 구현 계획 각각 작성, subagent-driven-development로 26개 커밋 전부 구현·리뷰·최종 브랜치 리뷰까지 완료해 main에 push. Vercel 배포 + GitHub Actions 수집 워크플로 실제 실행 성공(423개 상품/418건 가격 기록 적재) 확인.
