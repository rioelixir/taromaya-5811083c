import { useCallback, useEffect, useRef, useState } from "react";
import { cleanSpeech, dedupeRepeats, engineLang, getVoiceLang, serverLangHint } from "@/lib/speech";

/**
 * One voice engine for the whole app.
 * It listens with the phone's own listener when there is one, and quietly
 * records and converts the clip when there isn't.
 */

type Recognition = {
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

function ctor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type VoiceState = "idle" | "listening" | "paused" | "working" | "error";

export function useVoice(onText: (text: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [heard, setHeard] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);

  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");
  /** Words already settled in the current listening session, kept by their slot
   *  so the listener repeating itself can never add the same words twice. */
  const slotsRef = useRef<string[]>([]);
  /** Words settled before the listener restarted itself. */
  const committedRef = useRef("");
  const activeRef = useRef(false);
  const pausedRef = useRef(false);
  const mediaRef = useRef<{
    stream: MediaStream;
    ctx: AudioContext;
    node: ScriptProcessorNode;
    source: MediaStreamAudioSourceNode;
    chunks: Float32Array[];
  } | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  /** Stops listening on its own once the person goes quiet, so nobody has to tap twice. */
  const stopRef = useRef<() => void>(() => {});
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearSilence = useCallback(() => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = null;
  }, []);
  const waitForQuiet = useCallback((ms = 2200) => {
    clearSilence();
    silenceRef.current = setTimeout(() => {
      if (activeRef.current && !pausedRef.current) stopRef.current();
    }, ms);
  }, [clearSilence]);

  useEffect(() => {
    setAvailable(!!ctor() || !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const emit = useCallback((raw: string) => {
    const text = cleanSpeech(raw);
    if (text) onTextRef.current(text);
  }, []);

  /* ---------- fallback: record and convert ---------- */

  const encodeWav = (chunks: Float32Array[], sampleRate: number) => {
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(total);
    let at = 0;
    for (const c of chunks) { merged.set(c, at); at += c.length; }
    const rate = 16000;
    const ratio = sampleRate / rate;
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
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, "data");
    view.setUint32(40, pcm.length * 2, true);
    new Int16Array(buf, 44).set(pcm);
    return new Blob([buf], { type: "audio/wav" });
  };

  const send = useCallback(async (blob: Blob) => {
    setState("working");
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
      if (!res.ok) throw new Error("failed");
      const out = (await res.json()) as { text?: string };
      emit(out.text ?? "");
      setState("idle");
      setMessage(null);
    } catch {
      setState("error");
      setMessage("Voice is not working right now. Please type instead.");
    }
  }, [emit]);

  /* ---------- controls ---------- */

  const start = useCallback(async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    pausedRef.current = false;
    finalRef.current = "";
    slotsRef.current = [];
    committedRef.current = "";
    setHeard("");
    setMessage(null);

    const Ctor = ctor();
    if (Ctor) {
      try {
        const rec = new Ctor();
        rec.lang = engineLang(getVoiceLang());
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.onresult = (e: any) => {
          if (pausedRef.current) return;
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            // Store by slot, never append: a repeated event overwrites instead of doubling.
            if (r.isFinal) slotsRef.current[i] = String(r[0].transcript || "").trim();
            else interim += r[0].transcript;
          }
          finalRef.current = dedupeRepeats(
            `${committedRef.current} ${slotsRef.current.filter(Boolean).join(" ")}`.trim(),
          );
          setHeard(dedupeRepeats(`${finalRef.current} ${interim}`.trim()));
          waitForQuiet();
        };
        rec.onerror = (e: any) => {
          const err = String(e?.error || "");
          if (err === "not-allowed" || err === "service-not-allowed") {
            activeRef.current = false;
            setState("error");
            setMessage("Please allow the microphone so we can hear you.");
          }
        };
        rec.onend = () => {
          // A fresh session numbers its slots from zero again, so keep what we have.
          committedRef.current = dedupeRepeats(
            `${committedRef.current} ${slotsRef.current.filter(Boolean).join(" ")}`.trim(),
          );
          slotsRef.current = [];
          if (activeRef.current) {
            try { rec.start(); } catch { /* restart race */ }
          }
        };
        recRef.current = rec;
        rec.start();
        setState("listening");
        waitForQuiet(12000);
        return;
      } catch {
        recRef.current = null;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctxAudio = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctxAudio.createMediaStreamSource(stream);
      const node = ctxAudio.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      node.onaudioprocess = (e) => {
        if (pausedRef.current) return;
        const frame = e.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(frame));
        let sum = 0;
        for (let i = 0; i < frame.length; i += 8) sum += frame[i] * frame[i];
        const loudness = Math.sqrt(sum / (frame.length / 8));
        if (loudness > 0.012) waitForQuiet();
      };
      source.connect(node);
      node.connect(ctxAudio.destination);
      mediaRef.current = { stream, ctx: ctxAudio, node, source, chunks };
      setState("listening");
    } catch {
      activeRef.current = false;
      setState("error");
      setMessage("Please allow the microphone so we can hear you.");
    }
  }, [waitForQuiet]);

  const teardown = useCallback(() => {
    activeRef.current = false;
    pausedRef.current = false;
    clearSilence();
    const rec = recRef.current;
    recRef.current = null;
    if (rec) { try { rec.stop(); rec.abort(); } catch { /* already stopped */ } }
    const m = mediaRef.current;
    mediaRef.current = null;
    return m;
  }, [clearSilence]);

  /** Stop listening and hand over the words. */
  const stop = useCallback(async () => {
    if (!activeRef.current && !recRef.current && !mediaRef.current) {
      setHeard("");
      return;
    }
    const hadRec = !!recRef.current;
    const spoken = (finalRef.current || heard).trim();
    const m = teardown();
    finalRef.current = "";
    slotsRef.current = [];
    committedRef.current = "";
    setHeard("");

    if (hadRec) {
      setState("idle");
      emit(spoken);
      return;
    }
    if (m) {
      m.stream.getTracks().forEach((t) => t.stop());
      m.node.disconnect();
      m.source.disconnect();
      const blob = encodeWav(m.chunks, m.ctx.sampleRate);
      await m.ctx.close().catch(() => {});
      if (blob.size < 2048) {
        setState("idle");
        setMessage("That was too quiet. Tap and speak again.");
        return;
      }
      await send(blob);
    }
  }, [emit, heard, send, teardown]);
  stopRef.current = () => { void stop(); };



  /** Throw away what was heard and stop. */
  const clear = useCallback(() => {
    slotsRef.current = [];
    committedRef.current = "";
    const m = teardown();
    if (m) {
      m.stream.getTracks().forEach((t) => t.stop());
      m.node.disconnect();
      m.source.disconnect();
      m.ctx.close().catch(() => {});
    }
    finalRef.current = "";
    setHeard("");
    setState("idle");
    setMessage(null);
  }, [teardown]);

  const pause = useCallback(() => {
    if (!activeRef.current) return;
    pausedRef.current = true;
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    if (!activeRef.current) return;
    pausedRef.current = false;
    setState("listening");
  }, []);

  /** Start over: clear and listen again. */
  const retry = useCallback(async () => {
    clear();
    await start();
  }, [clear, start]);

  useEffect(() => () => {
    activeRef.current = false;
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
  }, []);

  return {
    available,
    state,
    heard,
    message,
    start,
    stop,
    pause,
    resume,
    clear,
    retry,
    clearMessage: () => setMessage(null),
  };
}
