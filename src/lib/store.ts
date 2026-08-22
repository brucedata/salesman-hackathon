import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultLeads, defaultPolicy, defaultProducts, defaultProspects } from "./seed";
import type { Channel, ChatTurn, DeskMode, Lead, MissedKind, Policy, Product, Prospect, Stage } from "./types";
import { uid } from "./utils";

function withThread(lead: Omit<Lead, "thread"> & { thread?: ChatTurn[] }): Lead {
  const thread =
    lead.thread && lead.thread.length > 0
      ? lead.thread
      : [{ role: "customer" as const, text: lead.message, at: lead.createdAt }];
  const missed =
    lead.missed ??
    ((lead.stage === "new" || lead.stage === "qualified") && !lead.draft);
  return { ...lead, thread, missed };
}

type Actions = {
  setHydrated: (v: boolean) => void;
  resetDemo: () => void;
  upsertLead: (lead: Lead) => void;
  patchLead: (id: string, patch: Partial<Lead>) => void;
  setStage: (id: string, stage: Stage) => void;
  addWebInquiry: (input: {
    name: string;
    contact: string;
    message: string;
    productId: string | null;
  }) => string;
  addPhoneInquiry: (input: { name: string; contact: string; message: string }) => string;
  addCapture: (input: {
    name: string;
    contact: string;
    message: string;
    channel: Channel;
    missedKind?: MissedKind;
    productId?: string | null;
  }) => string;
  setDeskMode: (mode: DeskMode) => void;
  appendTurn: (id: string, turn: ChatTurn) => void;
  bookAppointment: (id: string, when: string, note: string) => void;
  setPolicy: (policy: Policy) => void;
  upsertProduct: (product: Product) => void;
  patchProspect: (id: string, patch: Partial<Prospect>) => void;
};

export const useStudio = create<
  {
    hydrated: boolean;
    policy: Policy;
    products: Product[];
    leads: Lead[];
    prospects: Prospect[];
    deskMode: DeskMode;
  } & Actions
>()(
  persist(
    (set, get) => ({
      hydrated: false,
      policy: defaultPolicy,
      products: defaultProducts,
      leads: defaultLeads,
      prospects: defaultProspects,
      deskMode: "working" as DeskMode,
      setHydrated: (v) => set({ hydrated: v }),
      resetDemo: () =>
        set({
          policy: defaultPolicy,
          products: defaultProducts,
          leads: defaultLeads,
          prospects: defaultProspects,
          deskMode: "working" as DeskMode,
        }),
      upsertLead: (lead) =>
        set({
          leads: [withThread(lead), ...get().leads.filter((l) => l.id !== lead.id)],
        }),
      patchLead: (id, patch) =>
        set({
          leads: get().leads.map((l) => (l.id === id ? withThread({ ...l, ...patch }) : l)),
        }),
      setStage: (id, stage) =>
        set({
          leads: get().leads.map((l) => (l.id === id ? { ...l, stage } : l)),
        }),
      addWebInquiry: ({ name, contact, message, productId }) => {
        return get().addCapture({
          name,
          contact,
          message,
          channel: "web",
          productId,
        });
      },
      addPhoneInquiry: ({ name, contact, message }) => {
        return get().addCapture({
          name,
          contact,
          message,
          channel: "phone",
          missedKind: "call",
        });
      },
      addCapture: ({ name, contact, message, channel, missedKind, productId }) => {
        const id = uid("ld");
        const createdAt = new Date().toISOString();
        const working = get().deskMode === "working";
        const replyChannel = channel === "email" || channel === "web" ? "email" : "sms";
        const kind =
          missedKind ??
          (channel === "phone" ? "call" : channel === "message" ? "message" : channel === "email" ? "email" : "unanswered");
        const lead = withThread({
          id,
          name,
          contact,
          channel,
          message,
          createdAt,
          intentScore: null,
          intentLabel: null,
          nextAction: null,
          reasons: [],
          draft: null,
          replyChannel,
          stage: "new",
          productId: productId ?? null,
          missed: working,
          missedKind: working ? kind : undefined,
        });
        set({ leads: [lead, ...get().leads] });
        return id;
      },
      setDeskMode: (mode) => set({ deskMode: mode }),
      appendTurn: (id, turn) =>
        set({
          leads: get().leads.map((l) =>
            l.id === id ? { ...l, thread: [...(l.thread ?? []), turn] } : l,
          ),
        }),
      bookAppointment: (id, when, note) =>
        set({
          leads: get().leads.map((l) =>
            l.id === id
              ? { ...l, appointment: { when, note }, stage: l.stage === "lost" ? l.stage : "qualified" }
              : l,
          ),
        }),
      setPolicy: (policy) => set({ policy }),
      upsertProduct: (product) =>
        set({
          products: get().products.some((p) => p.id === product.id)
            ? get().products.map((p) => (p.id === product.id ? product : p))
            : [...get().products, product],
        }),
      patchProspect: (id, patch) =>
        set({
          prospects: get().prospects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),
    }),
    {
      name: "salesman-studio",
      version: 4,
      skipHydration: true,
      partialize: (s) => ({
        policy: s.policy,
        products: s.products,
        leads: s.leads,
        prospects: s.prospects,
        deskMode: s.deskMode,
      }),
      migrate: () => ({
        policy: defaultPolicy,
        products: defaultProducts,
        leads: defaultLeads,
        prospects: defaultProspects,
        deskMode: "working" as DeskMode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
