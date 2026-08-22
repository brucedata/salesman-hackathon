import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useStudio } from "@/lib/store";
import { formatWon } from "@/lib/utils";

export const Route = createFileRoute("/p/$slug")({ component: SalesPage });

function SalesPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const products = useStudio((s) => s.products);
  const policy = useStudio((s) => s.policy);
  const addWebInquiry = useStudio((s) => s.addWebInquiry);
  const product = products.find((p) => p.slug === slug);
  const [sent, setSent] = useState(false);

  if (!product) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
        <p className="text-muted">판매 페이지가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <span className="font-display text-lg">{policy.companyName}</span>
        <Link to="/inbox" className="text-xs text-faint">
          Salesman
        </Link>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">판매 페이지</p>
        <h1 className="mt-3 text-4xl md:text-5xl">{product.name}</h1>
        <p className="mt-4 text-xl tabular-nums">
          {formatWon(product.price)}
          {product.period ? ` / ${product.period}` : ""}
        </p>
        <p className="mt-4 max-w-xl text-muted">{product.summary}</p>
        <ul className="mt-6 space-y-2 text-sm">
          {product.benefits.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-accent">—</span>
              {b}
            </li>
          ))}
        </ul>

        <form
          className="mt-10 space-y-4 rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const id = addWebInquiry({
              name: String(fd.get("name") ?? ""),
              contact: String(fd.get("contact") ?? ""),
              message: String(fd.get("message") ?? ""),
              productId: product.id,
            });
            setSent(true);
            toast("문의가 대표 수신함으로 들어갔습니다.");
            window.setTimeout(() => {
              void navigate({ to: "/inbox/$leadId", params: { leadId: id } });
            }, 600);
          }}
        >
          <h2 className="text-2xl">문의하기</h2>
          <p className="text-sm text-muted">홈페이지 채널로 수신함에 쌓입니다.</p>
          <div>
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="contact">이메일 또는 전화</Label>
            <Input id="contact" name="contact" required />
          </div>
          <div>
            <Label htmlFor="message">하고 싶은 말</Label>
            <Textarea id="message" name="message" required />
          </div>
          <Button type="submit" disabled={sent}>
            {sent ? "접수됨" : "문의 보내기"}
          </Button>
        </form>
      </article>
    </div>
  );
}
