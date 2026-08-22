export type Channel = "web" | "email" | "phone" | "message";
export type Stage =
  | "new"
  | "qualified"
  | "awaiting_approval"
  | "sent"
  | "won"
  | "lost";
export type ReplyChannel = "email" | "sms";
export type MissedKind = "call" | "email" | "message" | "unanswered";
export type DeskMode = "working" | "available";

export type ChatTurn = {
  role: "customer" | "agent";
  text: string;
  at: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  period?: string;
  summary: string;
  benefits: string[];
  slug: string;
  consultUrl: string;
  paymentUrl: string;
};

export type Policy = {
  companyName: string;
  founderName: string;
  tone: string;
  refund: string;
  delivery: string;
  doNot: string[];
};

export type Lead = {
  id: string;
  name: string;
  contact: string;
  channel: Channel;
  message: string;
  createdAt: string;
  intentScore: number | null;
  intentLabel: string | null;
  nextAction: string | null;
  reasons: string[];
  draft: string | null;
  replyChannel: ReplyChannel;
  stage: Stage;
  productId: string | null;
  sentAt?: string;
  thread: ChatTurn[];
  appointment?: { when: string; note: string };
  missed?: boolean;
  missedKind?: MissedKind;
};

export type Prospect = {
  id: string;
  name: string;
  area: string;
  signal: string;
  productId: string;
  draft: string | null;
  status: "ready" | "sent";
};
