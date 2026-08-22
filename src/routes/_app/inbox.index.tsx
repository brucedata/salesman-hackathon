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
  const leads = useStudio((s) => s.leads);
  const deskMode = useStudio((s) => s.deskMode);
  const setDeskMode = useStudio((s) => s.setDeskMode);
  const [filter, setFilter] = useState<Filter>("missed");

  const missedCount = leads.filter(isMissed).length;
  const sorted = useMemo(() => {
    const list = [...leads].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (filter === "missed") return list.filter(isMissed);
    if (filter === "all") return list;
    return list.filter((l) => l.channel === filter);
  }, [leads, filter]);

  const chips: { id: Filter; label: string }[] = [
    { id: "missed", label: `놓친 문의 ${missedCount}` },
    { id: "all", label: "전체" },
    { id: "phone", label: "전화" },
    { id: "email", label: "이메일" },
    { id: "message", label: "메시지" },
    { id: "web", label: "홈페이지" },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl">응대 데스크</h1>
          <p className="mt-1 text-sm text-muted">
            작업 중 놓친 전화·메일·메시지를 한곳에 모으고, 초안을 만든 뒤 승인합니다.
          </p>
        </div>
        <Button
          variant={deskMode === "working" ? "default" : "outline"}
          onClick={() => setDeskMode(deskMode === "working" ? "available" : "working")}
        >
          {deskMode === "working" ? "작업 중 · 문의는 놓친 큐로" : "응대 가능"}
        </Button>
      </header>

      <section className="mb-4 rounded-xl bg-wash px-4 py-3 text-sm">
        응대 에이전트가 {deskMode === "working" ? "작업 시간을 지킵니다" : "실시간 응대 모드입니다"}.
        놓친 {missedCount}건을 먼저 닫으세요. 발송은 승인 후에만 기록됩니다.
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={
              filter === c.id
                ? "h-9 rounded-md bg-navy px-3 text-sm text-white"
                : "h-9 rounded-md bg-raised px-3 text-sm text-muted shadow-[0_0_0_1px_var(--color-line)]"
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-muted shadow-[0_0_0_1px_var(--color-line)]">
          이 필터에 문의가 없습니다.
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
                            {lead.missedKind ? missedLabel[lead.missedKind] : "놓침"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted">{lead.message}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 pl-12 text-xs sm:pl-0">
                    <span className={intentTone(lead.intentScore)}>
                      {lead.intentScore == null ? "미분석" : `${lead.intentScore} · ${lead.intentLabel}`}
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
