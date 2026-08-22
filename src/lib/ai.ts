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

export type DraftResult =
  | {
      ok: true;
      intentScore: number;
      intentLabel: string;
      nextAction: string;
      reasons: string[];
      draft: string;
      replyChannel: "email" | "sms";
      productId: string | null;
    }
  | { ok: false; error: string };

export const analyzeAndDraft = createServerFn({ method: "POST" })
  .validator((input: unknown) => draftInput.parse(input))
  .handler(async ({ data }): Promise<DraftResult> => {
    const catalog = data.products
      .map(
        (product) =>
          `- ${product.id} | ${product.name} | KRW ${product.price.toLocaleString("en-US")}${product.period ? "/" + product.period : ""} | ${product.summary} | Consultation: ${product.consultUrl} | Payment: ${product.paymentUrl}`,
      )
      .join("\n");

    const system = `You are the sales response agent for ${data.companyName}. ${data.founderName} works alone and needs concise, truthful drafts for calls, emails, website inquiries, and messages.
Follow this policy exactly:
Tone: ${data.tone}
Refunds: ${data.refund}
Delivery: ${data.delivery}
Do not: ${data.doNot.join(" / ")}
${data.lead.missed ? "This was a missed inquiry. Start with a brief acknowledgement without making excuses, then show that the inquiry is being handled now." : ""}

Catalog:
${catalog}

Return JSON only with these fields:
intentScore (integer 0-100),
intentLabel (one of Low, Interested, Purchase intent, Ready to buy),
nextAction (the next action for the studio owner),
reasons (array of at most 4 short strings),
draft (the customer-facing English message. Use a concise SMS style for phone/message; use an email body for email/web. Include the right consultation and payment URL when an offer is a clear fit. Never violate the policy),
replyChannel (email or sms),
productId (a catalog id or null).`;

    const user = `Channel: ${data.lead.channel}
Missed inquiry: ${data.lead.missed ? "yes" : "no"}
Name: ${data.lead.name}
Contact: ${data.lead.contact}
Inquiry:
${data.lead.message}`;

    const response = await chatComplete(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      900,
      { json: true },
    );
    if (!response.ok) return { ok: false, error: `Analysis failed: ${response.error}` };

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(response.text) as Record<string, unknown>;
    } catch {
      return { ok: false, error: "Could not parse the AI response." };
    }

    const score = Math.max(0, Math.min(100, Number(parsed.intentScore) || 0));
    const label = String(parsed.intentLabel ?? "Interested");
    const nextAction = String(parsed.nextAction ?? "Review the draft before sending.");
    const reasons = Array.isArray(parsed.reasons)
      ? parsed.reasons.map((reason) => String(reason)).slice(0, 4)
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
    if (!apiKey) {
      return { ok: false, error: "Speech transcription is not configured for this environment." };
    }

    const bin = Uint8Array.from(atob(data.audioBase64), (character) => character.charCodeAt(0));
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
    form.append("language", "en");
    form.append("format", "true");
    form.append("file", blob, `voicemail.${ext}`);

    const response = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!response.ok) {
      return { ok: false, error: `Speech transcription failed (${response.status}).` };
    }
    const output = (await response.json()) as { text?: string };
    const text = (output.text ?? "").trim();
    if (!text) return { ok: false, error: "Speech transcription returned no text." };
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
    const response = await chatComplete(
      [
        {
          role: "system",
          content: `Write a first English outreach message from ${data.companyName} and ${data.founderName}.
Tone: ${data.tone}
Do not: ${data.doNot.join(" / ")}
Offer: ${data.productName} - ${data.productSummary}
Consultation: ${data.consultUrl}
Write 6-10 direct, specific sentences. Avoid hype. Return only the message body, not JSON.`,
        },
        {
          role: "user",
          content: `Target: ${data.prospect.name} (${data.prospect.area})\nObserved signal: ${data.prospect.signal}`,
        },
      ],
      400,
    );
    if (!response.ok) return { ok: false, error: `Draft failed: ${response.error}` };
    return { ok: true, text: response.text };
  });
