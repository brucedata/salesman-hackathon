import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatComplete as providerChatComplete } from "./provider";

export type ProviderId = "brightdata" | "qwen" | "nosana" | "daytona";

export type ProviderStatus = {
  id: ProviderId;
  name: string;
  role: string;
  live: boolean;
  fallback: string;
};

function envOn(...keys: string[]) {
  return keys.some((k) => Boolean(process.env[k]?.trim()));
}

export const getInfraStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProviderStatus[]> => [
    {
      id: "brightdata",
      name: "Bright Data",
      role: "웹 수집 · 경쟁 페이지 · 시그널",
      live: envOn("BRIGHTDATA_API_TOKEN", "BRIGHT_DATA_API_KEY", "BRIGHTDATA_API_KEY"),
      fallback: "서버 측 공개 URL 수집",
    },
    {
      id: "qwen",
      name: "QwenCloud",
      role: "한국어 초안 · 개인화",
      live: envOn("DASHSCOPE_API_KEY", "QWEN_API_KEY"),
      fallback: "Grok 4.5 · 키 없으면 로컬 데모",
    },
    {
      id: "nosana",
      name: "Nosana GPU",
      role: "의도 점수 · 배치 추론",
      live:
        envOn("NOSANA_API_KEY", "NOSANA_API_TOKEN") &&
        envOn("NOSANA_MARKET") &&
        envOn("NOSANA_SCORE_IMAGE", "NOSANA_GPU_IMAGE"),
      fallback: "Qwen/Grok/로컬 점수 (market·image 설정 필요)",
    },
    {
      id: "daytona",
      name: "Daytona",
      role: "정책 린트 · 격리 실행",
      live: envOn("DAYTONA_API_KEY", "DAYTONA_API_TOKEN"),
      fallback: "인프로세스 샌드박스",
    },
  ],
);

type ChatOk = { ok: true; text: string; provider: string };
type ChatFail = { ok: false; error: string };

async function chatComplete(
  messages: { role: "system" | "user"; content: string }[],
  maxTokens: number,
  json?: boolean,
): Promise<ChatOk | ChatFail> {
  const result = await providerChatComplete(messages, maxTokens, { json });
  return result.ok
    ? { ok: true, text: result.text, provider: result.provider }
    : result;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

type CollectedPage = {
  text: string;
  via: string;
  title: string | null;
  priceLike: string[];
  ctas: string[];
};

function collectSignals(raw: string): Omit<CollectedPage, "via"> {
  let source = raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    source = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
  } catch {
    /* Bright Data may return raw HTML. */
  }
  const title = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  const text = stripHtml(source);
  const priceLike = Array.from(
    new Set(text.match(/(?:₩|KRW\s?|\$)\s?[\d,]+|[\d,]+\s?원/g) ?? []),
  ).slice(0, 8);
  const ctas = Array.from(
    new Set(text.match(/(?:문의하기|상담하기|예약하기|구매하기|신청하기|contact|book|buy|apply)/gi) ?? []),
  ).slice(0, 6);
  return { text, title, priceLike, ctas };
}

async function collectPage(url: string): Promise<CollectedPage> {
  const token =
    process.env.BRIGHTDATA_API_TOKEN ||
    process.env.BRIGHT_DATA_API_KEY ||
    process.env.BRIGHTDATA_API_KEY;
  if (token) {
    const zone = process.env.BRIGHTDATA_ZONE || "web_unlocker1";
    try {
      const res = await fetch("https://api.brightdata.com/request", {
        method: "POST",
        signal: AbortSignal.timeout(20_000),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zone, url, format: "raw" }),
      });
      if (res.ok) return { ...collectSignals(await res.text()), via: "brightdata" };
    } catch {
      /* Fall through to the public URL fetch below. */
    }
  }
  const res = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": "SalesmanArchitect/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`수집 실패 (${res.status})`);
  return { ...collectSignals(await res.text()), via: "direct-fetch" };
}

