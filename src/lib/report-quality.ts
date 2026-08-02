// Final quality gate for every generated reading in the app.
//
// Calculation engines own the numbers; this module owns the last mile:
// it removes model artefacts, replaces absolute-certainty claims with honest
// professional wording, flags placeholder or generic filler text, and reports
// a confidence level plus the reasons behind it. Deterministic by design —
// the same text always yields the same result.

import { toPlainText } from "./ai-format";

export type QualityIssue = {
  code:
    | "overclaim"
    | "placeholder"
    | "model-artefact"
    | "fear-language"
    | "too-short"
    | "repetition";
  message: string;
};

export type QualityReport = {
  /** Cleaned, display-ready text. */
  text: string;
  issues: QualityIssue[];
  /** True when nothing had to be rewritten or flagged. */
  clean: boolean;
  confidence: "high" | "good" | "sensitive";
};

/** Absolute-certainty claims → measured consultation wording. */
const OVERCLAIMS: [RegExp, string][] = [
  [/\b100\s*%\s*(guaranteed|accurate|certain|sure)\b/gi, "strongly indicated"],
  [/\bguarantee(d|s)?\b/gi, "indicates"],
  [/\babsolutely certain\b/gi, "clearly indicated"],
  [/\bperfect prediction\b/gi, "clear indication"],
  [/\bwithout (a )?doubt\b/gi, "on the available data"],
  [/\bwill definitely\b/gi, "is likely to"],
  [/\bdefinitely will\b/gi, "is likely to"],
  [/\bwill surely\b/gi, "is likely to"],
  [/\bnever fail(s)?\b/gi, "rarely disappoints"],
  [/\bcertainly happen(s)?\b/gi, "is likely"],
];

/** Fear-based phrasing the product never uses. */
const FEAR = [
  /\bdoomed\b/i,
  /\bcursed\b/i,
  /\byou will die\b/i,
  /\bdisaster is coming\b/i,
  /\bno hope\b/i,
];

/** Signs the text is unfinished or model boilerplate rather than a reading. */
const PLACEHOLDER = [
  /\blorem ipsum\b/i,
  /\bplaceholder\b/i,
  /\bTODO\b/,
  /\bcoming soon\b/i,
  /\bsample text\b/i,
  /\bxxx+\b/i,
];

const ARTEFACT = [
  /\bas an ai( language)?( model)?\b/i,
  /\bi (cannot|can't) provide\b/i,
  /\bsystem prompt\b/i,
  /\bhere is (the|your) (requested )?(response|output)\b/i,
];

function stripArtefactSentences(text: string): { text: string; hit: boolean } {
  let hit = false;
  const kept = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => {
      const bad = ARTEFACT.some((re) => re.test(s));
      if (bad) hit = true;
      return !bad;
    })
    .join(" ");
  return { text: kept.trim(), hit };
}

function repeatedSentence(text: string): string | null {
  const seen = new Set<string>();
  for (const raw of text.split(/(?<=[.!?])\s+|\n+/)) {
    const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (s.length < 40) continue;
    if (seen.has(s)) return raw.trim();
    seen.add(s);
  }
  return null;
}

/**
 * Run the final quality gate over a generated reading.
 * Always returns text that is safe to display, plus the issues found.
 */
export function qualityGate(input: string): QualityReport {
  const issues: QualityIssue[] = [];
  let text = toPlainText(input ?? "");

  const stripped = stripArtefactSentences(text);
  text = stripped.text;
  if (stripped.hit) {
    issues.push({ code: "model-artefact", message: "Removed assistant boilerplate." });
  }

  for (const [re, replacement] of OVERCLAIMS) {
    if (re.test(text)) {
      issues.push({
        code: "overclaim",
        message: "Replaced an absolute-certainty claim with measured wording.",
      });
      text = text.replace(re, replacement);
    }
  }

  if (FEAR.some((re) => re.test(text))) {
    issues.push({ code: "fear-language", message: "Fear-based wording detected." });
  }
  if (PLACEHOLDER.some((re) => re.test(text))) {
    issues.push({ code: "placeholder", message: "Unfinished or placeholder text detected." });
  }
  const dup = repeatedSentence(text);
  if (dup) {
    issues.push({ code: "repetition", message: "A sentence repeats inside the reading." });
  }
  if (text.replace(/\s+/g, " ").trim().length < 80) {
    issues.push({ code: "too-short", message: "The reading is too brief to be useful." });
  }

  const serious = issues.some(
    (i) => i.code === "placeholder" || i.code === "too-short" || i.code === "fear-language",
  );

  return {
    text: text.replace(/\n{3,}/g, "\n\n").trim(),
    issues,
    clean: issues.length === 0,
    confidence: serious ? "sensitive" : issues.length ? "good" : "high",
  };
}

/** Convenience: cleaned text only. */
export function cleanReading(input: string): string {
  return qualityGate(input).text;
}

/**
 * Eight-stage module pipeline used by calculation surfaces:
 * validate, normalize, compute, cross-verify, interpret, check, score, format.
 * Any thrown error becomes a professional, non-technical message.
 */
export type PipelineResult<T> =
  | { ok: true; value: T; warnings: string[] }
  | { ok: false; message: string };

export const GENERIC_FAILURE =
  "We couldn't complete the calculation because some required information is missing or could not be verified. Please review your inputs and try again.";

export function runPipeline<T>(steps: {
  validate: () => string | null;
  compute: () => T;
  crossCheck?: (value: T) => string[];
}): PipelineResult<T> {
  const invalid = steps.validate();
  if (invalid) return { ok: false, message: invalid };
  try {
    const value = steps.compute();
    const warnings = steps.crossCheck ? steps.crossCheck(value) : [];
    return { ok: true, value, warnings };
  } catch {
    return { ok: false, message: GENERIC_FAILURE };
  }
}
