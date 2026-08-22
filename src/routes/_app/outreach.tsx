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
  const prospects = useStudio((state) => state.prospects);
  const products = useStudio((state) => state.products);
  const policy = useStudio((state) => state.policy);
  const patchProspect = useStudio((state) => state.patchProspect);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function draft(id: string) {
    const prospect = prospects.find((item) => item.id === id);
    const product = products.find((item) => item.id === prospect?.productId);
    if (!prospect || !product) return;
    setBusyId(id);
    try {
      const response = await generateOutreach({
        data: {
          companyName: policy.companyName,
          founderName: policy.founderName,
          tone: policy.tone,
          doNot: policy.doNot,
          productName: product.name,
          productSummary: product.summary,
          consultUrl: product.consultUrl,
          prospect: { name: prospect.name, area: prospect.area, signal: prospect.signal },
        },
      });
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      patchProspect(id, { draft: response.text });
      toast("Outreach draft ready.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl">Outreach</h1>
        <p className="mt-1 text-sm text-muted">
          Prepare a first message from observed signals, then review it before recording a send.
        </p>
      </header>
      <div className="space-y-4">
        {prospects.map((prospect) => {
          const product = products.find((item) => item.id === prospect.productId);
          return (
            <article
              key={prospect.id}
              className="rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl">{prospect.name}</h2>
                <span className="text-xs text-faint">
                  {prospect.area} - {prospect.status === "sent" ? "Send recorded" : "Pending"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{prospect.signal}</p>
              <p className="mt-1 text-xs text-faint">{product?.name}</p>
              <Textarea
                className="mt-4 min-h-28"
                value={prospect.draft ?? ""}
                placeholder="Create a draft, then review it."
                onChange={(event) => patchProspect(prospect.id, { draft: event.target.value })}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === prospect.id}
                  onClick={() => void draft(prospect.id)}
                >
                  {busyId === prospect.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  Create draft
                </Button>
                <Button
                  size="sm"
                  disabled={!prospect.draft}
                  onClick={() => {
                    patchProspect(prospect.id, { status: "sent" });
                    toast("Outreach send recorded.");
                  }}
                >
                  Approve and record send
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
