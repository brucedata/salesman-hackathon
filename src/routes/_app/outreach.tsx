import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generateOutreach } from "@/lib/ai";
import { useStudio } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export const Route = createFileRoute("/_app/outreach")({ component: OutreachPage });

function OutreachPage() {
  const prospects = useStudio((s) => s.prospects);
  const products = useStudio((s) => s.products);
  const policy = useStudio((s) => s.policy);
  const patchProspect = useStudio((s) => s.patchProspect);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function draft(id: string) {
    const p = prospects.find((x) => x.id === id);
    const product = products.find((x) => x.id === p?.productId);
    if (!p || !product) return;
    setBusyId(id);
    try {
      const res = await generateOutreach({
        data: {
          companyName: policy.companyName,
          founderName: policy.founderName,
          tone: policy.tone,
          doNot: policy.doNot,
          productName: product.name,
          productSummary: product.summary,
          consultUrl: product.consultUrl,
          prospect: { name: p.name, area: p.area, signal: p.signal },
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      patchProspect(id, { draft: res.text });
      toast("아웃리치 초안이 준비됐습니다.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl">아웃리치</h1>
        <p className="mt-1 text-sm text-muted">
          관찰 신호를 바탕으로 첫 메시지를 만듭니다. 보내기 전에 대표가 고칩니다.
        </p>
      </header>
      <div className="space-y-4">
        {prospects.map((p) => {
          const product = products.find((x) => x.id === p.productId);
          return (
            <article
              key={p.id}
              className="rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl">{p.name}</h2>
                <span className="text-xs text-faint">
                  {p.area} · {p.status === "sent" ? "발송 기록" : "대기"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{p.signal}</p>
              <p className="mt-1 text-xs text-faint">{product?.name}</p>
              <Textarea
                className="mt-4 min-h-28"
                value={p.draft ?? ""}
                placeholder="초안 만들기 후 수정하세요."
                onChange={(e) => patchProspect(p.id, { draft: e.target.value })}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === p.id}
                  onClick={() => void draft(p.id)}
                >
                  {busyId === p.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  초안 만들기
                </Button>
                <Button
                  size="sm"
                  disabled={!p.draft}
                  onClick={() => {
                    patchProspect(p.id, { status: "sent" });
                    toast("아웃리치 발송을 기록했습니다.");
                  }}
                >
                  승인 후 발송
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
