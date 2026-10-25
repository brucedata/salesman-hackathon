# Salesman 10분 체험 가이드

가상의 스튜디오 고객 문의를 하나 만들고, 예시 초안을 수정한 뒤 승인 기록까지 남겨 보세요. **설치 시간을 제외하고 약 10분**입니다. 화면은 영어이며, 아래 버튼 이름은 실제 화면 표기를 따릅니다.

**Salesman의 오픈소스 코드와 이 기본 로컬 데모는 무료입니다.** 사용료나 구독료를 결제하지 않고, API 키 없이 아래 체험을 진행할 수 있습니다.

**19,000원은 별도 ‘업종별 응대 템플릿·정책 체크리스트’ 문서 상품의 검토 중인 가격 후보입니다.** 아직 가격 확정·판매 전이며, Salesman 사용료가 아닙니다. 템플릿을 구매하지 않아도 이 가이드의 데모를 사용할 수 있습니다.

이 체험은 API 키 없이 실행하는 데모입니다. 생성되는 초안·점수는 고정된 예시이며 실제 AI 분석이 아닙니다. 이메일·문자·전화 발송, 음성 전사, 외부 URL 수집은 수행하지 않습니다. 문의·상품·정책은 현재 브라우저에 저장되고 다른 사람에게 전달되지 않습니다. 실제 고객 이름, 연락처, 상담 내용이나 API 키 대신 아래 가상 데이터를 사용하세요.

## 시작하기

Git, Node.js **22.13 이상인 22.x 또는 24 이상**, npm이 필요합니다. 터미널에서 다음 명령을 실행하세요.

```sh
git clone https://github.com/brucedata/salesman-hackathon.git
cd salesman-hackathon
npm ci
npm run dev
```

