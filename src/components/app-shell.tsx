import { Link, useRouterState } from "@tanstack/react-router";
import { Cpu, Inbox, Kanban, Package, Phone, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { isMissed } from "@/lib/labels";
import { useStudio } from "@/lib/store";
import { toast } from "sonner";

const nav = [
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/outreach", label: "Outreach", icon: Send },
  { to: "/architect", label: "Architect", icon: Cpu },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/products", label: "Offers", icon: Package },
  { to: "/phone", label: "Missed contact", icon: Phone },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const resetDemo = useStudio((s) => s.resetDemo);
  const newCount = useStudio((s) => s.leads.filter(isMissed).length);

  return (
    <div className="min-h-dvh bg-surface text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-bold text-navy">
            Salesman
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150",
                    active ? "bg-wash text-navy" : "text-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                  {item.to === "/inbox" && newCount > 0 ? (
                    <span className="tabular-nums text-xs text-accent">{newCount}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-xs text-muted hover:text-fg"
            onClick={() => {
              resetDemo();
              toast("Demo data reset.");
            }}
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Reset demo</span>
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg md:hidden">
        <div className="grid grid-cols-6">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-navy" : "text-muted",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
