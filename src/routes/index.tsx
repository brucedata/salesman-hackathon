import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Calendar,
  Filter,
  MessageCircle,
  Palette,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Home });

const steps = [
  {
    n: "1",
    title: "Collect every missed inquiry",
    body: "Keep calls, unread emails, and messages in one desk while you work.",
  },
  {
    n: "2",
    title: "Prepare a response draft",
    body: "Start with a short acknowledgement, then add the next action and booking link that match your policy.",
  },
  {
    n: "3",
    title: "Qualify intent and book time",
    body: "Score budget, timeline, and decision ownership, then add only qualified leads to your calendar.",
  },
  {
    n: "4",
    title: "Close after approval",
    body: "Drafts never send on their own. Your approval records the booking and payment links.",
  },
];

const caps = [
  {
    icon: Send,
    title: "Personalized outreach",
    body: "Use location, offer, and observed signals to prepare a first contact that stays ready for your review.",
  },
  {
    icon: MessageCircle,
    title: "Human follow-through",
    body: "Keep call notes as text and continue email and message conversations in a single thread.",
  },
  {
    icon: Filter,
    title: "Smarter lead filtering",
    body: "Put buying intent and the next action next to each other, so urgency and fit are easy to scan.",
  },
  {
    icon: Palette,
    title: "Clear pre-call context",
    body: "Add scope, delivery timing, and price bands to drafts before the first consultation.",
  },
  {
    icon: Sparkles,
    title: "Policy-aware CRM",
    body: "Store refunds, guardrails, and tone. The policy sandbox checks drafts before they reach approval.",
  },
  {
    icon: Calendar,
    title: "Appointment booking",
    body: "Record consultation times only for qualified leads. Each offer already carries its own calendar link.",
  },
];

