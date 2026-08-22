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
  const policy = useStudio((state) => state.policy);
  const products = useStudio((state) => state.products);
  const prospects = useStudio((state) => state.prospects);
  const patchProspect = useStudio((state) => state.patchProspect);
  const upsertLead = useStudio((state) => state.upsertLead);
  const [status, setStatus] = useState<ProviderStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const [targetId, setTargetId] = useState(prospects[0]?.id ?? "");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Extract<ArchitectResult, { ok: true }> | null>(null);

  useEffect(() => {
    void getInfraStatus().then(setStatus);
  }, []);

  const product = products[0];
  const target = prospects.find((prospect) => prospect.id === targetId) ?? prospects[0];

  async function run() {
    if (!target || !product) return;
    setBusy(true);
    setResult(null);
    try {
      const response = await runArchitect({
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
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      setResult(response);
      patchProspect(target.id, { draft: response.draft });
      toast("Pipeline complete. The draft is now in Outreach.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl">Architect</h1>
        <p className="mt-1 text-sm text-muted">
          Bright Data collects, Qwen drafts, Nosana scores, and Daytona checks policy when those providers are configured. Without credentials, the visible fallback runs the same sequence locally.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {status.map((provider) => (
          <article
            key={provider.id}
            className="rounded-xl bg-raised p-4 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-faint">{provider.id}</p>
            <h2 className="mt-1 text-lg">{provider.name}</h2>
            <p className="mt-1 text-sm text-muted">{provider.role}</p>
            <p className={`mt-3 text-xs font-medium ${provider.live ? "text-good" : "text-warn"}`}>
              {provider.live ? "Configured" : `Fallback - ${provider.fallback}`}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="space-y-4 rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]"
          onSubmit={(event) => {
            event.preventDefault();
            void run();
          }}
        >
          <h2 className="text-xl">Run pipeline</h2>
          <div>
            <Label htmlFor="target">Target</Label>
            <select
              id="target"
              className="h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[0_0_0_1px_var(--color-line)]"
              value={target?.id}
              onChange={(event) => setTargetId(event.target.value)}
            >
              {prospects.map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospect.name} - {prospect.area}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="url">Public URL (optional, for Bright Data collection)</Label>
            <Input id="url" value={url} placeholder="https://" onChange={(event) => setUrl(event.target.value)} />
          </div>
          <p className="text-xs text-faint">{target?.signal}</p>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Run Architect
          </Button>
        </form>

        <section className="rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]">
          <h2 className="text-xl">Run log</h2>
          {!result && !busy ? (
            <p className="mt-3 text-sm text-muted">Run it to record the four steps in sequence.</p>
          ) : null}
          {busy ? <p className="mt-3 text-sm text-navy">Collecting, drafting, scoring, checking policy...</p> : null}
          {result ? (
            <ol className="mt-4 space-y-3">
              {result.steps.map((step, index) => (
                <li key={step.id} className="flex gap-3 text-sm">
                  <span className="tabular-nums text-faint">{index + 1}</span>
                  <div>
                    <p className="font-medium">
                      {step.label}
                      <span className={`ml-2 text-xs ${step.ok ? "text-good" : "text-bad"}`}>
                        {step.ok ? "ok" : "fail"}
                      </span>
                    </p>
                    <p className="text-muted">
                      {step.via} - {step.ms}ms - {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
          {result ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm">
                Intent <span className="tabular-nums font-medium text-navy">{result.score}</span> - {result.label}
              </p>
              <p className="text-sm text-muted">{result.nextAction}</p>
              <p className={`text-sm ${result.policyPass ? "text-good" : "text-bad"}`}>
                Policy: {result.policyPass ? "Passed" : result.policyHits.join(", ")}
              </p>
              <Textarea readOnly className="min-h-40" value={result.draft} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void navigate({ to: "/outreach" })}>
                  View in Outreach
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const id = uid("ld");
                    upsertLead({
                      id,
                      name: target?.name ?? "Architect lead",
                      contact: "architect@salesman",
                      channel: "web",
                      message: result.intel,
                      createdAt: new Date().toISOString(),
                      intentScore: result.score,
                      intentLabel: result.label,
                      nextAction: result.nextAction,
                      reasons: ["Architect pipeline"],
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
                    toast("Moved to inbox approval queue.");
                    void navigate({ to: "/inbox/$leadId", params: { leadId: id } });
                  }}
                >
                  Add to inbox
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
