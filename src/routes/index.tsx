import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  Filter,
  MessageCircle,
  Palette,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Home });

const steps = [
  {
    n: "1",
    title: "놓친 연락을 모읍니다",
    body: "작업 중 못 받은 전화, 읽지 않은 메일, 카톡·문자를 한 데스크에 쌓습니다.",
  },
  {
    n: "2",
    title: "응대 초안을 만듭니다",
    body: "부재중이면 짧게 사과하고, 정책에 맞는 다음 행동·상담 링크를 붙입니다.",
  },
  {
    n: "3",
    title: "의도를 걸러 예약을 잡습니다",
    body: "예산·일정·의사결정자를 점수로 나누고, 높은 의도만 상담 캘린더에 넣습니다.",
  },
  {
    n: "4",
    title: "대표가 승인한 뒤 닫습니다",
    body: "초안은 혼자 나가지 않습니다. 승인 후 상담 링크와 결제 링크가 전달됩니다.",
  },
];

const caps = [
  {
    icon: Send,
    title: "개인화 아웃리치",
    body: "지역·상품·관찰 신호를 넣어 첫 연락을 씁니다. 복사해서 보내기 전까지는 대표 몫입니다.",
  },
  {
    icon: MessageCircle,
    title: "사람처럼 이어지는 대화",
    body: "전화 음성은 텍스트로, 카톡·메일은 스레드로. 놓친 연락부터 이어서 답합니다.",
  },
  {
    icon: Filter,
    title: "스마트 리드 필터",
    body: "구매 가능성 점수와 다음 행동. 학생 할인 요청과 오픈 임박 카페를 같은 줄에 두지 않습니다.",
  },
  {
    icon: Palette,
    title: "상담 전 미리보기",
    body: "상품 범위, 납기, 가격 밴드를 초안에 넣어 상담 전에 기대를 맞춥니다.",
  },
  {
    icon: Sparkles,
    title: "정책 기반 CRM",
    body: "환불·금지·톤이 저장됩니다. 초안이 정책을 어기면 다시 씁니다.",
  },
  {
    icon: Calendar,
    title: "일정 예약",
    body: "자격 있는 리드만 상담 슬롯에 올립니다. 캘린더 링크는 상품에 이미 붙어 있습니다.",
  },
];

