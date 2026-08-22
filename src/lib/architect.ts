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
  return keys.some((key) => Boolean(process.env[key]?.trim()));
}

export const getInfraStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<ProviderStatus[]> => [
    {
      id: "brightdata",
      name: "Bright Data",
      role: "Web collection, competitor pages, and signals",
      live: envOn("BRIGHTDATA_API_TOKEN", "BRIGHT_DATA_API_KEY", "BRIGHTDATA_API_KEY"),
      fallback: "Direct server-side fetch of public URLs",
    },
    {
      id: "qwen",
      name: "Qwen",
      role: "English drafts and personalization",
      live: envOn("DASHSCOPE_API_KEY", "QWEN_API_KEY"),
      fallback: "Grok or local demo response",
    },
    {
      id: "nosana",
      name: "Nosana GPU",
      role: "Intent scoring and batch inference",
      live:
        envOn("NOSANA_API_KEY", "NOSANA_API_TOKEN") &&
        envOn("NOSANA_MARKET") &&
        envOn("NOSANA_SCORE_IMAGE", "NOSANA_GPU_IMAGE"),
      fallback: "Qwen, Grok, or local scoring",
    },
    {
      id: "daytona",
      name: "Daytona",
      role: "Policy lint in isolated execution",
      live: envOn("DAYTONA_API_KEY", "DAYTONA_API_TOKEN"),
      fallback: "In-process policy sandbox",
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
    // Bright Data may return raw HTML.
  }
  const title = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  const text = stripHtml(source);
  const priceLike = Array.from(
    new Set(text.match(/(?:KRW\s?|\$)\s?[\d,]+|[\d,]+\s?(?:KRW|won)\b/gi) ?? []),
  ).slice(0, 8);
  const ctas = Array.from(
    new Set(text.match(/(?:contact|consult|book|buy|apply|request|inquire)/gi) ?? []),
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
      const response = await fetch("https://api.brightdata.com/request", {
        method: "POST",
        signal: AbortSignal.timeout(20_000),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zone, url, format: "raw" }),
      });
      if (response.ok) return { ...collectSignals(await response.text()), via: "brightdata" };
    } catch {
      // Fall through to direct public URL collection.
    }
  }
  const response = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": "SalesmanArchitect/1.0" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Collection failed (${response.status}).`);
  return { ...collectSignals(await response.text()), via: "direct-fetch" };
}

