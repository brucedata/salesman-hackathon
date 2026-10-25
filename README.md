# Salesman

1인 스튜디오의 놓친 문의를 정리하고, 상품 정책을 바탕으로 답변 초안을 만드는 오픈소스 해커톤 프로젝트입니다. 문의 확인 → 구매 의도 분석 → 초안 검토 → 승인 기록까지 한 화면 흐름으로 체험할 수 있습니다.

**Salesman의 오픈소스 코드와 기본 로컬 데모는 무료입니다.** 별도 템플릿 상품을 구매하지 않아도 코드를 내려받아 실행하고 기본 데모를 사용할 수 있습니다. API 키도 필요하지 않습니다.

**19,000원은 별도 ‘업종별 응대 템플릿·정책 체크리스트’ 문서 상품의 검토 중인 가격 후보입니다.** Salesman의 사용료·구독료가 아니며, 상품 가격은 확정되지 않았고 판매도 시작하지 않았습니다. 템플릿 구매는 Salesman 사용의 필수 조건이 아닙니다. 외부 유료 API를 직접 연결하는 경우의 공급자 요금은 아래 선택 사항에서 따로 설명합니다.

**현재는 데모입니다.** 계정과 공유 데이터베이스가 없고, 상태는 현재 브라우저의 `localStorage`에 저장됩니다. 이메일·SMS·카카오톡·전화의 실제 수신이나 발송을 연결하지 않습니다. `Approve and record send`는 승인과 발송 상태를 로컬에 기록합니다. 현재 앱 UI와 생성 프롬프트는 영어입니다.

