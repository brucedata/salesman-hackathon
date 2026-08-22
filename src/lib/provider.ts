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
  if (json) {
    return JSON.stringify({
      score: 58,
      label: "관심",
      next: "대표가 초안을 검수한 뒤 짧은 확인 메시지를 보내세요.",
    });
  }
  const userMessage = messages.at(-1)?.content ?? "문의 주신 내용";
  const target = userMessage.match(/대상:\s*([^\n]+)/)?.[1]?.trim() || "문의 주신 내용";
  return [
    `안녕하세요, ${target} 관련 소식 잘 보았습니다.`,
    "현재 상황에 맞춰 바로 적용할 수 있는 작은 실행안을 먼저 제안드리고 싶습니다.",
    "필요하신 범위와 일정에 맞춰 내용을 간단히 정리해 드릴 수 있습니다.",
    "괜찮으시면 이번 주 중 10분 정도 통화나 메시지로 현재 계획을 여쭤봐도 될까요?",
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
      const res = await fetch(`${qwenBaseUrl()}/chat/completions`, {
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

      if (res.ok) {
        const text = readMessage(await res.json());
        if (text) return { ok: true, text, provider: "qwen" };
        qwenError = "Qwen 빈 응답";
      } else {
        qwenError = `Qwen ${res.status}`;
      }
    } catch (error) {
      qwenError = error instanceof Error ? `Qwen 연결 실패: ${error.message}` : "Qwen 연결 실패";
    }
  }

  const grokKey = process.env.XAI_API_KEY;
  if (!grokKey) {
    if (!qwenKey) {
      return { ok: true, text: localDemoResponse(messages, Boolean(options.json)), provider: "local" };
    }
    return { ok: false, error: qwenError || "Qwen/Grok 키가 없습니다." };
  }

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
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

    if (!res.ok) return { ok: false, error: `Grok ${res.status}` };
    const text = readMessage(await res.json());
    return text ? { ok: true, text, provider: "grok" } : { ok: false, error: "빈 응답" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Grok 연결 실패" };
  }
}
