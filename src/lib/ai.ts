import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatComplete } from "./provider";

const draftInput = z.object({
  companyName: z.string(),
  founderName: z.string(),
  tone: z.string(),
  refund: z.string(),
  delivery: z.string(),
  doNot: z.array(z.string()),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      period: z.string().optional(),
      summary: z.string(),
      consultUrl: z.string(),
      paymentUrl: z.string(),
    }),
  ),
  lead: z.object({
    name: z.string(),
    contact: z.string(),
    channel: z.enum(["web", "email", "phone", "message"]),
    message: z.string(),
    missed: z.boolean().optional(),
  }),
});

export type DraftResult = {
  ok: true;
  intentScore: number;
  intentLabel: string;
  nextAction: string;
  reasons: string[];
  draft: string;
  replyChannel: "email" | "sms";
  productId: string | null;
} | { ok: false; error: string };

export const analyzeAndDraft = createServerFn({ method: "POST" })
  .validator((input: unknown) => draftInput.parse(input))
  .handler(async ({ data }): Promise<DraftResult> => {
    const catalog = data.products
      .map(
        (p) =>
          `- ${p.id} | ${p.name} | ${p.price.toLocaleString("ko-KR")}원${p.period ? "/" + p.period : ""} | ${p.summary} | 상담:${p.consultUrl} | 결제:${p.paymentUrl}`,
      )
      .join("\n");

    const system = `당신은 ${data.companyName}의 응대 에이전트입니다. 1인 대표 ${data.founderName}와 작업자가 일하느라 놓친 전화·이메일·메시지를 대신 잡고 초안을 씁니다.
상품 정책을 반드시 지키세요.
톤: ${data.tone}
환불: ${data.refund}
납기: ${data.delivery}
금지: ${data.doNot.join(" / ")}
${data.lead.missed ? "이 문의는 놓친 연락입니다. 초안 첫 줄에서 짧게 사과하고(변명 금지), 지금 이어서 대응하세요." : ""}

카탈로그:
${catalog}

출력은 JSON 하나만. 키:
intentScore (0-100 정수),
intentLabel (낮음|관심|구매의도|즉시구매 중 하나),
nextAction (대표/작업자가 지금 할 한 줄),
reasons (문자열 배열, 최대 4),
draft (고객에게 보낼 본문. 전화·메시지면 문자/카카오처럼 짧게, 이메일·웹이면 이메일 본문. 상담 URL과 결제 URL을 정책에 맞게 포함. 금지 조항 위반 금지),
replyChannel (email|sms),
productId (카탈로그 id 또는 null).`;

    const user = `채널: ${data.lead.channel}
놓친 문의: ${data.lead.missed ? "예" : "아니오"}
이름: ${data.lead.name}
연락처: ${data.lead.contact}
문의:
${data.lead.message}`;

    const res = await chatComplete(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      900,
      { json: true },
    );
    if (!res.ok) return { ok: false, error: `분석 실패: ${res.error}` };

    const raw = res.text;
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "AI 응답을 해석하지 못했습니다." };
    }

    const score = Math.max(0, Math.min(100, Number(parsed.intentScore) || 0));
    const label = String(parsed.intentLabel ?? "관심");
    const nextAction = String(parsed.nextAction ?? "대표가 초안을 검수하세요.");
    const reasons = Array.isArray(parsed.reasons)
      ? parsed.reasons.map((r) => String(r)).slice(0, 4)
      : [];
    const draft = String(parsed.draft ?? "");
    const replyChannel = parsed.replyChannel === "sms" ? "sms" : "email";
    const productId =
      typeof parsed.productId === "string" && parsed.productId.length > 0
        ? parsed.productId
        : null;

    return {
      ok: true,
      intentScore: score,
      intentLabel: label,
      nextAction,
      reasons,
      draft,
      replyChannel,
      productId,
    };
  });

const transcribeInput = z.object({
  audioBase64: z.string().max(8_000_000),
  mimeType: z.string(),
});

export const transcribeVoice = createServerFn({ method: "POST" })
  .validator((input: unknown) => transcribeInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "AI를 이 환경에서 사용할 수 없습니다." };

    const bin = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    const ext = data.mimeType.includes("mp4")
      ? "mp4"
      : data.mimeType.includes("mpeg")
        ? "mp3"
        : data.mimeType.includes("wav")
          ? "wav"
          : data.mimeType.includes("ogg")
            ? "ogg"
            : "webm";
    const blob = new Blob([bin], { type: data.mimeType || "audio/webm" });
    const form = new FormData();
    form.append("language", "ko");
    form.append("format", "true");
    form.append("file", blob, `voicemail.${ext}`);

    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) {
      return { ok: false, error: `음성 변환 실패 (${res.status})` };
    }
    const out = (await res.json()) as { text?: string };
    const text = (out.text ?? "").trim();
    if (!text) return { ok: false, error: "음성을 텍스트로 바꾸지 못했습니다." };
    return { ok: true, text };
  });

const outreachInput = z.object({
  companyName: z.string(),
  founderName: z.string(),
  tone: z.string(),
  doNot: z.array(z.string()),
  productName: z.string(),
  productSummary: z.string(),
  consultUrl: z.string(),
  prospect: z.object({
    name: z.string(),
    area: z.string(),
    signal: z.string(),
  }),
});

export const generateOutreach = createServerFn({ method: "POST" })
  .validator((input: unknown) => outreachInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
    const res = await chatComplete(
      [
        {
          role: "system",
          content: `${data.companyName} 대표 ${data.founderName}의 첫 연락 문자를 씁니다. 톤: ${data.tone}
금지: ${data.doNot.join(" / ")}
상품: ${data.productName} — ${data.productSummary}
상담: ${data.consultUrl}
한국어, 6~10문장, 과장 없이 구체적. JSON 없이 본문만.`,
        },
        {
          role: "user",
          content: `대상: ${data.prospect.name} (${data.prospect.area})\n관찰: ${data.prospect.signal}`,
        },
      ],
      400,
    );
    if (!res.ok) return { ok: false, error: `초안 실패: ${res.error}` };
    return { ok: true, text: res.text };
  });
