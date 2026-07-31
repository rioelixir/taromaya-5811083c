import { useCallback, useEffect, useRef, useState } from "react";
import { cleanSpeech, engineLang, getVoiceLang, serverLangHint } from "@/lib/speech";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type VoiceStatus = "idle" | "listening" | "working" | "error";

export function useVoiceDictation(onText: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [partial, setPartial] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const stoppedRef = useRef(true);
  const mediaRef = useRef<{
    stream: MediaStream;
    ctx: AudioContext;
    node: ScriptProcessorNode;
    source: MediaStreamAudioSourceNode;
    chunks: Float32Array[];
  } | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const available = typeof window !== "undefined" &&
    (!!getRecognitionCtor() || !!navigator.mediaDevices?.getUserMedia);

  const emit = useCallback((raw: string) => {
    const text = cleanSpeech(raw);
    if (text) onTextRef.current(text);
  }, []);

  /* ---------------- fallback recording (Web Audio -> WAV) ---------------- */

  const encodeWav = (chunks: Float32Array[], sampleRate: number) => {
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(total);
    let at = 0;
    for (const c of chunks) { merged.set(c, at); at += c.length; }

    const targetRate = 16000;
    const ratio = sampleRate / targetRate;
    const outLen = Math.max(1, Math.floor(merged.length / ratio));
    const pcm = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const s = Math.max(-1, Math.min(1, merged[Math.floor(i * ratio)] || 0));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    const buf = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buf);
    const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    str(0, "RIFF");
    view.setUint32(4, 36 + pcm.length * 2, true);
    str(8, "WAVEfmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, targetRate, true);
    view.setUint32(28, targetRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, "data");
    view.setUint32(40, pcm.length * 2, true);
    new Int16Array(buf, 44).set(pcm);
    return new Blob([buf], { type: "audio/wav" });
  };

  const sendRecording = useCallback(async (blob: Blob) => {
    setStatus("working");
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const form = new FormData();
      form.append("file", blob, "recording.wav");
      const hint = serverLangHint(getVoiceLang());
      if (hint) form.append("language", hint);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) throw new Error(await res.text().catch(() => ""));
      const out = (await res.json()) as { text?: string };
      emit(out.text ?? "");
      setStatus("idle");
      setMessage(null);
    } catch {
      setStatus("error");
      setMessage("Voice input isn't available right now. Please type instead.");
    }
  }, [emit]);

  /* ---------------- start / stop ---------------- */

  const start = useCallback(async () => {
    if (!stoppedRef.current) return;
    stoppedRef.current = false;
    setPartial("");
    setMessage(null);
    finalRef.current = "";

    const Ctor = getRecognitionCtor();
    if (Ctor) {
      try {
        const rec = new Ctor();
        rec.lang = engineLang(getVoiceLang());
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.onresult = (e: any) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalRef.current += `${r[0].transcript} `;
            else interim += r[0].transcript;
          }
          setPartial((finalRef.current + interim).trim());
        };
        rec.onerror = (e: any) => {
          const err = String(e?.error || "");
          if (err === "not-allowed" || err === "service-not-allowed") {
            setStatus("error");
            setMessage("Please allow microphone access to use voice input.");
            stoppedRef.current = true;
          } else if (err === "no-speech") {
            setStatus("idle");
          }
        };
        rec.onend = () => {
          if (!stoppedRef.current) {
            try { rec.start(); } catch { /* ignore restart race */ }
          }
        };
        recRef.current = rec;
        rec.start();
        setStatus("listening");
        return;
      } catch {
        recRef.current = null;
      }
    }

    // No built-in listener: record a short clip and convert it after release.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      source.connect(node);
      node.connect(ctx.destination);
      mediaRef.current = { stream, ctx, node, source, chunks };
      setStatus("listening");
    } catch {
      stoppedRef.current = true;
      setStatus("error");
      setMessage("Please allow microphone access to use voice input.");
    }
  }, []);

  const stop = useCallback(async () => {
    if (stoppedRef.current && !recRef.current && !mediaRef.current) {
      setPartial("");
      return;
    }
    stoppedRef.current = true;

    const rec = recRef.current;
    if (rec) {
      recRef.current = null;
      try { rec.stop(); rec.abort(); } catch { /* already stopped */ }
      const spoken = (finalRef.current || partial).trim();
      finalRef.current = "";
      setPartial("");
      setStatus("idle");
      emit(spoken);
      return;
    }

    const m = mediaRef.current;
    if (m) {
      mediaRef.current = null;
      setPartial("");
      m.stream.getTracks().forEach((t) => t.stop());
      m.node.disconnect();
      m.source.disconnect();
      const blob = encodeWav(m.chunks, m.ctx.sampleRate);
      await m.ctx.close().catch(() => {});
      if (blob.size < 2048) {
        setStatus("idle");
        setMessage("That was too short — please hold and speak again.");
        return;
      }
      await sendRecording(blob);
    }
  }, [emit, partial, sendRecording]);

  // Stop listening if the page goes away.
  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      try { recRef.current?.abort(); } catch { /* ignore */ }
      recRef.current = null;
      const m = mediaRef.current;
      if (m) {
        m.stream.getTracks().forEach((t) => t.stop());
        m.node.disconnect();
        m.source.disconnect();
        m.ctx.close().catch(() => {});
        mediaRef.current = null;
      }
    };
  }, []);

  return { available, status, partial, message, start, stop, clearMessage: () => setMessage(null) };
}