function policySandbox(draft: string, doNot: string[]) {
  const hits: string[] = [];
  if (/(계좌|입금|국민은행|카카오뱅크|우리은행)\s*\d/.test(draft)) {
    hits.push("개인 계좌 숫자 안내");
  }
  if (/\d{1,2}\s*%/.test(draft) && doNot.some((d) => d.includes("할인"))) {
    hits.push("승인 전 할인율");
  }
  if (doNot.some((rule) => rule.includes("경쟁") && /(최악|쓰레기|사기)/.test(draft))) {
    hits.push("경쟁사 비방");
  }
  return { pass: hits.length === 0, hits };
}

type PolicyResult = ReturnType<typeof policySandbox> & { via: string };

async function runDaytonaPolicy(draft: string, doNot: string[]): Promise<PolicyResult> {
  const token = process.env.DAYTONA_API_KEY || process.env.DAYTONA_API_TOKEN;
  if (!token) return { ...policySandbox(draft, doNot), via: "isolate" };

  let sandbox: Awaited<ReturnType<import("@daytona/sdk").Daytona["create"]>> | undefined;
  try {
    const { Daytona } = await import("@daytona/sdk");
    const daytona = new Daytona({
      apiKey: token,
      apiUrl: process.env.DAYTONA_API_URL || "https://app.daytona.io/api",
      organizationId: process.env.DAYTONA_ORGANIZATION_ID,
      target: process.env.DAYTONA_TARGET,
      requestTimeoutMs: 20_000,
    });
    sandbox = await daytona.create(
      {
        snapshot: process.env.DAYTONA_SNAPSHOT || "daytona-small",
        language: "python",
        envVars: {
          SALESMAN_DRAFT: draft,
          SALESMAN_RULES: JSON.stringify(doNot),
        },
        autoStopInterval: 5,
        ttlMinutes: 10,
        networkBlockAll: true,
      },
      { timeout: 30 },
    );
    const response = await sandbox.process.codeRun(
      "import json, os, re\n"
        + "draft = os.environ.get('SALESMAN_DRAFT', '')\n"
        + "rules = json.loads(os.environ.get('SALESMAN_RULES', '[]'))\n"
        + "hits = []\n"
        + "if re.search(r'(계좌|입금|국민은행|카카오뱅크|우리은행)\\s*\\d', draft): hits.append('개인 계좌 숫자 안내')\n"
        + "if re.search(r'\\d{1,2}\\s*%', draft) and any('할인' in rule for rule in rules): hits.append('승인 전 할인율')\n"
        + "if any('경쟁' in rule for rule in rules) and re.search(r'(최악|쓰레기|사기)', draft): hits.append('경쟁사 비방')\n"
        + "print(json.dumps({'pass': len(hits) == 0, 'hits': hits}, ensure_ascii=False))",
      { env: { SALESMAN_DRAFT: draft, SALESMAN_RULES: JSON.stringify(doNot) } },
      10,
    );
    const output = response.artifacts?.stdout ?? response.result ?? "";
    const parsed = JSON.parse(output.trim()) as { pass?: boolean; hits?: unknown[] };
    return {
      pass: Boolean(parsed.pass),
      hits: Array.isArray(parsed.hits) ? parsed.hits.map(String) : [],
      via: "daytona",
    };
  } catch {
    return { ...policySandbox(draft, doNot), via: "isolate-fallback" };
  } finally {
    if (sandbox) {
      try {
        const { Daytona } = await import("@daytona/sdk");
        const daytona = new Daytona({
          apiKey: token,
          apiUrl: process.env.DAYTONA_API_URL || "https://app.daytona.io/api",
          organizationId: process.env.DAYTONA_ORGANIZATION_ID,
          target: process.env.DAYTONA_TARGET,
          requestTimeoutMs: 20_000,
        });
        await daytona.delete(sandbox);
      } catch {
        /* Cleanup failure must not hide the policy result. */
      }
    }
  }
}

type NosanaScore = {
  score: number;
  label: string;
  nextAction: string;
  via: string;
  detail: string;
};

