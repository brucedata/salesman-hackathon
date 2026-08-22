import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { analyzeAndDraft } from "@/lib/ai";
import { channelLabel, intentTone, isMissed, missedLabel, stageLabel, stages } from "@/lib/labels";
import { useStudio } from "@/lib/store";
import { formatTime, formatWon } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export const Route = createFileRoute("/_app/inbox/$leadId")({ component: LeadPage });

function LeadPage() {
  const { leadId } = Route.useParams();
  const navigate = useNavigate();
  const lead = useStudio((s) => s.leads.find((l) => l.id === leadId));
  const products = useStudio((s) => s.products);
  const policy = useStudio((s) => s.policy);
  const patchLead = useStudio((s) => s.patchLead);
  const setStage = useStudio((s) => s.setStage);
  const appendTurn = useStudio((s) => s.appendTurn);
  const bookAppointment = useStudio((s) => s.bookAppointment);
  const [busy, setBusy] = useState(false);
  const [slot, setSlot] = useState("");
  const product = products.find((p) => p.id === lead?.productId);

  if (!lead) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">문의를 찾을 수 없습니다.</p>
        <Link to="/inbox" className="mt-4 inline-block text-sm text-accent">
          응대 데스크로
        </Link>
      </div>
    );
  }

  const item = lead;

  async function runAnalysis() {
    setBusy(true);
    try {
      const res = await analyzeAndDraft({
        data: {
          companyName: policy.companyName,
          founderName: policy.founderName,
          tone: policy.tone,
          refund: policy.refund,
          delivery: policy.delivery,
          doNot: policy.doNot,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            period: p.period,
            summary: p.summary,
            consultUrl: p.consultUrl,
            paymentUrl: p.paymentUrl,
          })),
          lead: {
            name: item.name,
            contact: item.contact,
            channel: item.channel,
            message: item.message,
            missed: isMissed(item),
          },
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      patchLead(item.id, {
        intentScore: res.intentScore,
        intentLabel: res.intentLabel,
        nextAction: res.nextAction,
        reasons: res.reasons,
        draft: res.draft,
        replyChannel: res.replyChannel,
        productId: res.productId,
        stage: item.stage === "new" ? "awaiting_approval" : item.stage,
        missed: false,
      });
      toast("초안이 준비되었습니다. 승인한 뒤 보내세요.");
    } finally {
      setBusy(false);
    }
  }

  function approveSend() {
    if (!item.draft?.trim()) {
      toast.error("먼저 초안을 만드세요.");
      return;
    }
    patchLead(item.id, {
      stage: "sent",
      sentAt: new Date().toISOString(),
      missed: false,
    });
    appendTurn(item.id, {
      role: "agent",
      text: item.draft ?? "",
      at: new Date().toISOString(),
    });
    toast(
      item.replyChannel === "sms"
        ? `${item.contact}로 문자 발송을 기록했습니다.`
        : `${item.contact}로 메일 발송을 기록했습니다.`,
    );
  }

  return (
    <div>
      <Link
        to="/inbox"
        className="mb-5 inline-flex h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        응대 데스크
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]">
          <p className="text-xs uppercase tracking-[0.16em] text-faint">
            {channelLabel[lead.channel]} · {formatTime(lead.createdAt)}
            {isMissed(lead) ? ` · ${lead.missedKind ? missedLabel[lead.missedKind] : "놓친 문의"}` : ""}
          </p>
          <h1 className="mt-2 text-3xl">{lead.name}</h1>
          <p className="mt-1 text-sm text-muted">{lead.contact}</p>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{lead.message}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-raised p-3">
              <dt className="text-xs text-faint">구매 가능성</dt>
              <dd className={`mt-1 font-medium tabular-nums ${intentTone(lead.intentScore)}`}>
                {lead.intentScore == null ? "아직 없음" : `${lead.intentScore} · ${lead.intentLabel}`}
              </dd>
            </div>
            <div className="rounded-md bg-raised p-3">
              <dt className="text-xs text-faint">단계</dt>
              <dd className="mt-1">{stageLabel[lead.stage]}</dd>
            </div>
          </dl>
          {lead.nextAction ? (
            <p className="mt-4 text-sm">
              <span className="text-faint">다음 행동 · </span>
              {lead.nextAction}
            </p>
          ) : null}
          {lead.reasons.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {lead.reasons.map((r) => (
                <li key={r}>— {r}</li>
              ))}
            </ul>
          ) : null}
          {product ? (
            <p className="mt-4 text-sm text-muted">
              추천 상품 · {product.name} ({formatWon(product.price)}
              {product.period ? `/${product.period}` : ""})
            </p>
          ) : null}
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl">
              {lead.replyChannel === "sms" ? "문자 초안" : "메일 초안"}
            </h2>
            <Button size="sm" variant="outline" onClick={() => void runAnalysis()} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {lead.draft ? "다시 분석" : "의도 분석 · 초안"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-faint">
            상품 정책을 기준으로 만듭니다. 발송 전에 대표가 고칩니다.
          </p>
          <Textarea
            className="mt-4 min-h-56"
            value={lead.draft ?? ""}
            placeholder="분석 버튼을 누르면 초안이 채워집니다."
            onChange={(e) => patchLead(lead.id, { draft: e.target.value })}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={approveSend} disabled={!lead.draft}>
              승인 후 발송
            </Button>
            <select
              className="h-11 rounded-md bg-raised px-3 text-sm shadow-[0_0_0_1px_var(--color-line)]"
              value={lead.stage}
              onChange={(e) => setStage(lead.id, e.target.value as typeof lead.stage)}
            >
              {stages.map((st) => (
                <option key={st} value={st}>
                  {stageLabel[st]}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              onClick={() => {
                setStage(lead.id, "won");
                toast("성사로 옮겼습니다.");
                void navigate({ to: "/pipeline" });
              }}
            >
              성사
            </Button>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]">
        <h2 className="text-2xl">대화</h2>
        <p className="mt-1 text-xs text-faint">문의와 초안이 한 스레드로 남습니다.</p>
        <div className="mt-4 space-y-2">
          {(lead.thread ?? []).map((t, i) => (
            <p
              key={`${t.at}-${i}`}
              className={
                t.role === "agent"
                  ? "max-w-[90%] rounded-lg bg-wash px-3 py-2 text-sm whitespace-pre-wrap"
                  : "ml-auto max-w-[90%] rounded-lg bg-raised px-3 py-2 text-sm shadow-[0_0_0_1px_var(--color-line)] whitespace-pre-wrap"
              }
            >
              {t.text}
            </p>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">상담 예약</p>
            <Input
              type="datetime-local"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (!slot) {
                toast.error("시간을 고르세요.");
                return;
              }
              bookAppointment(lead.id, new Date(slot).toISOString(), "상담");
              toast("상담이 캘린더에 기록됐습니다.");
            }}
          >
            예약 확정
          </Button>
        </div>
        {lead.appointment ? (
          <p className="mt-3 text-sm text-good">
            예약됨 · {formatTime(lead.appointment.when)} · {lead.appointment.note}
          </p>
        ) : null}
      </section>
    </div>
  );
}
