/**
 * Reads help guides out loud with the device's own voice.
 *
 * Browsers are fussy about this: the voice list arrives late, long text stops
 * halfway through, and a voice for the chosen language may not exist at all.
 * This keeps all of that in one place so the help page can simply say "speak".
 */

/** Which spoken voice suits each app language. */
const VOICE_TAGS: Record<string, string[]> = {
  en: ["en-IN", "en-GB", "en-US", "en"],
  hi: ["hi-IN", "hi"],
  hr: ["hi-IN", "en-IN", "en"], // Hinglish: Hindi words in English letters
  bn: ["bn-IN", "bn-BD", "bn"],
  mr: ["mr-IN", "mr", "hi-IN"],
  te: ["te-IN", "te"],
  ta: ["ta-IN", "ta-LK", "ta"],
  gu: ["gu-IN", "gu", "hi-IN"],
  kn: ["kn-IN", "kn"],
  ml: ["ml-IN", "ml"],
  pa: ["pa-IN", "pa-Guru-IN", "pa", "hi-IN"],
  or: ["or-IN", "or", "hi-IN"],
  as: ["as-IN", "as", "bn-IN"],
  ur: ["ur-PK", "ur-IN", "ur", "hi-IN"],
  ne: ["ne-NP", "ne", "hi-IN"],
  si: ["si-LK", "si"],
  sa: ["sa-IN", "hi-IN"],
  kok: ["kok-IN", "mr-IN", "hi-IN"],
  mai: ["mai-IN", "hi-IN"],
  sd: ["sd-IN", "ur-PK", "hi-IN"],
  mni: ["mni-IN", "bn-IN", "hi-IN"],
  es: ["es-ES", "es-MX", "es"],
  fr: ["fr-FR", "fr-CA", "fr"],
  de: ["de-DE", "de"],
  pt: ["pt-BR", "pt-PT", "pt"],
  it: ["it-IT", "it"],
  ru: ["ru-RU", "ru"],
  ar: ["ar-SA", "ar-EG", "ar"],
  tr: ["tr-TR", "tr"],
  fa: ["fa-IR", "fa"],
  zh: ["zh-CN", "zh-Hans", "zh"],
  ja: ["ja-JP", "ja"],
  ko: ["ko-KR", "ko"],
  id: ["id-ID", "id"],
  ms: ["ms-MY", "ms"],
  th: ["th-TH", "th"],
  vi: ["vi-VN", "vi"],
  nl: ["nl-NL", "nl"],
  pl: ["pl-PL", "pl"],
  sw: ["sw-KE", "sw-TZ", "sw"],
  he: ["he-IL", "iw-IL", "he"],
};

/** The voice list often shows up a moment after the page does. */
export async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = typeof window === "undefined" ? undefined : window.speechSynthesis;
  if (!synth) return [];
  const now = synth.getVoices();
  if (now.length > 0) return now;
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(synth.getVoices());
    };
    synth.addEventListener?.("voiceschanged", finish, { once: true });
    setTimeout(finish, 1200);
  });
}

export type VoiceChoice = { voice: SpeechSynthesisVoice | null; tag: string; exact: boolean };

/** Pick the closest voice the device actually has for this language. */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): VoiceChoice {
  const tags = VOICE_TAGS[lang] ?? [lang];
  for (const tag of tags) {
    const hit =
      voices.find((v) => v.lang.replace("_", "-").toLowerCase() === tag.toLowerCase()) ??
      voices.find((v) =>
        v.lang.replace("_", "-").toLowerCase().startsWith(`${tag.toLowerCase()}-`),
      ) ??
      voices.find((v) =>
        v.lang.replace("_", "-").toLowerCase().startsWith(tag.split("-")[0].toLowerCase()),
      );
    if (hit) {
      const wanted = tags[0].split("-")[0].toLowerCase();
      return { voice: hit, tag, exact: hit.lang.toLowerCase().startsWith(wanted) };
    }
  }
  return { voice: null, tag: tags[0], exact: false };
}

/** Break a guide into short pieces so no browser cuts it off mid-way. */
export function speakableChunks(text: string, maxChars = 180): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) ?? [clean];
  const out: string[] = [];
  let piece = "";
  for (const s of sentences) {
    if (s.length > maxChars) {
      if (piece.trim()) {
        out.push(piece.trim());
        piece = "";
      }
      const words = s.split(" ");
      let line = "";
      for (const w of words) {
        if ((line + " " + w).trim().length > maxChars) {
          out.push(line.trim());
          line = w;
        } else line = `${line} ${w}`;
      }
      if (line.trim()) out.push(line.trim());
      continue;
    }
    if (piece && (piece + s).length > maxChars) {
      out.push(piece.trim());
      piece = "";
    }
    piece += s;
  }
  if (piece.trim()) out.push(piece.trim());
  return out;
}

export type Speaker = {
  /** Stop everything and forget the queue. */
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  /** True once the first piece has been handed to the device. */
  started: () => boolean;
};

/**
 * Say the words out loud, one short piece at a time.
 * `onDone` fires when the whole guide has finished, `onFail` when the device
 * cannot speak it at all so the page can offer the studio voice instead.
 */
export function speakText(
  text: string,
  opts: {
    lang: string;
    voice?: SpeechSynthesisVoice | null;
    rate?: number;
    onStart?: () => void;
    onDone?: () => void;
    onFail?: (why: string) => void;
  },
): Speaker {
  const synth = typeof window === "undefined" ? undefined : window.speechSynthesis;
  const dead: Speaker = {
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    started: () => false,
  };
  if (!synth) {
    opts.onFail?.("This device cannot read out loud.");
    return dead;
  }

  const pieces = speakableChunks(text);
  if (pieces.length === 0) {
    opts.onFail?.("There is nothing to read here.");
    return dead;
  }

  let index = 0;
  let stopped = false;
  let begun = false;

  const next = () => {
    if (stopped) return;
    if (index >= pieces.length) {
      opts.onDone?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(pieces[index]);
    if (opts.voice) u.voice = opts.voice;
    u.lang = opts.voice?.lang || opts.lang;
    u.rate = opts.rate ?? 0.95;
    u.pitch = 1;
    u.onstart = () => {
      if (begun) return;
      begun = true;
      opts.onStart?.();
    };
    u.onend = () => {
      index += 1;
      next();
    };
    u.onerror = (e) => {
      const why = String((e as SpeechSynthesisErrorEvent).error || "");
      if (stopped || why === "interrupted" || why === "canceled") return;
      stopped = true;
      if (begun) opts.onDone?.();
      else opts.onFail?.("The device voice could not read this. Try the nicer voice.");
    };
    synth.speak(u);
  };

  synth.cancel();
  // Safari needs a beat after cancel before it will accept new words.
  setTimeout(next, 60);

  // Nothing spoken after a fair wait means the device silently refused.
  const guard = setTimeout(() => {
    if (!begun && !stopped) {
      stopped = true;
      synth.cancel();
      opts.onFail?.("The device voice did not start. Try the nicer voice.");
    }
  }, 2500);

  return {
    cancel: () => {
      stopped = true;
      clearTimeout(guard);
      synth.cancel();
    },
    pause: () => {
      try {
        synth.pause();
      } catch {
        /* not supported */
      }
    },
    resume: () => {
      try {
        synth.resume();
      } catch {
        /* not supported */
      }
    },
    started: () => begun,
  };
}