처음 사용한다면 [10분 체험 가이드](docs/TRY_SALESMAN.md)를 따라 예시 문의부터 승인 기록까지 실행해 보세요. 설치 실패나 불편한 점도 [데모 사용 피드백](https://github.com/brucedata/salesman-hackathon/issues/new?template=demo-feedback.yml)으로 남길 수 있습니다. GitHub 계정이 필요하며 제출 내용과 계정명은 공개됩니다. 실제 고객 정보·API 키는 올리지 마세요. [피드백 이용 범위](docs/FEEDBACK_DATA_USE.md)에서 프로젝트 개선, 신청서 사례 인용, 선택적인 상업 통계 이용을 각각 확인할 수 있습니다.

현재 호스팅된 데모는 Vercel 팀 로그인 보호를 유지합니다. 외부 사용자는 아래 명령으로 자신의 컴퓨터에서 실행할 수 있고, 기본 모드는 API 키 없이 동작하며 제작자의 유료 API 크레딧을 제공하지 않습니다.

## 빠르게 실행하기

Node.js **22.13 이상인 22.x 또는 24 이상**과 npm을 사용합니다. `.nvmrc`는 Node 22를 지정합니다.

```sh
git clone https://github.com/brucedata/salesman-hackathon.git
cd salesman-hackathon
npm ci
npm run dev
```

개발 화면: <http://localhost:8080>. 별도 환경 변수나 API 키 없이 데모를 실행할 수 있습니다. 기본 실행은 키가 설정되어 있어도 외부 서비스 호출을 차단하고 고정된 예시 초안·점수와 로컬 정책 검사를 사용합니다. 실제 모델 추론 결과가 아닙니다. Vercel의 Production·Preview 배포에서는 항상 이 데모 모드로 동작합니다.

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

빌드 미리보기: <http://127.0.0.1:8081>. 개발 서버와 미리보기는 서로 다른 포트를 사용합니다. `npm run dev`, `build`, `preview`는 프로젝트 설정을 읽는 실행 래퍼를 거치므로 Vite를 직접 실행하지 마세요.

## 체험할 수 있는 흐름

| 경로             | 기능                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `/`              | 제품 소개와 문의 입력 데모                                        |
| `/inbox`         | 웹·이메일·전화·메시지로 분류된 예시 문의와 직접 입력한 문의       |
| `/inbox/$leadId` | 의도 분석, 편집 가능한 초안, 승인 기록, 대화 기록, 상담 일정 기록 |
| `/pipeline`      | 영업 단계별 문의 정리                                             |
| `/products`      | 상품과 응대 정책 편집                                             |
| `/phone`         | 브라우저 녹음, 음성 전사 또는 예시 메모로 문의 만들기             |
| `/outreach`      | 관찰한 신호를 바탕으로 첫 연락 초안 만들기                        |
| `/architect`     | 공개 URL 수집 → 초안 → 점수 → 정책 검사 실행                      |
| `/p/identity`    | 상품 판매 페이지와 문의 폼 데모 (`landing`, `retainer`도 제공)    |

판매 페이지의 문의도 **그 페이지를 연 브라우저에만** 저장됩니다. 다른 사용자의 수신함으로 전달되지 않습니다. 상담 일정은 외부 캘린더와 동기화되지 않으며, 기본 상담·결제 링크는 예시이므로 실제 영업에 사용하기 전에 교체해야 합니다.

초기 데모 연락처는 `example.com` 주소와 통화할 수 없는 데모 식별자이며 링크는 `example.invalid`를 사용합니다. 이미 저장된 로컬 데이터는 자동으로 바뀌지 않으므로 새 예시 데이터를 쓰려면 변경 내용을 보관한 뒤 데모 초기화를 직접 실행하세요.

## 선택 사항: 외부 서비스 연결

**직접 운영하는 별도 환경에서만 사용합니다.** 기본값은 `SALESMAN_ENABLE_PAID_PROVIDERS=false`입니다. 인증·요청 제한·사용량 한도를 먼저 마련한 뒤 서버에서 `SALESMAN_ENABLE_PAID_PROVIDERS=true`를 명시해야 아래 공급자 키가 사용됩니다. 키만 추가하면 활성화되지 않습니다. `VERCEL` 또는 `VERCEL_ENV`가 있는 환경에서는 이 플래그가 true여도 유료 공급자·음성 전사·URL 수집·Nosana/IPFS 호출을 차단합니다. 공개 데모에는 개인 API 키를 등록하지 마세요.

서버를 시작하는 셸 또는 호스팅 서비스의 환경 변수 설정으로 주입하세요. `.env` 파일은 필요하지 않으며 이 저장소의 개발 규칙에 따라 만들지 않습니다. API 비밀 키에 `VITE_` 접두사를 붙이거나 코드, 이슈, 스크린샷에 넣지 마세요.

| 기능                 | 환경 변수                                                                                                          | 미설정·실패 시 동작                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Qwen 초안·분석       | `DASHSCOPE_API_KEY` 또는 `QWEN_API_KEY`                                                                            | Qwen 우선. 없거나 실패하면 설정된 Grok 사용                                    |
| Grok 초안·분석       | `XAI_API_KEY`                                                                                                      | Qwen과 Grok 키가 모두 없을 때만 로컬 데모 응답 사용                            |
| 음성 전사            | `XAI_API_KEY`                                                                                                      | 키가 없으면 전사 불가. 텍스트·예시 메모 입력은 사용 가능                       |
| Bright Data URL 수집 | `BRIGHTDATA_API_TOKEN`, `BRIGHT_DATA_API_KEY`, `BRIGHTDATA_API_KEY` 중 하나                                        | 미설정·실패 시 서버에서 URL 직접 요청. 수집도 실패하면 입력한 신호로 계속 진행 |
| Nosana GPU 점수      | `NOSANA_API_KEY` 또는 `NOSANA_API_TOKEN`, **그리고** `NOSANA_MARKET`, `NOSANA_SCORE_IMAGE` 또는 `NOSANA_GPU_IMAGE` | 필수 설정 누락·실패 시 Qwen/Grok/로컬 점수 사용                                |
| Daytona 정책 검사    | `DAYTONA_API_KEY` 또는 `DAYTONA_API_TOKEN`                                                                         | 미설정·실패 시 서버 프로세스 안에서 정규식 검사                                |

위 표는 외부 호출을 명시적으로 허용한 자체 운영 환경의 동작입니다. 이 경우 Qwen만 설정한 상태에서 Qwen이 실패하면 오류를 반환하며, 설정된 모델의 실패를 로컬 응답으로 숨기지 않습니다. 인프라의 연결 배지는 서버 허용 여부와 환경 변수 존재 여부이며, 실제 연결 성공은 실행 결과의 `via`와 단계별 상태로 확인합니다. 데모 모드에서는 직접 URL 요청도 하지 않고 입력된 예시 신호로 계속 진행하며, 전사 대신 텍스트·예시 메모를 사용합니다.

추가 설정:

- Qwen: `QWEN_BASE_URL` (기본 `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`), `QWEN_MODEL` (기본 `qwen-plus`). Grok: `XAI_MODEL` (기본 `grok-4.5`).
- Bright Data: `BRIGHTDATA_ZONE` (기본 `web_unlocker1`). 공개 페이지 수집만을 목적으로 합니다.
- Nosana: `NOSANA_SCORE_CMD` (기본 `python /app/score.py`), `NOSANA_JOB_TIMEOUT` (기본 120), `NOSANA_POLL_ATTEMPTS` (기본 6), `NOSANA_POLL_INTERVAL_MS` (기본 2000). 이미지는 직접 준비해야 합니다. `SALESMAN_INPUT` 환경 변수의 JSON을 읽어 `score`, `label`, `next`가 담긴 JSON 결과를 내는 작업을 기대합니다. 폴링 중 결과가 도착하지 않으면 `nosana-queued`와 임시 점수 50을 반환하며, 완료된 추론 점수가 아닙니다.
- Daytona: `DAYTONA_API_URL`, `DAYTONA_ORGANIZATION_ID`, `DAYTONA_TARGET`, `DAYTONA_SNAPSHOT` (기본 `daytona-small`). 초안과 금지 정책을 샌드박스에 전달하고 실행 후 삭제를 시도합니다.

외부 서비스 사용에는 해당 계정의 요금과 약관이 적용됩니다. 모델 분석 시 문의 내용·연락처·상품·정책이, 전사 시 녹음이 해당 공급자에게 전달됩니다. Daytona에는 초안과 정책이 전달됩니다. **Nosana는 대상 이름·수집 정보·초안이 담긴 작업 정의를 IPFS에 게시하므로 입력이 공개되고 계속 남을 수 있습니다.** 해당 경로에는 공개되어도 되는 데모 데이터만 사용하세요.

## 구조

```text
src/routes/          TanStack 파일 라우트와 페이지
src/components/      화면 공통 요소
src/lib/store.ts     Zustand 상태와 localStorage 저장
src/lib/seed.ts      데모 상품·문의·정책
src/lib/ai.ts        분석·초안·음성 전사 서버 함수
src/lib/provider.ts  Qwen → Grok → 키 없는 로컬 데모 라우팅
src/lib/architect.ts 수집·초안·GPU 점수·정책 검사 파이프라인
scripts/            실행 래퍼, 검증·테스트, 플랫폼 지원 도구
server/             Nitro 서버 미들웨어
```

React 19, TypeScript, TanStack Start/Router, Vite, Tailwind CSS 4, Zustand를 사용합니다. 서버 함수가 있으므로 정적 HTML 배포만으로 외부 서비스 기능을 실행할 수 없습니다. 현재 빌드 설정은 Nitro의 Vercel 프리셋을 사용합니다. Grok App Builder 기반의 PWA·미리보기 지원 코드가 포함되어 있습니다.

## 데이터와 운영 한계

- 저장 키는 `salesman-studio`입니다. 브라우저 저장소 삭제 또는 데모 초기화 시 편집 내용이 사라집니다. 기기 간 동기화, 백업, 계정별 격리가 없습니다.
- 인증·요청 제한·실제 메시지 발송·결제 처리·캘린더 연동을 제공하지 않습니다. 기본 및 Vercel 배포는 유료 호출이 차단됩니다. 이를 자체 운영 환경에서 활성화하려면 별도의 접근 제어와 사용량 제한이 필요합니다.
- AI 결과와 정책 검사는 검토를 돕는 자료입니다. 정책 검사는 일부 영어 표현을 정규식으로 찾으며 모든 위반을 판별하지 못합니다. 최종 초안을 사람이 확인해야 합니다.
- 오류 수집은 기본 비활성화입니다. 브라우저는 `VITE_SENTRY_ENABLED=true`와 직접 소유한 `VITE_SENTRY_DSN`, 서버는 `SENTRY_ENABLED=true`와 직접 소유한 `SENTRY_DSN`을 모두 설정해야 활성화됩니다. Sentry DSN은 공개 수집 주소이며 API 비밀 키가 아닙니다. 폰트와 Grok 플랫폼 스크립트 등의 외부 리소스 요청은 오류 수집 설정과 별개입니다.
- 현재 코드는 해커톤 데모이며 실제 서비스 운영을 위한 보안·개인정보·공급자 통합 검증이 완료된 제품은 아닙니다. 보안 제보는 [SECURITY.md](SECURITY.md)를 참고하세요.

## 기여와 라이선스

[기여 안내](CONTRIBUTING.md)를 읽고 [이슈](https://github.com/brucedata/salesman-hackathon/issues) 또는 Pull Request로 참여해 주세요. 문서 개선, 오류 재현, 접근성 개선도 환영합니다.

이 프로젝트의 자체 코드는 [MIT License](LICENSE)로 배포합니다. 포함된 외부 코드·자산을 새로 라이선스하는 의미는 아니며, 패키지·서비스·폰트·브랜드에는 각각의 조건이 적용됩니다. [제3자 고지](THIRD_PARTY_NOTICES.md)를 함께 확인하세요.
