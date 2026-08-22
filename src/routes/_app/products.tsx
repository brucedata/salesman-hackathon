import { createFileRoute, Link } from "@tanstack/react-router";
import { useStudio } from "@/lib/store";
import { formatWon } from "@/lib/utils";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/products")({ component: ProductsPage });

function ProductsPage() {
  const products = useStudio((s) => s.products);
  const policy = useStudio((s) => s.policy);
  const setPolicy = useStudio((s) => s.setPolicy);
  const upsertProduct = useStudio((s) => s.upsertProduct);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <h1 className="text-3xl md:text-4xl">Offers</h1>
        <p className="mt-1 text-sm text-muted">
          Sales pages plus payment and consultation links are included in the draft context.
        </p>
        <div className="mt-6 space-y-3">
          {products.map((p) => (
            <article
              key={p.id}
              className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl">{p.name}</h2>
                <p className="tabular-nums text-sm text-muted">
                  {formatWon(p.price)}
                  {p.period ? ` / ${p.period}` : ""}
                </p>
              </div>
              <p className="mt-2 text-sm text-muted">{p.summary}</p>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {p.benefits.map((b) => (
                  <li key={b}>— {b}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link
                  to="/p/$slug"
                  params={{ slug: p.slug }}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  Sales page
                </Link>
                <span className="text-faint">{p.consultUrl}</span>
              </div>
              <Label className="mt-4">Price</Label>
              <Input
                type="number"
                defaultValue={p.price}
                onBlur={(e) =>
                  upsertProduct({ ...p, price: Number(e.target.value) || p.price })
                }
              />
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl">Offer policy</h2>
        <p className="mt-1 text-sm text-muted">Drafts must stay within these rules.</p>
        <form
          className="mt-6 space-y-4 rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setPolicy({
              companyName: String(fd.get("companyName") ?? ""),
              founderName: String(fd.get("founderName") ?? ""),
              tone: String(fd.get("tone") ?? ""),
              refund: String(fd.get("refund") ?? ""),
              delivery: String(fd.get("delivery") ?? ""),
              doNot: String(fd.get("doNot") ?? "")
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            });
            toast("Policy saved.");
          }}
        >
          <div>
            <Label htmlFor="companyName">Company</Label>
            <Input id="companyName" name="companyName" defaultValue={policy.companyName} />
          </div>
          <div>
            <Label htmlFor="founderName">Owner</Label>
            <Input id="founderName" name="founderName" defaultValue={policy.founderName} />
          </div>
          <div>
            <Label htmlFor="tone">Tone</Label>
            <Textarea id="tone" name="tone" defaultValue={policy.tone} />
          </div>
          <div>
            <Label htmlFor="refund">Refunds</Label>
            <Textarea id="refund" name="refund" className="min-h-24" defaultValue={policy.refund} />
          </div>
          <div>
            <Label htmlFor="delivery">Delivery</Label>
            <Input id="delivery" name="delivery" defaultValue={policy.delivery} />
          </div>
          <div>
            <Label htmlFor="doNot">Do not use (one per line)</Label>
            <Textarea id="doNot" name="doNot" defaultValue={policy.doNot.join("\n")} />
          </div>
          <Button type="submit">Save policy</Button>
        </form>
      </section>
    </div>
  );
}
