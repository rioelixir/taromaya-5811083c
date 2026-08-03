/**
 * The seventeen analysis modules shown on the Mobile Numerology page. Each one
 * has its own detail page, so the copy lives here rather than in the route.
 */
export type MnModule = {
  slug: string;
  title: string;
  blurb: string;
  reads: string[];
  method: string[];
  useIt: string;
};

export const MN_MODULES: MnModule[] = [
  {
    slug: "mobile-number-analysis",
    title: "Mobile Number Analysis",
    blurb: "The full number reduced to its ruling vibration and planet.",
    reads: [
      "Total of every digit and its single-digit reduction",
      "Ruling planet of the reduced value",
      "Overall favourability for the person holding the number",
    ],
    method: [
      "All digits are added, then reduced to a single value between one and nine.",
      "That value is mapped to its ruling planet.",
      "The planet is compared with the owner's driver number to decide support.",
    ],
    useIt: "Read this first. Everything else refines what the ruling vibration already says.",
  },
  {
    slug: "last-four-digit-analysis",
    title: "Last Four Digit Analysis",
    blurb: "The digits people dial, save and remember most.",
    reads: ["Sum and reduction of the final four digits", "Whether those digits carry money or friction", "How easily the number is recalled"],
    method: [
      "The last four digits are summed and reduced separately from the full number.",
      "Values of one, three, five, six and nine read as free-flowing.",
      "Values of four, seven and eight read as slower and more testing.",
    ],
    useIt: "When choosing between two numbers with the same total, the stronger tail wins.",
  },
  {
    slug: "position-based-analysis",
    title: "Position-Based Analysis",
    blurb: "Every digit judged by where it sits, not only by what it is.",
    reads: ["Opening digits for first impression", "Middle digits for daily working energy", "Closing digits for outcome and money"],
    method: [
      "The number is split into opening, middle and closing blocks.",
      "Each block is reduced on its own.",
      "Blocks are then read in sequence as a beginning, a middle and a result.",
    ],
    useIt: "Explains why two numbers with the same total behave very differently in practice.",
  },
  {
    slug: "planetary-influence",
    title: "Planetary Influence",
    blurb: "Which grahas dominate the number and what they demand.",
    reads: ["Dominant planet by digit count", "Supporting and opposing planets", "Weekday and colour that strengthen the number"],
    method: [
      "Each digit is mapped to its planet using classical Vedic correspondence.",
      "Counts are tallied to find the dominant and missing planets.",
      "Friendship between those planets and the owner's chart sets the verdict.",
    ],
    useIt: "Use this to select the remedy weekday, colour and mantra that actually apply.",
  },
  {
    slug: "lucky-unlucky-digits",
    title: "Lucky and Unlucky Digits",
    blurb: "The digits that lift this number and the ones that drag it.",
    reads: ["Digits in harmony with the owner", "Digits that create friction", "Safer substitutions"],
    method: [
      "Digit friendship is derived from planetary relationships.",
      "Repeated friction digits are weighted more heavily.",
      "Substitutions preserve the total wherever possible.",
    ],
    useIt: "Ideal when a provider offers a shortlist and you need to pick fast.",
  },
  {
    slug: "communication-energy",
    title: "Communication Energy",
    blurb: "How clearly your message lands when this number calls.",
    reads: ["Speech and negotiation strength", "Risk of being misread", "Best hours for important calls"],
    method: [
      "Mercury and Jupiter weighted digits raise the score.",
      "Saturn weighted digits lower speed and warmth.",
      "The reduced value sets the baseline before adjustment.",
    ],
    useIt: "Essential for sales, support, teaching and consulting numbers.",
  },
  {
    slug: "financial-vibration",
    title: "Financial Vibration",
    blurb: "Whether money moves easily through this number.",
    reads: ["Inflow strength", "Retention and leakage", "Suitability for billing and payments"],
    method: [
      "Venus, Jupiter and Sun weighted digits raise inflow.",
      "The closing block decides retention.",
      "Conflict with the owner's driver number reduces the final score.",
    ],
    useIt: "Use it before printing a number on invoices or payment links.",
  },
  {
    slug: "career-support",
    title: "Career Support",
    blurb: "How the number behaves in professional life.",
    reads: ["Recognition and authority", "Stability at work", "Fit with your current role"],
    method: [
      "Career weighting comes from the reduced value's planet.",
      "Authority digits of one, eight and nine raise visibility.",
      "Position analysis decides whether the rise is fast or steady.",
    ],
    useIt: "Helpful when a number will be used for work rather than personal contact.",
  },
  {
    slug: "relationship-harmony",
    title: "Relationship Harmony",
    blurb: "The warmth or distance the number carries into personal contact.",
    reads: ["Emotional ease", "Frequency of misunderstanding", "Support for family contact"],
    method: [
      "Moon and Venus weighted digits raise harmony.",
      "Rahu and Saturn weighted digits raise friction.",
      "Repetition of a single digit intensifies whichever effect dominates.",
    ],
    useIt: "Read alongside communication energy before changing a personal number.",
  },
  {
    slug: "health-energy",
    title: "Health Energy",
    blurb: "The rest, pace and nervous load the number sets.",
    reads: ["Sleep and screen pressure", "Stress pattern", "Practical adjustments"],
    method: [
      "Digit tally identifies over-stimulating combinations.",
      "The reduced value gives the baseline vitality.",
      "Advice stays practical: hours, breaks and routine, never fear.",
    ],
    useIt: "Useful for anyone who lives on the phone all day.",
  },
  {
    slug: "business-suitability",
    title: "Business Suitability",
    blurb: "Whether the number suits the trade it will represent.",
    reads: ["Match with the business line", "Client trust", "Growth versus stability bias"],
    method: [
      "The reduced value is matched against sector affinities.",
      "The trading name number is cross-read where available.",
      "Both are checked against the founder's driver number.",
    ],
    useIt: "Run this before printing a number on signage or packaging.",
  },
  {
    slug: "personal-success-index",
    title: "Personal Success Index",
    blurb: "One figure summarising owner and number together.",
    reads: ["Combined compatibility", "Areas of clearest gain", "Areas needing remedy"],
    method: [
      "The number's ruling planet is compared with the owner's driver and conductor.",
      "Friend, neutral and enemy relations adjust the base score.",
      "Position strength provides the final correction.",
    ],
    useIt: "The single figure to quote to a client who wants a yes or no.",
  },
  {
    slug: "positive-negative-patterns",
    title: "Positive and Negative Patterns",
    blurb: "Sequences inside the number that repeat their effect.",
    reads: ["Supportive pairs and runs", "Draining pairs", "Where a pattern is neutralised"],
    method: [
      "Adjacent digit pairs are scanned across the full number.",
      "Known supportive and draining pairs are flagged.",
      "Neighbouring digits are checked for cancellation.",
    ],
    useIt: "Explains recurring situations that a single total cannot account for.",
  },
  {
    slug: "missing-numbers",
    title: "Missing Numbers",
    blurb: "The energies absent from the number entirely.",
    reads: ["Which digits never appear", "The quality that goes unsupported", "How to compensate"],
    method: [
      "Digits one to nine are checked for presence.",
      "Each absent digit is mapped to its planet and quality.",
      "Compensation is drawn from the owner's own strong numbers.",
    ],
    useIt: "The fastest way to explain what a number cannot give you.",
  },
  {
    slug: "repeated-numbers",
    title: "Repeated Numbers",
    blurb: "Digits appearing three or more times and their amplified effect.",
    reads: ["Which digit dominates", "Whether repetition helps or overloads", "Balancing digits"],
    method: [
      "A frequency tally is built for every digit.",
      "Counts of three or more are treated as amplified.",
      "Amplification is read as strength or excess depending on the owner's chart.",
    ],
    useIt: "Repetition is the most common reason a number feels intense.",
  },
  {
    slug: "overall-energy-score",
    title: "Overall Energy Score",
    blurb: "Every module folded into one weighted result.",
    reads: ["Weighted total out of one hundred", "The two strongest contributors", "The weakest link"],
    method: [
      "Module scores are weighted by relevance to the number's intended use.",
      "Owner compatibility applies the largest single adjustment.",
      "The result is banded as favourable, workable or weak.",
    ],
    useIt: "The headline figure on every report cover page.",
  },
  {
    slug: "ai-recommendation",
    title: "AI Recommendation",
    blurb: "A written verdict that states why, how and when.",
    reads: ["Keep, adjust or replace", "Reasoning behind the verdict", "Timing for any change"],
    method: [
      "Every module result is passed to the interpretation engine as evidence.",
      "The verdict cites the specific digits and planets behind it.",
      "Timing follows the owner's running personal year and month.",
    ],
    useIt: "Read this last, after the numbers have been reviewed.",
  },
];

export const mnModule = (slug: string) => MN_MODULES.find((m) => m.slug === slug);
