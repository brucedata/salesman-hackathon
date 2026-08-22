import type { Channel, Lead, MissedKind, Stage } from "./types";

export const channelLabel: Record<Channel, string> = {
  web: "홈페이지",
  email: "이메일",
  phone: "전화",
  message: "메시지",
};

export const missedLabel: Record<MissedKind, string> = {
  call: "부재중 전화",
  email: "미응답 메일",
  message: "미확인 메시지",
  unanswered: "미응답",
};

export const stageLabel: Record<Stage, string> = {
  new: "신규",
  qualified: "유망",
  awaiting_approval: "승인 대기",
  sent: "발송",
  won: "성사",
  lost: "종료",
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