function scoreFromPayload(payload: unknown): NosanaScore | null {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { score?: number; label?: string; next?: string };
    if (typeof parsed.score !== "number") return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      label: String(parsed.label || "관심"),
      nextAction: String(parsed.next || "대표가 초안을 검수하세요."),
      via: "nosana-job",
      detail: "GPU job 결과",
    };
  } catch {
    return null;
  }
}

async function runNosanaScore(input: {
  name: string;
  intel: string;
  draft: string;
}): Promise<NosanaScore | null> {
  const apiKey = process.env.NOSANA_API_KEY || process.env.NOSANA_API_TOKEN;
  const market = process.env.NOSANA_MARKET;
  const image = process.env.NOSANA_SCORE_IMAGE || process.env.NOSANA_GPU_IMAGE;
  if (!apiKey || !market || !image) return null;

  try {
    const { createNosanaClient, NosanaNetwork, validateJobDefinition } = await import("@nosana/kit");
    const validation = validateJobDefinition({
      version: "0.1",
      type: "container",
      meta: { trigger: "api" },
      ops: [
        {
          type: "container/run",
          id: "salesman-score",
          args: {
            image,
            cmd: process.env.NOSANA_SCORE_CMD || "python /app/score.py",
            env: { SALESMAN_INPUT: JSON.stringify(input) },
            gpu: true,
          },
        },
      ],
    });
    if (!validation.success) return null;

    const client = createNosanaClient(NosanaNetwork.MAINNET, { api: { apiKey } });
    const ipfsHash = await client.ipfs.pin(validation.data);
    const posted = await client.api.jobs.list(
      {
        ipfsHash,
        market,
        timeout: Number(process.env.NOSANA_JOB_TIMEOUT || 120),
      },
      { idempotencyKey: `salesman-${Date.now()}-${Math.random().toString(36).slice(2)}` },
    );
    const attempts = Number(process.env.NOSANA_POLL_ATTEMPTS || 6);
    const interval = Number(process.env.NOSANA_POLL_INTERVAL_MS || 2000);
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const job = await client.api.jobs.get(posted.job);
      if (job.ipfsResult) {
        const result = scoreFromPayload(await client.ipfs.retrieve(job.ipfsResult));
        if (result) return result;
      }
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return {
      score: 50,
      label: "관심",
      nextAction: "Nosana GPU job이 실행 중입니다. 대표가 초안을 먼저 검수하세요.",
      via: "nosana-queued",
      detail: `job ${posted.job} 대기 중`,
    };
  } catch {
    return null;
  }
}

const runInput = z.object({
  name: z.string(),
  area: z.string(),
  signal: z.string(),
  url: z.string().optional(),
  companyName: z.string(),
  founderName: z.string(),
  tone: z.string(),
  refund: z.string(),
  delivery: z.string(),
  doNot: z.array(z.string()),
  productName: z.string(),
  productSummary: z.string(),
  consultUrl: z.string(),
  paymentUrl: z.string(),
});

export type ArchitectStep = {
  id: ProviderId;
  label: string;
  via: string;
  ms: number;
  ok: boolean;
  detail: string;
};

export type ArchitectResult = {
  ok: true;
  steps: ArchitectStep[];
  intel: string;
  draft: string;
  score: number;
  label: string;
  nextAction: string;
  policyPass: boolean;
  policyHits: string[];
} | { ok: false; error: string; steps: ArchitectStep[] };