[내 컴퓨터의 Salesman](http://localhost:8080)을 엽니다. 서버를 실행한 터미널은 체험이 끝날 때까지 열어 두세요. API 키나 환경 변수 파일을 추가할 필요가 없습니다. 기본 데모 설정을 그대로 사용합니다.

Vercel 배포 링크는 팀 로그인이 필요할 수 있어 누구나 열 수 있는 온라인 체험을 보장하지 않습니다. 이 가이드는 위 로컬 실행을 기준으로 합니다.

## 0–1분: 판매할 상품 확인

[Offers](http://localhost:8080/products)를 열고 **Brand Identity Package**를 찾습니다. 화면의 KRW 1,200,000은 **가상 스튜디오 상품의 데모 가격**이며 Salesman 사용료나 별도 템플릿 가격이 아닙니다. 옆의 **Offer policy**에서 **Refunds**, **Delivery**, **Do not use (one per line)**도 읽어 보세요.

이번 체험에서는 값을 바꾸지 않습니다. 실제 운영이라면 초안의 가격·납기·환불 약속을 이 정책과 대조해야 합니다. 데모의 예시 초안은 정책을 수정해도 그에 맞춰 추론하지 않습니다.

## 1–3분: 가상 고객 문의 만들기

Brand Identity Package 카드의 **Sales page**를 누르거나 [상품 페이지](http://localhost:8080/p/identity)를 엽니다. **Get in touch** 폼에 다음 값을 넣습니다.

| 입력란                 | 입력할 예시           |
| ---------------------- | --------------------- |
| Name                   | Demo Cafe Owner       |
| Email or phone         | cafe-demo@example.com |
| What can we help with? | 아래 문의 본문        |

```text
I am opening a fictional cafe next month. I need a logo, business cards, and a simple color guide. My demo budget is KRW 1,200,000. Could you explain the scope and what we should confirm before choosing a start date?
```

**Send inquiry**를 누르면 새 문의의 상세 화면으로 이동합니다. 이름이 **Demo Cafe Owner**, 채널이 **Website**, 단계가 **New**인지 확인하세요. 웹폼의 제출은 같은 브라우저에 문의를 추가하는 동작입니다. 외부 사업자에게 메시지를 보내지 않습니다.

## 3–5분: 예시 초안 검토·수정

**Analyze intent and draft**를 누릅니다. **Purchase intent**에 `58 - Interested`, **Email draft**에 예시 문장이 채워지고 단계는 **Awaiting approval**로 바뀝니다.

58점은 이 문의의 실제 구매 가능성을 측정한 결과가 아닙니다. 문구가 문의에 맞는지 사람이 확인하고 고치는 흐름을 체험해 보세요. 초안 입력칸을 아래 내용으로 바꿔도 됩니다.

```text
Hi Demo Cafe Owner, thanks for your inquiry. The Brand Identity Package is KRW 1,200,000 and includes two logo directions, one revision round, a color and type guide, and business-card and social-profile templates. Before confirming a start date, we need to check the full scope and the materials you already have. Please share a suitable time for a short consultation. This is a fictional demo draft; no message will be sent.
```

초안은 입력하면서 저장됩니다. **Re-analyze**를 누르면 편집한 내용이 다시 예시 초안으로 바뀌므로, 수정본을 남기려면 재분석하지 마세요. 예시에 포함된 `example.invalid` 링크는 실제 상담·결제 주소가 아닙니다.

## 5–7분: 상담 일정과 승인 기록

1. **Conversation** 아래 **Book consultation** 입력칸에 미래 날짜와 시간을 선택합니다.
2. **Record booking**을 누릅니다. `Booked:` 표시가 생기고 단계가 **Qualified**로 바뀝니다. 외부 캘린더 예약이나 고객 알림은 생성되지 않습니다.
3. 위쪽 초안을 다시 읽고 **Approve and record send**를 한 번 누릅니다.
4. 단계가 **Send recorded**가 되고 **Conversation**에 수정한 답변이 추가되는지 확인합니다.

화면의 발송 기록은 실제 이메일·문자 발송 영수증이 아닙니다. 승인한 문구와 처리 상태만 이 브라우저에 기록합니다.

## 7–8분: 파이프라인에서 찾기

메뉴의 **Pipeline** 또는 [파이프라인](http://localhost:8080/pipeline)을 엽니다. **Send recorded** 열에서 **Demo Cafe Owner** 카드를 찾으세요. 화면 폭이 좁으면 열을 가로로 스크롤할 수 있습니다.

카드의 단계 선택 상자를 **Won**으로 바꾸면 카드가 **Won** 열로 이동합니다. 계약이나 결제가 발생하는 동작은 아닙니다. 고객 이름을 누르면 상세 화면으로 돌아갈 수 있습니다.

수신함에서 문의를 다시 찾을 때는 [Inbox](http://localhost:8080/inbox)의 **All**을 누르세요. 기본 **Missed inquiries** 필터에서는 처리한 문의가 사라지는 것이 정상입니다.

## 8–10분: 사용 경험 남기기

[체험 피드백 작성](https://github.com/brucedata/salesman-hackathon/issues/new?template=demo-feedback.yml)에서 완료한 단계, 걸린 시간, 막힌 부분과 수정하고 싶었던 문장을 알려 주세요. GitHub 로그인이 필요하며, 제출한 이슈는 공개됩니다.

기억에 의존해 시간을 추정했다면 **추정**이라고 적어 주세요. 예시 초안을 고친 체험만으로 실제 고객 응대 시간 절약이나 매출 효과를 판단할 수는 없습니다. 스크린샷에는 가상 데이터만 포함하고, 고객 정보·개인 연락처·키·계정 정보는 올리지 마세요. 피드백은 선택 사항이며 자동 전송되지 않습니다.

## 선택 체험: 놓친 전화 메모

[Missed contact](http://localhost:8080/phone)에서 **Examples**의 **Seorin Oh**를 누르면 가상 전화 메모가 채워집니다. **Add to missed inquiries**를 눌러 수신함에 추가할 수 있습니다. 직접 입력할 때도 `demo-phone-05`처럼 통화할 수 없는 식별자를 사용하세요.

이 데모에서는 **Record voice**를 사용하지 마세요. 녹음 버튼은 브라우저의 마이크 권한을 요청하지만 서버의 음성 전사는 비활성화되어 있습니다. **Architect**의 URL 입력도 기본 데모에서 외부 페이지를 수집하지 않습니다.

## 종료와 데이터 보관

- 서버를 실행한 터미널에서 **Ctrl+C**를 눌러 종료합니다. 다시 실행할 때는 저장소 폴더에서 `npm run dev`를 실행하면 됩니다.
- 서버를 종료하거나 페이지를 새로 고쳐도 같은 브라우저·같은 주소의 저장 데이터는 보통 유지됩니다. `localhost`와 `127.0.0.1`, 다른 브라우저·프로필은 같은 저장소를 공유하지 않습니다. 시크릿 창 종료나 브라우저 데이터 삭제 시 내용이 사라질 수 있습니다.
- **Reset demo**는 확인창 없이 문의·초안·상품·정책·상담 기록을 초기 예시로 되돌립니다. 되돌리기·내보내기 기능이 없으므로 보관할 수정본은 먼저 따로 복사하세요. 앱 상단에 있으며 좁은 화면에서는 회전 화살표 아이콘만 보입니다.

## 막혔을 때

| 상황                             | 확인할 것                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 버전 오류                   | `node --version`으로 22.13 이상인 22.x 또는 24 이상인지 확인합니다.                                                                                             |
| 8080 포트를 사용 중이라는 오류   | 전에 실행한 Salesman 터미널이 있다면 Ctrl+C로 종료한 뒤 다시 실행합니다.                                                                                        |
| 처리한 문의가 수신함에서 안 보임 | **Inbox → All**을 선택합니다.                                                                                                                                   |
| 예시 점수·문장이 계속 같음       | 기본 데모의 정상 동작입니다. 입력에 맞춘 실제 AI 추론을 제공하지 않습니다.                                                                                      |
| 상담·결제 링크가 열리지 않음     | `example.invalid`는 체험용 주소입니다. 실제 결제나 예약은 제공하지 않습니다.                                                                                    |
| 설치나 화면 오류가 계속됨        | [체험 피드백](https://github.com/brucedata/salesman-hackathon/issues/new?template=demo-feedback.yml)에 OS·Node 버전·단계·비밀을 지운 오류 메시지를 적어 주세요. |

기능과 운영 한계는 [README](../README.md), 보안 문제의 비공개 제보 방법은 [SECURITY.md](../SECURITY.md)를 참고하세요.
