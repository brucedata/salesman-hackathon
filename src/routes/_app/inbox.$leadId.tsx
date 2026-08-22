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
  const lead = useStudio((state) => state.leads.find((item) => item.id === leadId));
  const products = useStudio((state) => state.products);
  const policy = useStudio((state) => state.policy);
  const patchLead = useStudio((state) => state.patchLead);
  const setStage = useStudio((state) => state.setStage);
  const appendTurn = useStudio((state) => state.appendTurn);
  const bookAppointment = useStudio((state) => state.bookAppointment);
  const [busy, setBusy] = useState(false);
  const [slot, setSlot] = useState("");
  const product = products.find((item) => item.id === lead?.productId);

  if (!lead) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Inquiry not found.</p>
        <Link to="/inbox" className="mt-4 inline-block text-sm text-accent">
          Back to inbox
        </Link>
      </div>
    );
  }

  const item = lead;

  async function runAnalysis() {
    setBusy(true);
    try {
      const response = await analyzeAndDraft({
        data: {
          companyName: policy.companyName,
          founderName: policy.founderName,
          tone: policy.tone,
          refund: policy.refund,
          delivery: policy.delivery,
          doNot: policy.doNot,
          products: products.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            period: item.period,
            summary: item.summary,
            consultUrl: item.consultUrl,
            paymentUrl: item.paymentUrl,
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
      if (!response.ok) {
        toast.error(response.error);
        return;
      }
      patchLead(item.id, {
        intentScore: response.intentScore,
        intentLabel: response.intentLabel,
        nextAction: response.nextAction,
        reasons: response.reasons,
        draft: response.draft,
        replyChannel: response.replyChannel,
        productId: response.productId,
        stage: item.stage === "new" ? "awaiting_approval" : item.stage,
        missed: false,
      });
      toast("Draft ready. Review it before recording a send.");
    } finally {
      setBusy(false);
    }
  }

  function approveSend() {
    if (!item.draft?.trim()) {
      toast.error("Create a draft first.");
      return;
    }
    patchLead(item.id, {
      stage: "sent",
      sentAt: new Date().toISOString(),
      missed: false,
    });
    appendTurn(item.id, {
      role: "agent",
      text: item.draft,
      at: new Date().toISOString(),
    });
    toast(
      item.replyChannel === "sms"
        ? `Recorded an SMS send to ${item.contact}.`
        : `Recorded an email send to ${item.contact}.`,
    );
  }

  return (
    <div>
      <Link
        to="/inbox"
        className="mb-5 inline-flex h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Inbox
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]">
          <p className="text-xs uppercase tracking-[0.16em] text-faint">
            {channelLabel[lead.channel]} - {formatTime(lead.createdAt)}
            {isMissed(lead) ? ` - ${lead.missedKind ? missedLabel[lead.missedKind] : "Missed inquiry"}` : ""}
          </p>
          <h1 className="mt-2 text-3xl">{lead.name}</h1>
          <p className="mt-1 text-sm text-muted">{lead.contact}</p>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{lead.message}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-raised p-3">
              <dt className="text-xs text-faint">Purchase intent</dt>
              <dd className={`mt-1 font-medium tabular-nums ${intentTone(lead.intentScore)}`}>
                {lead.intentScore == null ? "Not analyzed yet" : `${lead.intentScore} - ${lead.intentLabel}`}
              </dd>
            </div>
            <div className="rounded-md bg-raised p-3">
              <dt className="text-xs text-faint">Stage</dt>
              <dd className="mt-1">{stageLabel[lead.stage]}</dd>
            </div>
          </dl>
          {lead.nextAction ? (
            <p className="mt-4 text-sm">
              <span className="text-faint">Next action: </span>
              {lead.nextAction}
            </p>
          ) : null}
          {lead.reasons.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {lead.reasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          ) : null}
          {product ? (
            <p className="mt-4 text-sm text-muted">
              Recommended offer: {product.name} ({formatWon(product.price)}
              {product.period ? `/${product.period}` : ""})
            </p>
          ) : null}
        </section>

        <section className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl">{lead.replyChannel === "sms" ? "SMS draft" : "Email draft"}</h2>
            <Button size="sm" variant="outline" onClick={() => void runAnalysis()} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {lead.draft ? "Re-analyze" : "Analyze intent and draft"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-faint">
            Built from your offer policy. Review it before recording a send.
          </p>
          <Textarea
            className="mt-4 min-h-56"
            value={lead.draft ?? ""}
            placeholder="Run analysis to fill this draft."
            onChange={(event) => patchLead(lead.id, { draft: event.target.value })}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={approveSend} disabled={!lead.draft}>
              Approve and record send
            </Button>
            <select
              className="h-11 rounded-md bg-raised px-3 text-sm shadow-[0_0_0_1px_var(--color-line)]"
              value={lead.stage}
              onChange={(event) => setStage(lead.id, event.target.value as typeof lead.stage)}
            >
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabel[stage]}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              onClick={() => {
                setStage(lead.id, "won");
                toast("Moved to won.");
                void navigate({ to: "/pipeline" });
              }}
            >
              Move to won
            </Button>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]">
        <h2 className="text-2xl">Conversation</h2>
        <p className="mt-1 text-xs text-faint">The inquiry and approved draft remain in one thread.</p>
        <div className="mt-4 space-y-2">
          {(lead.thread ?? []).map((turn, index) => (
            <p
              key={`${turn.at}-${index}`}
              className={
                turn.role === "agent"
                  ? "max-w-[90%] rounded-lg bg-wash px-3 py-2 text-sm whitespace-pre-wrap"
                  : "ml-auto max-w-[90%] rounded-lg bg-raised px-3 py-2 text-sm shadow-[0_0_0_1px_var(--color-line)] whitespace-pre-wrap"
              }
            >
              {turn.text}
            </p>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Book consultation</p>
            <Input type="datetime-local" value={slot} onChange={(event) => setSlot(event.target.value)} />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (!slot) {
                toast.error("Choose a time first.");
                return;
              }
              bookAppointment(lead.id, new Date(slot).toISOString(), "Consultation");
              toast("Consultation was recorded in this workspace.");
            }}
          >
            Record booking
          </Button>
        </div>
        {lead.appointment ? (
          <p className="mt-3 text-sm text-good">
            Booked: {formatTime(lead.appointment.when)} - {lead.appointment.note}
          </p>
        ) : null}
      </section>
    </div>
  );
}
