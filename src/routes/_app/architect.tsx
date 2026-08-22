import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getInfraStatus,
  runArchitect,
  type ArchitectResult,
  type ProviderStatus,
} from "@/lib/architect";
import { useStudio } from "@/lib/store";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export const Route = createFileRoute("/_app/architect")({ component: ArchitectPage });

function ArchitectPage() {
  const navigate = useNavigate();
  const policy = useStudio((s) => s.policy);
  const products = useStudio((s) => s.products);
  const prospects = useStudio((s) => s.prospects);
  const patchProspect = useStudio((s) => s.patchProspect);
  const upsertLead = useStudio((s) => s.upsertLead);
  const [status, setStatus] = useState<ProviderStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const [targetId, setTargetId] = useState(prospects[0]?.id ?? "");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Extract<ArchitectResult, { ok: true }> | null>(null);

  useEffect(() => {
    void getInfraStatus().then(setStatus);
  }, []);

  const product = products[0];
  const target = prospects.find((p) => p.id === targetId) ?? prospects[0];

  async function run() {
    if (!target || !product) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await runArchitect({
        data: {
          name: target.name,
          area: target.area,
          signal: target.signal,
          url: url.trim() || undefined,
          companyName: policy.companyName,
          founderName: policy.founderName,
          tone: policy.tone,
          refund: policy.refund,
          delivery: policy.delivery,
          doNot: policy.doNot,
          productName: product.name,
          productSummary: product.summary,
          consultUrl: product.consultUrl,
          paymentUrl: product.paymentUrl,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResult(res);
      patchProspect(target.id, { draft: res.draft });
      toast("파이프라인 완료. 초안이 아웃리치에 반영됐습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl">아키텍트</h1>
        <p className="mt-1 text-sm text-muted">
          Bright Data로 모으고, Qwen이 쓰고, Nosana GPU가 점수를 매기고, Daytona가 정책을 검사합니다.
          크레딧 키가 없으면 표시된 폴백으로 같은 순서를 돌립니다.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {status.map((p) => (
          <article
            key={p.id}
            className="rounded-xl bg-raised p-4 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-faint">{p.id}</p>
            <h2 className="mt-1 text-lg">{p.name}</h2>
            <p className="mt-1 text-sm text-muted">{p.role}</p>
            <p className={`mt-3 text-xs font-medium ${p.live ? "text-good" : "text-warn"}`}>
              {p.live ? "크레딧 연결됨" : `폴백 · ${p.fallback}`}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="space-y-4 rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <h2 className="text-xl">파이프라인 실행</h2>
          <div>
            <Label htmlFor="target">대상</Label>
            <select
              id="target"
              className="h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[0_0_0_1px_var(--color-line)]"
              value={target?.id}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.area}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="url">공개 URL (선택 · Bright Data / 수집)</Label>
            <Input
              id="url"
              value={url}
              placeholder="https://"
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <p className="text-xs text-faint">{target?.signal}</p>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            아키텍트 실행
          </Button>
        </form>

        <section className="rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]">
          <h2 className="text-xl">런 로그</h2>
          {!result && !busy ? (
            <p className="mt-3 text-sm text-muted">실행하면 네 단계가 순서대로 기록됩니다.</p>
          ) : null}
          {busy ? <p className="mt-3 text-sm text-navy">수집 → 초안 → 점수 → 정책…</p> : null}
          {result ? (
            <ol className="mt-4 space-y-3">
              {result.steps.map((s, i) => (
                <li key={s.id} className="flex gap-3 text-sm">
                  <span className="tabular-nums text-faint">{i + 1}</span>
                  <div>
                    <p className="font-medium">
                      {s.label}
                      <span className={`ml-2 text-xs ${s.ok ? "text-good" : "text-bad"}`}>
                        {s.ok ? "ok" : "fail"}
                      </span>
                    </p>
                    <p className="text-muted">
                      {s.via} · {s.ms}ms · {s.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
          {result ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm">
                의도 <span className="tabular-nums font-medium text-navy">{result.score}</span> ·{" "}
                {result.label}
              </p>
              <p className="text-sm text-muted">{result.nextAction}</p>
              <p className={`text-sm ${result.policyPass ? "text-good" : "text-bad"}`}>
                정책 {result.policyPass ? "통과" : result.policyHits.join(", ")}
              </p>
              <Textarea readOnly className="min-h-40" value={result.draft} />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void navigate({ to: "/outreach" })}
                >
                  아웃리치에서 보기
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const id = uid("ld");
                    upsertLead({
                      id,
                      name: target?.name ?? "아키텍트 리드",
                      contact: "architect@salesman",
                      channel: "web",
                      message: result.intel,
                      createdAt: new Date().toISOString(),
                      intentScore: result.score,
                      intentLabel: result.label,
                      nextAction: result.nextAction,
                      reasons: ["아키텍트 파이프라인"],
                      draft: result.draft,
                      replyChannel: "email",
                      stage: result.policyPass ? "awaiting_approval" : "new",
                      productId: product?.id ?? null,
                      thread: [
                        {
                          role: "customer",
                          text: result.intel,
                          at: new Date().toISOString(),
                        },
                        {
                          role: "agent",
                          text: result.draft,
                          at: new Date().toISOString(),
                        },
                      ],
                    });
                    toast("수신함 승인 대기로 올렸습니다.");
                    void navigate({ to: "/inbox/$leadId", params: { leadId: id } });
                  }}
                >
                  수신함으로 올리기
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
