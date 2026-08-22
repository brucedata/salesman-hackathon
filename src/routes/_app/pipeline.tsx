import { createFileRoute, Link } from "@tanstack/react-router";
import { useStudio } from "@/lib/store";
import { channelLabel, intentTone, stageLabel, stages } from "@/lib/labels";

export const Route = createFileRoute("/_app/pipeline")({ component: PipelinePage });

function PipelinePage() {
  const leads = useStudio((s) => s.leads);
  const setStage = useStudio((s) => s.setStage);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl">파이프라인</h1>
        <p className="mt-1 text-sm text-muted">문의가 어느 단계에 있는지 보고 옮깁니다.</p>
      </header>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const col = leads.filter((l) => l.stage === stage);
          return (
            <section
              key={stage}
              className="w-[240px] shrink-0 rounded-xl bg-surface p-3 shadow-[0_0_0_1px_var(--color-line)]"
            >
              <h2 className="px-1 text-sm font-medium text-muted">
                {stageLabel[stage]}
                <span className="ml-2 tabular-nums text-faint">{col.length}</span>
              </h2>
              <div className="mt-3 space-y-2">
                {col.map((lead) => (
                  <article key={lead.id} className="rounded-md bg-raised p-3">
                    <Link
                      to="/inbox/$leadId"
                      params={{ leadId: lead.id }}
                      className="block font-medium leading-snug"
                    >
                      {lead.name}
                    </Link>
                    <p className="mt-1 text-xs text-faint">
                      {channelLabel[lead.channel]}
                      {lead.intentScore != null ? (
                        <span className={`ml-2 ${intentTone(lead.intentScore)}`}>
                          {lead.intentScore}
                        </span>
                      ) : null}
                    </p>
                    <select
                      className="mt-2 h-9 w-full rounded-sm bg-surface px-2 text-xs"
                      value={lead.stage}
                      onChange={(e) => setStage(lead.id, e.target.value as typeof lead.stage)}
                    >
                      {stages.map((st) => (
                        <option key={st} value={st}>
                          {stageLabel[st]}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
