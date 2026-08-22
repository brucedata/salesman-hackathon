# Salesman — Codex 개발 지시서

이 문서를 **먼저** 읽고 구현한다. 채팅 히스토리보다 이 파일이 우선이다. 앱을 처음부터 다시 만들지 말고, 있는 코드를 이어서 고친다.

## 1. 제품

**Salesman** — 1인 사업자·작업자용 응대 에이전트.

작업 중 놓친 전화·이메일·메시지(카톡/문자)를 한 데스크로 모은다. 구매 가능성과 다음 행동을 판단하고, **상품 정책 기반 답변 초안**을 만든다. 초안은 혼자 나가지 않는다. **대표 승인 후** 상담·결제 링크가 전달된다.

데모 테넌트: **한스튜디오** / 대표 **한서윤**. 브랜드·랜딩·월간 운영을 판다.

벤치마크: [flamingoai.app](https://flamingoai.app/)의 **랜딩 구조·아웃리치·실시간 대화·리드 필터·예약**. 페인트 시공 복제 금지. 도메인은 1인 스튜디오 세일즈.

## 2. 하지 말 것

- 인증/DB를 켜지 않는다. 계정, `authMiddleware`, `@/lib/db` 신규 import, 새 마이그레이션 금지. 상태는 Zustand + `localStorage` (`salesman-studio`, persist version 4).
- 실제 통신사 전화·SMS·카카오 발송을 붙이지 않는다. 발송은 **기록만**.
- 초안 자동 발송 금지. 항상 승인 게이트.
- 개인 계좌 안내, 임의 할인, 없는 일정 확정 — 정책 `doNot`을 어기지 말 것.
- 랜딩/UI에 이모지, purple, yellow/gold 팔레트 금지. 액센트는 flamingo coral `#E85D75`, 헤드는 navy `#1E3A8A`.
- `public/og.jpg`, `public/favicon.svg`, `src/lib/og/site.json`은 브랜드 파일. 요청 없이 건드리지 말 것.
- 스크래핑으로 로그인벽·개인정보를 긁지 말 것. 공개 URL만.
- 해커톤 크레딧 페이지에서 키를 채팅/커밋에 넣지 말 것.

## 3. 스택

- TanStack Start (React) + Vite + file routes
- Tailwind v4, 토큰은 `src/styles.css` `@theme`
- Zustand persist (`src/lib/store.ts`)
- 서버 액션: `createServerFn` (`src/lib/ai.ts`, `src/lib/architect.ts`)
- LLM: Qwen 우선, 없으면 Grok (`XAI_API_KEY`)
- 폰트: Outfit (Google Fonts, `__root.tsx`)

실행:

```
npm run dev          # 개발
npm run typecheck
npm run build
npm run preview
```

라우트는 `src/routes/` 파일 기반. 새 페이지는 여기에만 추가.

## 4. 정보 구조

| 경로 | 역할 |
|---|---|
| `/` | 마케팅 랜딩 (Flamingo형: 히어로 대화, 4단계, 기능, 계산기, 데모, 인프라 4칸) |
| `/inbox` | 통합 수신함 |
| `/inbox/$leadId` | 의도 분석, 초안, 대화 스레드, 상담 예약, 승인 후 발송 |
| `/outreach` | 관찰 신호 → 첫 메시지 초안 |
| `/architect` | Bright Data → Qwen → Nosana → Daytona 파이프라인 실행 |
| `/pipeline` | 칸반 (신규→유망→승인대기→발송→성사/종료) |
| `/products` | 상품 3종 + 정책 편집 |
| `/phone` | 음성 녹음/받아쓰기 → 리드 |
| `/p/$slug` | 공개 판매 페이지. 문의 제출 시 수신함에 web 채널 |

셸 네비: `src/components/app-shell.tsx`

## 5. 도메인 (`src/lib/types.ts`)

- **Lead**: 채널 `web|email|phone`, stage, intentScore 0–100, draft, thread[], appointment?
- **Product**: 가격, slug, consultUrl, paymentUrl
- **Policy**: tone, refund, delivery, doNot[]
- **Prospect**: 아웃리치 대상 (area, signal, draft, status ready|sent)
- **ChatTurn**: customer | agent

시드: `src/lib/seed.ts`. 문의 5건 + 아웃리치 후보 3건. persist migrate가 시드를 덮을 수 있으니 스키마 바꾸면 `store.ts` version을 올리고 migrate를 맞출 것.

단계 라벨: `src/lib/labels.ts`

## 6. AI / 인프라

### 수신함 초안 — `src/lib/ai.ts`

- `analyzeAndDraft`: 정책+카탈로그로 JSON (intentScore, intentLabel, nextAction, reasons, draft, replyChannel, productId). 전화면 sms 톤, 아니면 email.
- `transcribeVoice`: xAI STT. 브라우저 MediaRecorder.
- `generateOutreach`: 첫 연락 본문.

### 아키텍트 — `src/lib/architect.ts`

순서 고정:

1. **Bright Data** — 공개 URL 수집. 키: `BRIGHTDATA_API_TOKEN` | `BRIGHT_DATA_API_KEY` | `BRIGHTDATA_API_KEY`, zone `BRIGHTDATA_ZONE` (기본 `web_unlocker1`). 없으면 `fetch` + HTML strip.
2. **QwenCloud** — 한국어 초안. `DASHSCOPE_API_KEY` | `QWEN_API_KEY`, `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`, model `qwen-plus`. 없으면 Grok 4.5.
3. **Nosana GPU** — 의도 점수. `NOSANA_API_KEY` | `NOSANA_API_TOKEN`. 키 없으면 같은 LLM으로 점수. Nosana 크레딧 **2026-08-25 만료**.
4. **Daytona** — 정책 린트 샌드박스. `DAYTONA_API_KEY` | `DAYTONA_API_TOKEN`. 없으면 인프로세스 검사 (계좌숫자, 할인%, 비방).

상태 배지: `getInfraStatus`. 실행: `runArchitect`. 결과는 아웃리치 draft 반영 또는 수신함 리드로 승격 가능.

실키를 붙일 때: 채팅에 키를 붙이지 말고 환경 변수만. `.env`를 커밋하지 말 것.

## 7. UI 규칙

토큰 (`src/styles.css`):

- bg `#ffffff` / surface `#f9fafb` / fg `#111827` / muted `#4b5563`
- accent `#e85d75` / accent-fg `#ffffff` / navy `#1e3a8a` / wash `#fff5f7`
- radius: xs 4, sm 8, md 12, lg 18
- 카드: `rounded-xl bg-raised shadow-[0_0_0_1px_var(--color-line)]`
- 버튼: `src/components/ui/button.tsx` (default coral). 포커스 링 유지.
- 입력: `src/components/ui/input.tsx` (`Input`, `Textarea`, `Label`)
- 날짜 표시는 `formatTime` (`src/lib/utils.ts`)만. `toLocaleString` 금지 (하이드레이션).
- 제목 Outfit 700. 본문 16px, 히어로 여백 넉넉히.
- 모바일 하단 네비 6칸, 탭 높이 min 56px.

## 8. 이미 된 것 (다시 구현하지 말 것)

- 랜딩 전체 (대화 목업, How it works, 계산기, 데모 폼, 인프라 4칸)
- 수신함 + 리드 상세 분석/초안/승인/스레드/예약
- 파이프라인 칸반
- 상품·정책 편집
- 공개 판매 페이지 `/p/$slug`
- 전화 녹음 + STT + 예시 메모
- 아웃리치 3 후보
- 아키텍트 파이프라인 UI + 폴백 어댑터
- OG/파비콘 (coral funnel)

## 9. Codex가 이어서 할 일 (우선순위)

한 번에 전부 하지 말고 **티켓 단위**로 PR처럼 끝내고 typecheck.

### P0 — 인프라를 실제로 붙이기

1. Nosana: 공식 Job/Deployment API로 점수 추론을 GPU 잡에 올리기. 타임아웃·실패 시 현재 LLM 폴백 유지.
2. Daytona SDK/REST로 정책 스크립트를 샌드박스에서 실행. 초안 문자열만 넘기고 결과 `{pass, hits}` JSON.
3. Bright Data Web Unlocker 응답 파싱 강화 (title, price-like, CTA). 실패해도 시그널 텍스트로 진행.
4. `analyzeAndDraft` / `generateOutreach`도 Qwen 우선 라우팅을 `chatComplete`와 공유하게 리팩터 (중복 fetch 제거).

### P1 — 세일즈 루프 완성도

5. 수신함 필터 (채널, 점수 구간, 단계).
6. 리드 스레드에 고객 회신 직접 입력 → 재분석.
7. 승인 대기 큐를 홈/수신함 상단에 카운트.
8. 상담 예약 후 파이프라인 `qualified` 이동이 이미 있음. 캘린더 리스트 뷰 추가.
9. 발송 기록 타임라인 (sentAt, 채널). 실제 메일은 보내지 않음.

### P2 — 품질

10. 판매 페이지를 랜딩과 같은 코랄/네이비 톤으로 맞춤.
11. 빈 상태 카피 다듬기. 데모 리셋은 유지.
12. 아키텍트 런 히스토리를 store에 최대 8개 저장 (지금은 화면 state만).

## 10. 수용 기준

새 기능은 아래를 깨면 머지하지 않는다.

- `npm run typecheck` 통과
- 승인 없이 초안이 고객에게 “보내진 것처럼” 네트워크 호출하지 않음
- 전화 페이지가 통신사 API를 호출하지 않음
- 한국어 UI 유지. 코드 식별자는 영어
- 기존 시드 리드가 하이드레이션 에러 없이 보임
- 모바일에서 하단 네비에 콘텐츠가 가리지 않게 `pb-24`

## 11. 크레딧 링크 (키 발급용, 코드에 하드코딩하지 말 것)

- Nosana GPU: https://theaibuilders.dev/20260725-seoul-credits/nosana
- Daytona: https://theaibuilders.dev/20260725-seoul-credits/daytona
- Bright Data: https://theaibuilders.dev/20260725-seoul-credits/brightdata
- QwenCloud: https://survey.alibabacloud.com/uone/sg/survey/wPxlh05hw

## 12. 작업 방식

1. 관련 파일만 읽고 최소 수정.
2. 새 추상화/유틸 파일은 두 번 이상 쓰일 때만.
3. 기능 끝나면 typecheck. 랜딩 카피를 바꿨으면 화면을 직접 확인.
4. 이 지시서와 충돌하는 요청이 있으면 지시서의 금지 항목을 우선하고, 제품 요구만 사용자 쪽으로 맞춘다.
