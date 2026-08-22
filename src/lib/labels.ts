import type { Channel, Lead, MissedKind, Stage } from "./types";

export const channelLabel: Record<Channel, string> = {
  web: "Website",
  email: "Email",
  phone: "Phone",
  message: "Message",
};

export const missedLabel: Record<MissedKind, string> = {
  call: "Missed call",
  email: "Unanswered email",
  message: "Unread message",
  unanswered: "Unanswered",
};

export const stageLabel: Record<Stage, string> = {
  new: "New",
  qualified: "Qualified",
  awaiting_approval: "Awaiting approval",
  sent: "Send recorded",
  won: "Won",
  lost: "Closed",
};

export const stages: Stage[] = [
  "new",
  "qualified",
  "awaiting_approval",
  "sent",
  "won",
  "lost",
];

export function isMissed(lead: Lead) {
  if (lead.stage === "sent" || lead.stage === "won" || lead.stage === "lost") return false;
  return lead.missed === true;
}

export function intentTone(score: number | null) {
  if (score == null) return "text-muted";
  if (score >= 80) return "text-good";
  if (score >= 55) return "text-warn";
  return "text-muted";
}