function Home() {
  const [jobs, setJobs] = useState(10);
  const contacts = jobs * 25;
  const [demoName, setDemoName] = useState("");

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-line bg-bg shadow-[0_1px_0_var(--color-line)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="#top" className="text-lg font-bold text-navy">
            Salesman
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-fg">
              작동 방식
            </a>
            <a href="#features" className="hover:text-fg">
              기능
            </a>
            <a href="#calculator" className="hover:text-fg">
              계산기
            </a>
            <a href="#results" className="hover:text-fg">
              성과
            </a>
            <Link to="/architect" className="hover:text-fg">
              아키텍트
            </Link>
            <Link to="/inbox" className="hover:text-fg">
              워크스페이스
            </Link>
          </nav>
          <a href="#demo">
            <Button size="sm">무료 데모 예약</Button>
          </a>
        </div>
      </header>

      <section
        id="top"
        className="bg-[linear-gradient(to_bottom_right,var(--color-bg),var(--color-wash),#eff6ff)]"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-4xl text-fg md:text-6xl">
              일하는 동안 놓친 문의를
              <br />
              Salesman이 받습니다
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              전화, 이메일, 메시지를 한 데스크로. 작업자는 일에 집중하고, 응대 에이전트가 초안을 쌓아 둡니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo">
                <Button size="lg">
                  무료 데모 예약
                  <ArrowRight className="size-4" />
                </Button>
              </a>
              <Link to="/architect">
                <Button size="lg" variant="outline" className="text-navy">
                  아키텍트 열기
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">1인 스튜디오 데모 · 정책 기반 초안 · 전화는 텍스트로</p>
          </div>
          <div className="rounded-xl bg-raised p-4 shadow-[0_0_0_1px_var(--color-line),0_12px_40px_rgb(30_58_138/0.08)]">
            <p className="mb-3 text-xs font-medium text-navy">Salesman</p>
            <div className="space-y-3 text-sm">
              <p className="max-w-[90%] rounded-lg rounded-tl-sm bg-wash px-3 py-2">
                성수 카페 리뉴얼 보이는데, 간판·메뉴판 톤이 안 맞으면 오픈 전에 아이덴티티만 맞춰 드릴까요?
                무료 30분 상담이 내일 오후 2시에 있습니다.
              </p>
              <p className="ml-auto max-w-[90%] rounded-lg rounded-tr-sm bg-surface px-3 py-2">
                관심 있어요. 이번 달 시안이 가능한가요?
              </p>
              <p className="max-w-[90%] rounded-lg rounded-tl-sm bg-wash px-3 py-2">
                아이덴티티 패키지는 10영업일입니다. 내일 2시에 범위와 견적을 짧게 맞추죠.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="infra" className="border-y border-line bg-bg py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl">네 인프라로 도는 에이전트</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted">
            Seoul 크레딧 스택. 키가 붙으면 해당 공급자로 전환되고, 지금은 같은 순서를 폴백으로 실행합니다.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Bright Data", "웹 시그널 수집", "공개 페이지·가격·카피를 끌어와 아웃리치 재료로 씁니다."],
              ["QwenCloud", "한국어 LLM", "초안·개인화. 한국어 품질이 핵심인 대화 레이어."],
              ["Nosana GPU", "추론 컴퓨트", "의도 점수와 배치 에이전트 워크로드를 GPU에 올립니다. 8/25 만료 크레딧."],
              ["Daytona", "격리 샌드박스", "정책 린트와 생성 코드를 에이전트가 직접 실행하지 않고 상자 안에서 돌립니다."],
            ].map(([name, role, body]) => (
              <article
                key={name}
                className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]"
              >
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">{role}</p>
                <h3 className="mt-2 text-lg">{name}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl md:text-4xl">Salesman이 하는 일</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            첫 연락부터 예약까지. 발송 직전만 대표가 봅니다.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <article key={s.n} className="rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]">
                <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl">실제 대화 예시</h2>
          <div className="mt-8 space-y-3 rounded-xl bg-surface p-6 text-sm shadow-[0_0_0_1px_var(--color-line)]">
            <p className="rounded-lg bg-wash px-4 py-3">
              도연 님, 성수 카페 리뉴얼 준비 중이시죠. 메뉴판·간판·주문 페이지를 한 톤으로 맞추는 아이덴티티
              패키지 견적을 내일 오전에 드릴 수 있습니다.
            </p>
            <p className="rounded-lg bg-raised px-4 py-3 shadow-[0_0_0_1px_var(--color-line)]">
              이번 달 시안이 필요해요. 얼마인가요?
            </p>
            <p className="rounded-lg bg-wash px-4 py-3">
              패키지 1,200,000원, 10영업일. 범위 밖 할인은 대표 승인 전 약속하지 않습니다. 내일 11시 30분
              상담이 비어 있습니다.
            </p>
            <p className="rounded-md bg-good/10 px-4 py-3 font-medium text-good">상담 예약됨</p>
          </div>
        </div>
      </section>

      <section id="features" className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl md:text-4xl">핵심 기능</h2>
          <p className="mt-3 text-center text-muted">리드를 모으고, 걸러서, 매출로 닫기 위해 필요한 것</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {caps.map((c) => (
              <article
                key={c.title}
                className="rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]"
              >
                <c.icon className="size-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-4 text-lg">{c.title}</h3>
                <p className="mt-2 text-sm text-muted">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="calculator" className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl">이번 달 계약 목표</h2>
          <p className="mt-2 text-center text-sm text-muted">
            데모 공식: 계약 1건당 문의 25건 (4% 마감). 실제 비율은 상품마다 다릅니다.
          </p>
          <div className="mt-8 rounded-xl bg-surface p-6 shadow-[0_0_0_1px_var(--color-line)]">
            <label className="text-sm font-medium">이번 달 원하는 계약 수 · {jobs}건</label>
            <input
              type="range"
              min={2}
              max={40}
              value={jobs}
              onChange={(e) => setJobs(Number(e.target.value))}
              className="mt-4 w-full accent-accent"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-raised p-4">
                <p className="text-xs text-muted">Salesman이 다룰 문의</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-navy">{contacts}</p>
              </div>
              <div className="rounded-md bg-raised p-4">
                <p className="text-xs text-muted">목표 계약</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{jobs}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="results" className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl">데모 스튜디오 기준</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["5", "수신함 샘플 문의"],
              ["74점", "승인 대기 리드 의도"],
              ["48시간", "정책만 넣으면 초안 시작"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-xl bg-raised p-6 text-center shadow-[0_0_0_1px_var(--color-line)]">
                <p className="text-3xl font-semibold text-navy tabular-nums">{n}</p>
                <p className="mt-1 text-sm text-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="py-20">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-3xl">일정을 채울 준비가 됐나요?</h2>
          <p className="mt-3 text-muted">15분 데모. 설치비 없음. 워크스페이스는 지금 열 수 있습니다.</p>
          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              toast(demoName ? `${demoName} 님, 데모 요청을 기록했습니다.` : "데모 요청을 기록했습니다.");
              setDemoName("");
            }}
          >
            <input
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
              placeholder="이름 또는 상호"
              className="h-12 flex-1 rounded-md bg-raised px-3 text-sm shadow-[0_0_0_1px_var(--color-line)]"
            />
            <Button type="submit" size="lg">
              데모 요청
            </Button>
          </form>
          <Link to="/inbox" className="mt-4 inline-flex h-11 items-center text-sm text-navy">
            또는 워크스페이스 바로 열기
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-10 text-center text-xs text-faint">
        Salesman · 1인 사업자 AI 세일즈 에이전트 · 전화는 통신사 연결 없이 텍스트로 응대
      </footer>
    </div>
  );
}
