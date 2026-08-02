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
  /** The half-heard tail that has not been marked final yet — it must not be lost
   *  when the user taps stop mid-sentence. */
  const interimRef = useRef("");
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
  /** No clocks: listening starts on a tap and only ends on the next tap. */
  const stopRef = useRef<() => void>(() => {});
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Ticker that writes down long talks piece by piece. */
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSilence = useCallback(() => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = null;
  }, []);
  /** Kept as a no-op so the mic never turns itself off mid-sentence. */
  const waitForQuiet = useCallback((_ms?: number) => {
    clearSilence();
  }, [clearSilence]);


  useEffect(() => {
    setAvailable(!!ctor() || !!navigator.mediaDevices?.getUserMedia);
  }, []);

  /** Tidy up the spoken words but keep the whole sentence. */
  const tidy = useCallback((raw: string) => {
    return dedupeRepeats(cleanSpeech(raw, { punctuate: false })).trim();
  }, []);

  const emit = useCallback((raw: string) => {
    const text = tidy(raw);
    if (text) onTextRef.current(text);
  }, [tidy]);


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

  const send = useCallback(async (blob: Blob): Promise<string | null> => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const hint = serverLangHint(getVoiceLang());

    // A shaky connection must never lose a piece of the recording: try a few
    // times, waiting a little longer each time.
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const form = new FormData();
        form.append("file", blob, "recording.wav");
        if (hint) form.append("language", hint);
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: form,
        });
        if (res.status >= 400 && res.status < 500) return null;
        if (!res.ok) throw new Error(String(res.status));
        const out = (await res.json()) as { text?: string };
        return out.text ?? "";
      } catch {
        if (attempt === 3) return null;
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      }
    }
    return null;
  }, []);

  /** Turn whatever has been recorded so far into words, keeping earlier pieces. */
  const flushSegment = useCallback(async (final: boolean) => {
    const m = mediaRef.current;
    if (!m) return;
    const chunks = m.chunks.splice(0, m.chunks.length);
    if (chunks.length === 0) return;
    const blob = encodeWav(chunks, m.ctx.sampleRate);
    if (blob.size < 2048) {
      if (final && !committedRef.current) {
        setState("idle");
        setMessage("That was too quiet. Tap and speak again.");
      }
      return;
    }
    if (final) setState("working");
    const text = await send(blob);
    if (text === null) {
      setMessage("One part of your talk could not be written down. The rest is kept.");
      return;
    }
    committedRef.current = dedupeRepeats(`${committedRef.current} ${text}`.trim());
    setHeard(tidy(committedRef.current));
  }, [send, tidy]);


  /* ---------- controls ---------- */

  const start = useCallback(async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    pausedRef.current = false;
    finalRef.current = "";
    interimRef.current = "";
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
            if (r.isFinal) {
              const said = String(r[0].transcript || "").trim();
              if (said) slotsRef.current[i] = said;
            } else {
              interim += r[0].transcript;
            }
          }
          interimRef.current = interim.trim();
          finalRef.current = `${committedRef.current} ${slotsRef.current.filter(Boolean).join(" ")}`
            .replace(/\s+/g, " ")
            .trim();
          setHeard(tidy(`${finalRef.current} ${interimRef.current}`.trim()));
          waitForQuiet();
        };


        rec.onerror = (e: any) => {
          const err = String(e?.error || "");
          if (err === "not-allowed" || err === "service-not-allowed") {
            activeRef.current = false;
            setState("error");
            setMessage("Please allow the microphone so we can hear you.");
            return;
          }
          // A dropped connection or a quiet moment must not end a long talk:
          // keep every word heard so far and let onend start us again.
          if (err === "network") {
            setMessage("The connection wobbled. Your words so far are safe — keep talking.");
          }
        };
        rec.onend = () => {
          // A fresh session numbers its slots from zero again, so keep what we have.
          committedRef.current = dedupeRepeats(
            `${committedRef.current} ${slotsRef.current.filter(Boolean).join(" ")}`.trim(),
          );
          slotsRef.current = [];
          finalRef.current = committedRef.current;
          if (!activeRef.current) return;
          const restart = (tries: number) => {
            if (!activeRef.current) return;
            try {
              rec.start();
            } catch {
              if (tries < 8) setTimeout(() => restart(tries + 1), 300 * (tries + 1));
            }
          };
          restart(0);
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
      // Long talks are written down piece by piece, so a phone that runs out of
      // room — or a connection that drops — never loses the earlier minutes.
      if (flushRef.current) clearInterval(flushRef.current);
      flushRef.current = setInterval(() => {
        if (!activeRef.current || pausedRef.current) return;
        void flushSegment(false);
      }, 20000);
      setState("listening");
      waitForQuiet(12000);
    } catch {
      activeRef.current = false;
      setState("error");
      setMessage("Please allow the microphone so we can hear you.");
    }
  }, [waitForQuiet, tidy, flushSegment]);


  const teardown = useCallback(() => {
    activeRef.current = false;
    pausedRef.current = false;
    clearSilence();
    if (flushRef.current) clearInterval(flushRef.current);
    flushRef.current = null;
    const rec = recRef.current;
    recRef.current = null;
    if (rec) { try { rec.stop(); rec.abort(); } catch { /* already stopped */ } }
    const m = mediaRef.current;
    return m;
  }, [clearSilence]);

  /** Stop listening and hand over the words. */
  const stop = useCallback(async () => {
    if (!activeRef.current && !recRef.current && !mediaRef.current) {
      setHeard("");
      return;
    }
    const hadRec = !!recRef.current;
    // Everything settled, plus the tail still being heard, plus whatever the
    // box was already showing — so no words are dropped on the last tap.
    const spoken = [finalRef.current, interimRef.current]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim() || heard.trim();
    const m = teardown();

    if (hadRec) {
      mediaRef.current = null;
      finalRef.current = "";
      interimRef.current = "";
      slotsRef.current = [];
      committedRef.current = "";
      setHeard("");
      setState("idle");
      emit(spoken);
      return;
    }
    if (m) {
      // Stop the mic but keep the recorded tail, then write down the last piece
      // and hand over every piece from the whole talk.
      m.stream.getTracks().forEach((t) => t.stop());
      m.node.disconnect();
      m.source.disconnect();
      await flushSegment(true);
      mediaRef.current = null;
      await m.ctx.close().catch(() => {});
      const all = committedRef.current.trim();
      finalRef.current = "";
      interimRef.current = "";
      slotsRef.current = [];
      committedRef.current = "";
      setHeard("");
      if (!all) {
        setState("idle");
        return;
      }
      setState("idle");
      setMessage(null);
      emit(all);
      return;
    }
    mediaRef.current = null;
    setState("idle");
  }, [emit, heard, flushSegment, teardown]);

  stopRef.current = () => { void stop(); };



  /** Throw away what was heard and stop. */
  const clear = useCallback(() => {
    slotsRef.current = [];
    committedRef.current = "";
    const m = teardown();
    mediaRef.current = null;
    if (m) {
      m.stream.getTracks().forEach((t) => t.stop());
      m.node.disconnect();
      m.source.disconnect();
      m.ctx.close().catch(() => {});
    }

    finalRef.current = "";
    interimRef.current = "";
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
