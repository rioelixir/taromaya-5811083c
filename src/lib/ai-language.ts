/**
 * One shared rule that forces every AI answer into the reader's chosen
 * language. The app supports exactly three modes: English, Hindi (Devanagari)
 * and Hinglish (Roman Hindi).
 *
 * Kept free of React / i18n imports so both client components and server
 * functions can use it.
 */
export function aiLanguageRule(lang: string): string {
  if (lang === "hi") {
    return [
      "LANGUAGE: Write the ENTIRE answer in pure Hindi using Devanagari script only.",
      "Never use Roman/Latin Hindi and never mix in English sentences.",
      "Keep names, numbers, formulas, Sanskrit terms, Hebrew letters and Sephirot names as they are.",
    ].join(" ");
  }
  if (lang === "hr") {
    return [
      "LANGUAGE: Write the ENTIRE answer in Hinglish — natural conversational Hindi written in Roman/Latin script only.",
      "Never use Devanagari characters. Example style: Aapka Destiny Number 7 hai. Yeh spiritual growth ko represent karta hai.",
      "Keep names, numbers, formulas, Sanskrit terms, Hebrew letters and Sephirot names as they are.",
    ].join(" ");
  }
  return "LANGUAGE: Write the ENTIRE answer in natural, professional international English.";
}
