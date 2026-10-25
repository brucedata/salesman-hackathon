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
    name: "Seorin Oh",
    contact: "demo-phone-03",
    channel: "phone" as Channel,
    message:
      "Hello, I run a craft studio in Mapo. We have a market next month and need packaging and business cards quickly. A full identity package may be too much; could you let me know by message whether a fast logo-only option is possible?",
  },
  {
    name: "Taeho Ryu",
    contact: "demo-phone-04",
    channel: "phone" as Channel,
    message:
      "I need a landing page urgently. Ad spend starts this week. Please send the fastest delivery window and price for a page that includes checkout.",
  },
  {
    name: "Jihyeon Bae",
    contact: "kakao:studio.jihyeon",
    channel: "message" as Channel,
    message:
      "I sent three messages. Could you reply about the business-card quantity first? You may have missed it while you were producing work.",
  },
];

function PhonePage() {
  const navigate = useNavigate();
  const addCapture = useStudio((state) => state.addCapture);
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
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void finishRec(new Blob(chunks.current, { type: rec.mimeType }));
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone permission is required. You can paste a transcript below.");
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
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      const response = await transcribeVoice({
        data: { audioBase64: btoa(binary), mimeType: blob.type || "audio/webm" },
      });
      if (!response.ok) {
        toast.error(`${response.error} Paste the text instead.`);
        return;
      }
      setMessage(response.text);
      toast("Voice converted to text.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = message.trim() || (channel === "phone" ? "Missed call. No voicemail." : "");
    if (!text) {
      toast.error("Enter a message first.");
      return;
    }
    const id = addCapture({
      name: name.trim() || (channel === "message" ? "Message contact" : "Phone contact"),
      contact: contact.trim() || "Unknown",
      message: text,
      channel,
      missedKind: channel === "message" ? "message" : "call",
    });
    toast("Missed contact added to Inbox.");
    void navigate({ to: "/inbox/$leadId", params: { leadId: id } });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl md:text-4xl">Missed contact</h1>
      <p className="mt-2 text-sm text-muted">
        Capture missed calls, voice notes, and messages as text while you work. The public demo does not place calls or send recordings for transcription; use typed notes or a sample instead.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["phone", "Missed call"],
            ["message", "Message"],
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
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="contact">{channel === "message" ? "Handle / number" : "Number"}</Label>
            <Input
              id="contact"
              value={contact}
              placeholder={channel === "message" ? "kakao:id or 010" : "010-0000-0000"}
              onChange={(event) => setContact(event.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="msg">{channel === "message" ? "Message" : "Transcript or missed-call note"}</Label>
          <Textarea
            id="msg"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
              channel === "message"
                ? "Paste the message text."
                : "Record a voice note, paste a transcript, or leave blank for a missed call."
            }
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {channel === "phone" ? (
            recording ? (
              <Button type="button" variant="outline" onClick={stopRec}>
                <Square className="size-3.5 fill-current" />
                Stop recording
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => void startRec()} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
                Record voice
              </Button>
            )
          ) : null}
          <Button type="submit">Add to missed inquiries</Button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-medium">Examples</h2>
        <div className="mt-3 space-y-2">
          {samples.map((sample) => (
            <button
              key={sample.contact}
              type="button"
              className="w-full rounded-xl bg-surface p-4 text-left text-sm shadow-[0_0_0_1px_var(--color-line)] hover:bg-raised"
              onClick={() => {
                setChannel(sample.channel);
                setName(sample.name);
                setContact(sample.contact);
                setMessage(sample.message);
              }}
            >
              <span className="font-medium">{sample.name}</span>
              <span className="ml-2 text-faint">{sample.channel === "message" ? "Message" : "Phone"}</span>
              <p className="mt-1 text-muted">{sample.message}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
