import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { transcribeVoice } from "@/lib/ai";
import { useStudio } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { Channel } from "@/lib/types";

export const Route = createFileRoute("/_app/phone")({ component: PhonePage });

const samples = [
  {
    name: "오세린",
    contact: "010-2209-1183",
    channel: "phone" as Channel,
    message:
      "네 안녕하세요 마포구 공방인데요. 다음 달 마켓 나가는데 포장이랑 명함이 급해서요. 아이덴티티까지는 아니고 로고만 빠르게 가능한지 문자로 남겨주세요.",
  },
  {
    name: "류태호",
    contact: "010-8831-0021",
    channel: "phone" as Channel,
    message:
      "랜딩 급합니다. 광고비가 이번 주부터 나가요. 결제 페이지까지 포함해서 가능한 가장 빠른 일정이랑 금액만 짧게 부탁합니다.",
  },
  {
    name: "배지현",
    contact: "kakao:studio.jihyeon",
    channel: "message" as Channel,
    message: "카톡 세 번 보냈어요. 명함 수량만 먼저 회신 부탁드려요. 작업하시느라 못 보신 것 같아서요.",
  },
];

function PhonePage() {
  const navigate = useNavigate();
  const addCapture = useStudio((s) => s.addCapture);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [channel, setChannel] = useState<Channel>("phone");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void finishRec(new Blob(chunks.current, { type: rec.mimeType }));
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("마이크 권한이 필요합니다. 아래에 받아쓰기를 붙여 넣어도 됩니다.");
    }
  }

  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
  }

  async function finishRec(blob: Blob) {
    setBusy(true);
    try {
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      const res = await transcribeVoice({
        data: { audioBase64: btoa(binary), mimeType: blob.type || "audio/webm" },
      });
      if (!res.ok) {
        toast.error(res.error + " 텍스트로 붙여 넣으세요.");
        return;
      }
      setMessage(res.text);
      toast("음성을 텍스트로 바꿨습니다.");
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const text =
      message.trim() ||
      (channel === "phone" ? "부재중 전화. 음성 없음." : "");
    if (!text) {
      toast.error("내용을 입력하세요.");
      return;
    }
    const id = addCapture({
      name: name.trim() || (channel === "message" ? "메시지 고객" : "전화 고객"),
      contact: contact.trim() || "미확인",
      message: text,
      channel,
      missedKind: channel === "message" ? "message" : "call",
    });
    toast("놓친 연락을 응대 데스크에 넣었습니다.");
    void navigate({ to: "/inbox/$leadId", params: { leadId: id } });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl md:text-4xl">놓친 연락</h1>
      <p className="mt-2 text-sm text-muted">
        작업 중 못 받은 전화, 음성 메모, 카톡·문자를 텍스트로 남깁니다. 통신사 발신/수신은 없습니다.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["phone", "부재중 전화"],
            ["message", "메시지"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setChannel(id)}
            className={
              channel === id
                ? "h-9 rounded-md bg-navy px-3 text-sm text-white"
                : "h-9 rounded-md bg-raised px-3 text-sm text-muted shadow-[0_0_0_1px_var(--color-line)]"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="mt-6 space-y-4 rounded-xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">이름</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="contact">{channel === "message" ? "계정 / 번호" : "번호"}</Label>
            <Input
              id="contact"
              value={contact}
              placeholder={channel === "message" ? "kakao:id 또는 010" : "010-0000-0000"}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="msg">{channel === "message" ? "메시지 내용" : "받아쓰기 · 부재중 메모"}</Label>
          <Textarea
            id="msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              channel === "message"
                ? "카톡·문자 내용을 붙여 넣으세요."
                : "음성 메모를 녹음하거나, 부재중이면 비워 두고 등록하세요."
            }
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {channel === "phone" ? (
            recording ? (
              <Button type="button" variant="outline" onClick={stopRec}>
                <Square className="size-3.5 fill-current" />
                녹음 종료
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => void startRec()} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
                음성 남기기
              </Button>
            )
          ) : null}
          <Button type="submit">놓친 문의로 등록</Button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-medium">예시</h2>
        <div className="mt-3 space-y-2">
          {samples.map((s) => (
            <button
              key={s.contact}
              type="button"
              className="w-full rounded-xl bg-surface p-4 text-left text-sm shadow-[0_0_0_1px_var(--color-line)] hover:bg-raised"
              onClick={() => {
                setChannel(s.channel);
                setName(s.name);
                setContact(s.contact);
                setMessage(s.message);
              }}
            >
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-faint">{s.channel === "message" ? "메시지" : "전화"}</span>
              <p className="mt-1 text-muted">{s.message}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
