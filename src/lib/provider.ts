export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export type ChatResult =
  | { ok: true; text: string; provider: "qwen" | "grok" | "local" }
  | { ok: false; error: string };

type ChatOptions = { json?: boolean };

function responseFormat(json: boolean) {
  return json ? { response_format: { type: "json_object" } } : {};
}

function readMessage(body: unknown) {
  const choices = (body as { choices?: { message?: { content?: unknown } }[] }).choices;
  const content = choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

function localDemoResponse(messages: ChatMessage[], json: boolean) {
  const userMessage = messages.at(-1)?.content ?? "";
  const target =
    userMessage.match(/(?:Name|Target):\s*([^\n(]+)/i)?.[1]?.trim() || "there";
  const isInboxAnalysis = messages.some((message) => message.content.includes("intentScore"));

  if (json && isInboxAnalysis) {
    return JSON.stringify({
      intentScore: 58,
      intentLabel: "Interested",
      nextAction: "Review the response draft and confirm the best time to follow up.",
      reasons: ["Clear project need", "Timeline or budget signal is present"],
      draft: `Hi ${target}, thanks for reaching out to Han Studio. I am sorry we missed your message while we were with another client. I can confirm the relevant scope and next available start date after a short consultation. You can choose a time here: https://cal.com/hanstudio/30min. Please share the best time to reply, and I will follow up promptly.`,
      replyChannel: /Channel:\s*(phone|message)/i.test(userMessage) ? "sms" : "email",
      productId: "p_identity",
    });
  }

  if (json) {
    return JSON.stringify({
      score: 58,
      label: "Interested",
      next: "Review the draft and confirm a practical follow-up time.",
    });
  }

  return [
    `Hi ${target}, I noticed the work you are preparing and wanted to reach out directly.`,
    "Han Studio can help turn the immediate need into a focused, usable first deliverable.",
    "We can begin by confirming the scope, schedule, and the materials you already have.",
    "If a short conversation would help, you can choose a time at https://cal.com/hanstudio/30min.",
  ].join(" ");
}

function qwenBaseUrl() {
  return (
    process.env.QWEN_BASE_URL ||
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  ).replace(/\/+$/, "");
}

export async function chatComplete(
  messages: ChatMessage[],
  maxTokens: number,
  options: ChatOptions = {},
): Promise<ChatResult> {
  const qwenKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  let qwenError = "";

  if (qwenKey) {
    try {
      const response = await fetch(`${qwenBaseUrl()}/chat/completions`, {
        method: "POST",
        signal: AbortSignal.timeout(30_000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${qwenKey}`,
        },
        body: JSON.stringify({
          model: process.env.QWEN_MODEL || "qwen-plus",
          temperature: 0.4,
          max_tokens: maxTokens,
          ...responseFormat(Boolean(options.json)),
          messages,
        }),
      });

      if (response.ok) {
        const text = readMessage(await response.json());
        if (text) return { ok: true, text, provider: "qwen" };
        qwenError = "Qwen returned an empty response.";
      } else {
        qwenError = `Qwen request failed (${response.status}).`;
      }
    } catch (error) {
      qwenError =
        error instanceof Error ? `Qwen connection failed: ${error.message}` : "Qwen connection failed.";
    }
  }

  const grokKey = process.env.XAI_API_KEY;
  if (!grokKey) {
    if (!qwenKey) {
      return { ok: true, text: localDemoResponse(messages, Boolean(options.json)), provider: "local" };
    }
    return { ok: false, error: qwenError || "No Qwen or Grok provider is available." };
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(30_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${grokKey}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-4.5",
        temperature: 0.4,
        max_tokens: maxTokens,
        ...responseFormat(Boolean(options.json)),
        messages,
      }),
    });

    if (!response.ok) return { ok: false, error: `Grok request failed (${response.status}).` };
    const text = readMessage(await response.json());
    return text
      ? { ok: true, text, provider: "grok" }
      : { ok: false, error: "Grok returned an empty response." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Grok connection failed.",
    };
  }
}