function policySandbox(draft: string, doNot: string[]) {
  const hits: string[] = [];
  const hasRule = (keyword: string) =>
    doNot.some((rule) => rule.toLowerCase().includes(keyword));

  if (/(bank\s+account|account\s+number|wire\s+transfer|routing\s+number)/i.test(draft)) {
    hits.push("Personal bank details");
  }
  if (/\d{1,2}\s*%/.test(draft) && hasRule("discount")) {
    hits.push("Unapproved discount");
  }
  if (hasRule("competitor") && /(worst|trash|scam|fraud)/i.test(draft)) {
    hits.push("Competitor disparagement");
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
    const policyScript = [
      "import json, os, re",
      "draft = os.environ.get('SALESMAN_DRAFT', '')",
      "rules = json.loads(os.environ.get('SALESMAN_RULES', '[]'))",
      "rules_lower = [str(rule).lower() for rule in rules]",
      "hits = []",
      "if re.search(r'(bank\\s+account|account\\s+number|wire\\s+transfer|routing\\s+number)', draft, re.I): hits.append('Personal bank details')",
      "if re.search(r'\\d{1,2}\\s*%', draft) and any('discount' in rule for rule in rules_lower): hits.append('Unapproved discount')",
      "if any('competitor' in rule for rule in rules_lower) and re.search(r'(worst|trash|scam|fraud)', draft, re.I): hits.append('Competitor disparagement')",
      "print(json.dumps({'pass': len(hits) == 0, 'hits': hits}))",
    ].join("\\n");
    const response = await sandbox.process.codeRun(
      policyScript,
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
        // Cleanup failure must not hide the policy result.
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
      label: String(parsed.label || "Interested"),
      nextAction: String(parsed.next || "Review the draft before sending."),
      via: "nosana-job",
      detail: "GPU job result",
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
      label: "Interested",
      nextAction: "The Nosana job is still queued. Review the outreach draft first.",
      via: "nosana-queued",
      detail: `Job ${posted.job} is still queued`,
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

export type ArchitectResult =
  | {
      ok: true;
      steps: ArchitectStep[];
      intel: string;
      draft: string;
      score: number;
      label: string;
      nextAction: string;
      policyPass: boolean;
      policyHits: string[];
    }
  | { ok: false; error: string; steps: ArchitectStep[] };

export const runArchitect = createServerFn({ method: "POST" })
  .validator((input: unknown) => runInput.parse(input))
  .handler(async ({ data }): Promise<ArchitectResult> => {
    const steps: ArchitectStep[] = [];

    let intel = data.signal;
    const collectionStartedAt = Date.now();
    try {
      if (data.url?.startsWith("http")) {
        const page = await collectPage(data.url);
        const signals = [
          page.title ? `Title: ${page.title}` : "",
          page.priceLike.length ? `Price signals: ${page.priceLike.join(", ")}` : "",
          page.ctas.length ? `CTAs: ${page.ctas.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        intel = `${data.signal}\n\n[Collection]\n${signals}\n${page.text.slice(0, 1800)}`;
        steps.push({
          id: "brightdata",
          label: "Signal collection",
          via: page.via,
          ms: Date.now() - collectionStartedAt,
          ok: true,
          detail: `${page.text.length} characters, ${page.priceLike.length} price signals, ${page.ctas.length} CTAs`,
        });
      } else {
        steps.push({
          id: "brightdata",
          label: "Signal collection",
          via: "inbox-signal",
          ms: Date.now() - collectionStartedAt,
          ok: true,
          detail: "Used the selected target's observed signal.",
        });
      }
    } catch (error) {
      steps.push({
        id: "brightdata",
        label: "Signal collection",
        via: "error",
        ms: Date.now() - collectionStartedAt,
        ok: false,
        detail: error instanceof Error ? error.message : "Collection failed.",
      });
    }

    const draftStartedAt = Date.now();
    const draftResult = await chatComplete(
      [
        {
          role: "system",
          content: `Write an English outreach body for ${data.companyName} from ${data.founderName}.
Tone: ${data.tone}
Refunds: ${data.refund}
Delivery: ${data.delivery}
Do not: ${data.doNot.join(" / ")}
Offer: ${data.productName} - ${data.productSummary}
Consultation: ${data.consultUrl}
Payment: ${data.paymentUrl}
Write only the outreach body in 6-12 sentences. Be concrete and do not use hype.`,
        },
        {
          role: "user",
          content: `Target: ${data.name} (${data.area})\n${intel}`,
        },
      ],
      500,
    );
    if (!draftResult.ok) {
      steps.push({
        id: "qwen",
        label: "Outreach draft",
        via: "none",
        ms: Date.now() - draftStartedAt,
        ok: false,
        detail: draftResult.error,
      });
      return { ok: false, error: draftResult.error, steps };
    }
    const draft = draftResult.text;
    steps.push({
      id: "qwen",
      label: "Outreach draft",
      via: draftResult.provider,
      ms: Date.now() - draftStartedAt,
      ok: true,
      detail: `${draft.length} characters`,
    });

    const scoreStartedAt = Date.now();
    const scoreResult = await chatComplete(
      [
        {
          role: "system",
          content:
            'Return JSON only: {"score": 0-100, "label": "Low|Interested|Purchase intent|Ready to buy", "next": "next action for the owner"}.',
        },
        { role: "user", content: `${data.name}\n${intel}\n---\n${draft}` },
      ],
      200,
      true,
    );
    let score = 50;
    let label = "Interested";
    let nextAction = "Review the draft before sending.";
    if (scoreResult.ok) {
      try {
        const jsonText = scoreResult.text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(jsonText) as {
          score?: number;
          label?: string;
          next?: string;
        };
        score = Math.max(0, Math.min(100, Number(parsed.score) || 50));
        label = String(parsed.label ?? label);
        nextAction = String(parsed.next ?? nextAction);
      } catch {
        // Keep defaults when a provider does not return valid JSON.
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
      label: "GPU intent score",
      via: nosanaScore?.via || (scoreResult.ok ? `score:${scoreResult.provider}` : "skipped"),
      ms: Date.now() - scoreStartedAt,
      ok: Boolean(nosanaScore || scoreResult.ok),
      detail: nosanaScore?.detail || (scoreResult.ok ? `${score} - ${label}` : scoreResult.error),
    });

    const policyStartedAt = Date.now();
    const policy = await runDaytonaPolicy(draft, data.doNot);
    steps.push({
      id: "daytona",
      label: "Policy sandbox",
      via: policy.via,
      ms: Date.now() - policyStartedAt,
      ok: policy.pass,
      detail: policy.pass ? "Policy checks passed" : policy.hits.join(", "),
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