function Home() {
  const [jobs, setJobs] = useState(10);
  const contacts = jobs * 25;
  const [demoName, setDemoName] = useState("");

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-line bg-bg shadow-[0_1px_0_var(--color-line)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="#top" className="text-lg font-bold text-navy">
            Salesman
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-fg">
              How it works
            </a>
            <a href="#features" className="hover:text-fg">
              Capabilities
            </a>
            <a href="#calculator" className="hover:text-fg">
              Calculator
            </a>
            <a href="#results" className="hover:text-fg">
              Results
            </a>
            <Link to="/architect" className="hover:text-fg">
              Architect
            </Link>
            <Link to="/inbox" className="hover:text-fg">
              Workspace
            </Link>
          </nav>
          <a href="#demo">
            <Button size="sm">Book a demo</Button>
          </a>
        </div>
      </header>

      <section id="top" className="bg-wash">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-4xl text-fg md:text-6xl">
              Salesman catches the inquiries you miss while you work
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              Bring calls, emails, and messages into one desk. Stay focused on the work while your response agent keeps drafts ready.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo">
                <Button size="lg">
                  Book a demo
                  <ArrowRight className="size-4" />
                </Button>
              </a>
              <Link to="/architect">
                <Button size="lg" variant="outline" className="text-navy">
                  Open Architect
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">
              Solo-studio demo - policy-aware drafts - phone notes stay text-based
            </p>
          </div>
          <div className="rounded-xl bg-raised p-4 shadow-[0_0_0_1px_var(--color-line),0_12px_40px_rgb(30_58_138/0.08)]">
            <p className="mb-3 text-xs font-medium text-navy">Salesman</p>
            <div className="space-y-3 text-sm">
              <p className="max-w-[90%] rounded-lg rounded-tl-sm bg-wash px-3 py-2">
                I noticed you are refreshing a cafe in Seongsu. Would it help to align the signage and menu tone before opening? A 30-minute consultation is open tomorrow at 2 PM.
              </p>
              <p className="ml-auto max-w-[90%] rounded-lg rounded-tr-sm bg-surface px-3 py-2">
                That sounds useful. Can we see the first concept this month?
              </p>
              <p className="max-w-[90%] rounded-lg rounded-tl-sm bg-wash px-3 py-2">
                The Brand Identity Package takes 10 business days. We can align scope and an estimate tomorrow at 2 PM.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="infra" className="border-y border-line bg-bg py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl">An agent pipeline built on your infrastructure</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted">
            Provider keys switch the corresponding step live. Without them, the same sequence runs in a local fallback for this demo.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Bright Data", "Web signal collection", "Collect public pages, price signals, and copy as material for outreach."],
              ["Qwen", "English LLM", "Prepare drafts and personalization through a DashScope-compatible model route."],
              ["Nosana GPU", "Inference compute", "Run intent scoring and batch agent workloads on configured GPU jobs."],
              ["Daytona", "Isolated sandbox", "Run policy lint and generated checks away from the application process."],
            ].map(([name, role, body]) => (
              <article
                key={name}
                className="rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]"
              >
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">{role}</p>
                <h3 className="mt-2 text-lg">{name}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl md:text-4xl">What Salesman does</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">
            From first inquiry to booked time. You review only at the final approval step.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((step) => (
              <article key={step.n} className="rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]">
                <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
                  {step.n}
                </span>
                <h3 className="mt-4 text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl">Conversation example</h2>
          <div className="mt-8 space-y-3 rounded-xl bg-surface p-6 text-sm shadow-[0_0_0_1px_var(--color-line)]">
            <p className="rounded-lg bg-wash px-4 py-3">
              Doyeon, are you preparing the Seongsu cafe refresh? I can send an estimate for an identity package that aligns the menu, signage, and ordering page by tomorrow morning.
            </p>
            <p className="rounded-lg bg-raised px-4 py-3 shadow-[0_0_0_1px_var(--color-line)]">
              I need the first concept this month. What does it cost?
            </p>
            <p className="rounded-lg bg-wash px-4 py-3">
              The package is KRW 1,200,000 and takes 10 business days. I will not promise a discount outside the approved scope. A consultation is open tomorrow at 11:30 AM.
            </p>
            <p className="rounded-md bg-good/10 px-4 py-3 font-medium text-good">Consultation recorded</p>
          </div>
        </div>
      </section>

      <section id="features" className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl md:text-4xl">Core capabilities</h2>
          <p className="mt-3 text-center text-muted">Everything needed to collect, qualify, and close leads.</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {caps.map((capability) => (
              <article
                key={capability.title}
                className="rounded-xl bg-raised p-5 shadow-[0_0_0_1px_var(--color-line)]"
              >
                <capability.icon className="size-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-4 text-lg">{capability.title}</h3>
                <p className="mt-2 text-sm text-muted">{capability.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="calculator" className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl">Monthly deal target</h2>
          <p className="mt-2 text-center text-sm text-muted">
            Demo math: 25 inquiries per signed deal (4% close rate). Actual conversion varies by offer.
          </p>
          <div className="mt-8 rounded-xl bg-surface p-6 shadow-[0_0_0_1px_var(--color-line)]">
            <label className="text-sm font-medium">Desired signed deals this month: {jobs}</label>
            <input
              type="range"
              min={2}
              max={40}
              value={jobs}
              onChange={(event) => setJobs(Number(event.target.value))}
              className="mt-4 w-full accent-accent"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-raised p-4">
                <p className="text-xs text-muted">Inquiries Salesman will handle</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-navy">{contacts}</p>
              </div>
              <div className="rounded-md bg-raised p-4">
                <p className="text-xs text-muted">Target deals</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{jobs}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="results" className="bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl">Demo studio benchmark</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["7", "Inbox sample inquiries"],
              ["74", "Approved lead intent"],
              ["48h", "Hours from policy to first draft"],
            ].map(([number, label]) => (
              <div key={label} className="rounded-xl bg-raised p-6 text-center shadow-[0_0_0_1px_var(--color-line)]">
                <p className="text-3xl font-semibold text-navy tabular-nums">{number}</p>
                <p className="mt-1 text-sm text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="py-20">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="text-3xl">Ready to fill your calendar?</h2>
          <p className="mt-3 text-muted">A 15-minute demo. No setup fee. Open the workspace now.</p>
          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              toast(demoName ? `${demoName}, your demo request has been recorded.` : "Your demo request has been recorded.");
              setDemoName("");
            }}
          >
            <input
              value={demoName}
              onChange={(event) => setDemoName(event.target.value)}
              placeholder="Name or business"
              className="h-12 flex-1 rounded-md bg-raised px-3 text-sm shadow-[0_0_0_1px_var(--color-line)]"
            />
            <Button type="submit" size="lg">
              Request a demo
            </Button>
          </form>
          <Link to="/inbox" className="mt-4 inline-flex h-11 items-center text-sm text-navy">
            Or open the workspace now
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-10 text-center text-xs text-faint">
        Salesman - AI sales agent for solo businesses - phone handling stays text-based without carrier integration
      </footer>
    </div>
  );
}