export const runArchitect = createServerFn({ method: "POST" })
  .validator((input: unknown) => runInput.parse(input))
  .handler(async ({ data }): Promise<ArchitectResult> => {
    const steps: ArchitectStep[] = [];

    let intel = data.signal;
    const t0 = Date.now();
    try {
      if (data.url?.startsWith("http")) {
        const page = await collectPage(data.url);
        const signals = [
          page.title ? `제목: ${page.title}` : "",
          page.priceLike.length ? `가격 단서: ${page.priceLike.join(", ")}` : "",
          page.ctas.length ? `CTA: ${page.ctas.join(", ")}` : "",
        ].filter(Boolean).join("\n");
        intel = `${data.signal}\n\n[수집]\n${signals}\n${page.text.slice(0, 1800)}`;
        steps.push({
          id: "brightdata",
          label: "시그널 수집",
          via: page.via,
          ms: Date.now() - t0,
          ok: true,
          detail: `${page.text.length}자 · 가격 ${page.priceLike.length}개 · CTA ${page.ctas.length}개`,
        });
      } else {
        steps.push({
          id: "brightdata",
          label: "시그널 수집",
          via: "inbox-signal",
          ms: Date.now() - t0,
          ok: true,
          detail: "대상 관찰 신호를 사용했습니다.",
        });
      }
    } catch (err) {
      steps.push({
        id: "brightdata",
        label: "시그널 수집",
        via: "error",
        ms: Date.now() - t0,
        ok: false,
        detail: err instanceof Error ? err.message : "수집 실패",
      });
    }

    const t1 = Date.now();
    const draftRes = await chatComplete(
      [
        {
          role: "system",
          content: `${data.companyName} ${data.founderName}. 톤:${data.tone}
환불:${data.refund} 납기:${data.delivery}
금지:${data.doNot.join(" / ")}
상품:${data.productName} ${data.productSummary}
상담:${data.consultUrl} 결제:${data.paymentUrl}
한국어 아웃리치 본문만. 6~12문장. 과장 금지.`,
        },
        {
          role: "user",
          content: `대상:${data.name} (${data.area})\n${intel}`,
        },
      ],
      500,
    );
    if (!draftRes.ok) {
      steps.push({
        id: "qwen",
        label: "한국어 초안",
        via: "none",
        ms: Date.now() - t1,
        ok: false,
        detail: draftRes.error,
      });
      return { ok: false, error: draftRes.error, steps };
    }
    const draft = draftRes.text;
    steps.push({
      id: "qwen",
      label: "한국어 초안",
      via: draftRes.provider,
      ms: Date.now() - t1,
      ok: true,
      detail: `${draft.length}자`,
    });

    const t2 = Date.now();
    const scoreRes = await chatComplete(
      [
        {
          role: "system",
          content:
            'JSON only: {"score":0-100,"label":"낮음|관심|구매의도|즉시구매","next":"한 줄"}',
        },
        { role: "user", content: `${data.name}\n${intel}\n---\n${draft}` },
      ],
      200,
      true,
    );
    let score = 50;
    let label = "관심";
    let nextAction = "대표가 초안을 검수하세요.";
    if (scoreRes.ok) {
      try {
        const jsonText = scoreRes.text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(jsonText) as {
          score?: number;
          label?: string;
          next?: string;
        };
        score = Math.max(0, Math.min(100, Number(parsed.score) || 50));
        label = String(parsed.label ?? label);
        nextAction = String(parsed.next ?? nextAction);
      } catch {
        /* keep defaults */
      }
    }

    const nosanaScore = await runNosanaScore({ name: data.name, intel, draft });
    if (nosanaScore) {
      score = nosanaScore.score;
      label = nosanaScore.label;
      nextAction = nosanaScore.nextAction;
    }
    steps.push({
      id: "nosana",
      label: "GPU 의도 점수",
      via: nosanaScore?.via || (scoreRes.ok ? `score:${scoreRes.provider}` : "skipped"),
      ms: Date.now() - t2,
      ok: Boolean(nosanaScore || scoreRes.ok),
      detail: nosanaScore?.detail || (scoreRes.ok ? `${score} · ${label}` : scoreRes.error),
    });

    const t3 = Date.now();
    const policy = await runDaytonaPolicy(draft, data.doNot);
    steps.push({
      id: "daytona",
      label: "정책 샌드박스",
      via: policy.via,
      ms: Date.now() - t3,
      ok: policy.pass,
      detail: policy.pass ? "금지 조항 통과" : policy.hits.join(", "),
    });

    return {
      ok: true,
      steps,
      intel: intel.slice(0, 1200),
      draft,
      score,
      label,
      nextAction,
      policyPass: policy.pass,
      policyHits: policy.hits,
    };
  });
