import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Globe, Phone, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useStudio } from "@/lib/store";
import { channelLabel, intentTone, isMissed, missedLabel, stageLabel } from "@/lib/labels";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Channel } from "@/lib/types";

export const Route = createFileRoute("/_app/inbox/")({ component: InboxPage });

const icons: Record<Channel, typeof Mail> = {
  web: Globe,
  email: Mail,
  phone: Phone,
  message: MessageSquare,
};

type Filter = "missed" | "all" | Channel;

function InboxPage() {
  const leads = useStudio((state) => state.leads);
  const deskMode = useStudio((state) => state.deskMode);
  const setDeskMode = useStudio((state) => state.setDeskMode);
  const [filter, setFilter] = useState<Filter>("missed");

  const missedCount = leads.filter(isMissed).length;
  const sorted = useMemo(() => {
    const list = [...leads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (filter === "missed") return list.filter(isMissed);
    if (filter === "all") return list;
    return list.filter((lead) => lead.channel === filter);
  }, [leads, filter]);

  const chips: { id: Filter; label: string }[] = [
    { id: "missed", label: `Missed inquiries ${missedCount}` },
    { id: "all", label: "All" },
    { id: "phone", label: "Phone" },
    { id: "email", label: "Email" },
    { id: "message", label: "Message" },
    { id: "web", label: "Website" },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl">Inbox</h1>
          <p className="mt-1 text-sm text-muted">
            Keep missed calls, emails, and messages in one desk, then prepare a draft for approval.
          </p>
        </div>
        <Button
          variant={deskMode === "working" ? "default" : "outline"}
          onClick={() => setDeskMode(deskMode === "working" ? "available" : "working")}
        >
          {deskMode === "working" ? "Working - route new inquiries to missed" : "Available"}
        </Button>
      </header>

      <section className="mb-4 rounded-xl bg-wash px-4 py-3 text-sm">
        The response agent {deskMode === "working" ? "protects your focus time" : "is ready for real-time handling"}. Close the {missedCount} missed inquiries first. Sends are recorded only after approval.
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={
              filter === chip.id
                ? "h-9 rounded-md bg-navy px-3 text-sm text-white"
                : "h-9 rounded-md bg-raised px-3 text-sm text-muted shadow-[0_0_0_1px_var(--color-line)]"
            }
          >
            {chip.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[0_0_0_1px_var(--color-line)]">
          No inquiries match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl bg-surface shadow-[0_0_0_1px_var(--color-line)]">
          {sorted.map((lead) => {
            const Icon = icons[lead.channel];
            const missed = isMissed(lead);
            return (
              <li key={lead.id}>
                <Link
                  to="/inbox/$leadId"
                  params={{ leadId: lead.id }}
                  className="flex flex-col gap-2 px-4 py-4 transition-colors duration-150 hover:bg-raised sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 grid size-9 place-items-center rounded-sm bg-raised text-muted">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-medium">{lead.name}</span>
                        <span className="text-xs text-faint">{channelLabel[lead.channel]}</span>
                        {missed ? (
                          <span className="text-xs font-medium text-accent">
                            {lead.missedKind ? missedLabel[lead.missedKind] : "Missed"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted">{lead.message}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 pl-12 text-xs sm:pl-0">
                    <span className={intentTone(lead.intentScore)}>
                      {lead.intentScore == null ? "Not analyzed" : `${lead.intentScore} - ${lead.intentLabel}`}
                    </span>
                    <span className="text-muted">{stageLabel[lead.stage]}</span>
                    <span className="tabular-nums text-faint">{formatTime(lead.createdAt)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
