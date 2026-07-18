// Rich per-card details in the style of the Tarot Divination app.
// Combines curated blurbs for Majors + a rank/suit synthesis for Minors, so
// every card (across every deck) has an Upright meaning, Reversed meaning,
// and Love / Career / Spiritual guidance.

import type { TarotCard } from "./tarot-deck";

export type CardDetails = {
  headline: string;      // one-line essence
  upright: string;       // 2-3 sentences
  reversed: string;
  love: string;
  career: string;
  spiritual: string;
  element?: string;
  astrology?: string;
  yesNo?: "Yes" | "No" | "Maybe";
};

/* ------------------------- MAJOR ARCANA ------------------------- */

const MAJORS: Record<string, CardDetails> = {
  "The Fool":            { headline: "A leap into the unknown.", upright: "New beginnings, freedom, and trust in the road ahead. Say yes to the adventure, even if the map is blank.", reversed: "Recklessness or fear of starting. You may be leaping without looking, or refusing to move at all.", love: "A fresh romance or a bold new chapter with an existing partner. Follow your heart, but keep your eyes open.", career: "A new role, project or path calls. Take the risk — beginner energy is your advantage.", spiritual: "You are exactly where you need to be. Trust the invisible thread guiding you.", element: "Air", astrology: "Uranus", yesNo: "Yes" },
  "The Magician":        { headline: "You already have what you need.", upright: "Focus, skill and manifestation. All four elements are on your desk — pick them up and build.", reversed: "Scattered will, manipulation, or wasted talent. Line up your intention with your actions.", love: "Powerful chemistry and clear communication. Someone acts with intent — or you do.", career: "A time to launch, pitch and create. Your ideas can become real if you focus.", spiritual: "Align mind, body, spirit and action. Magic is applied clarity.", element: "Air", astrology: "Mercury", yesNo: "Yes" },
  "The High Priestess":  { headline: "Listen to what only you can hear.", upright: "Intuition, mystery and the quiet knowing beneath thought. Trust the gut before the argument.", reversed: "Ignored intuition, secrets or disconnection from your inner voice.", love: "A relationship with depth and unspoken understanding. Do not force clarity — let it arrive.", career: "Behind-the-scenes work, research, healing arts. Wait before you announce.", spiritual: "Meditate, dream, journal. The veil is thin for you now.", element: "Water", astrology: "Moon", yesNo: "Maybe" },
  "The Empress":         { headline: "Nurture what you love.", upright: "Abundance, sensuality, creativity, motherhood. Life wants to grow through you.", reversed: "Creative block, over-giving, or dependence. Fill your own cup first.", love: "Warmth, fertility, sweetness. Pregnancy or a deepening bond may be indicated.", career: "Creative and caring work flourishes. Beauty, wellness, growth.", spiritual: "Return to the body, to nature, to sensory life.", element: "Earth", astrology: "Venus", yesNo: "Yes" },
  "The Emperor":         { headline: "Build the structure that holds you.", upright: "Authority, order, protection and steady leadership. Rules serve life when love writes them.", reversed: "Rigidity, control issues, or an absent father figure. Soften without abandoning your standards.", love: "Commitment, loyalty and clear roles. A protective partner — or you playing that role.", career: "Leadership, structure, long-term planning. You are ready to lead.", spiritual: "Discipline is devotion. Show up daily.", element: "Fire", astrology: "Aries", yesNo: "Yes" },
  "The Hierophant":      { headline: "Learn from those who came before.", upright: "Tradition, teachers, marriage, mentorship. There is a well-worn path — walk it a while.", reversed: "Questioning dogma, spiritual rebellion or leaving an institution.", love: "Formal commitment, marriage, meeting family. Shared values matter most.", career: "Mentorship, education, institutional roles. Follow the syllabus.", spiritual: "A tradition — or a teacher — has something to give you. Receive humbly.", element: "Earth", astrology: "Taurus", yesNo: "Yes" },
  "The Lovers":          { headline: "A choice made from love.", upright: "Union, alignment of values, a soul-level yes. Also, the choice that reveals who you truly are.", reversed: "Misalignment, avoidance of a decision, or a values mismatch.", love: "Deep partnership, harmony and mutual respect. A defining choice in love.", career: "A collaboration or an offer that must align with your values.", spiritual: "Integration of opposites — head and heart, self and shadow.", element: "Air", astrology: "Gemini", yesNo: "Yes" },
  "The Chariot":         { headline: "Willpower with the reins.", upright: "Victory, focus and disciplined drive. Point yourself and go — do not swerve.", reversed: "Loss of control, aggression or opposing forces pulling you apart.", love: "Moving forward with intent — commitment, moving in, or riding out a storm together.", career: "Ambition wins now. Push through obstacles with steady focus.", spiritual: "Master the horses of emotion and instinct.", element: "Water", astrology: "Cancer", yesNo: "Yes" },
  "Strength":            { headline: "Gentle courage tames the lion.", upright: "Inner strength, patience and compassion. Power that never needs to shout.", reversed: "Self-doubt, insecurity or forcing where kindness is needed.", love: "Patient love that soothes fear. Trust and warmth deepen the bond.", career: "Steady, courageous action. Handle difficult people with grace.", spiritual: "The gentle heart is the strongest force.", element: "Fire", astrology: "Leo", yesNo: "Yes" },
  "The Hermit":          { headline: "The lamp inside is enough.", upright: "Solitude, inner guidance and thoughtful retreat. Withdraw to hear yourself again.", reversed: "Loneliness, isolation or refusing help.", love: "A pause is needed — alone or together. Depth grows in the quiet.", career: "Research, reflection, a sabbatical or independent work.", spiritual: "Turn inward. Your teacher lives there.", element: "Earth", astrology: "Virgo", yesNo: "Maybe" },
  "Wheel of Fortune":    { headline: "The wheel is turning your way.", upright: "Cycles, destiny and a lucky turning point. What goes around is coming to you now.", reversed: "Bad timing, resistance to change or breaking a repeating cycle.", love: "A fated encounter, a return, or a shift in the relationship dynamic.", career: "An unexpected opportunity or lucky break. Say yes.", spiritual: "Trust the pattern that is larger than you.", element: "Fire", astrology: "Jupiter", yesNo: "Yes" },
  "Justice":             { headline: "Truth restores the balance.", upright: "Fairness, honesty and cause-and-effect. What you sowed is what you meet.", reversed: "Dishonesty, avoidance or unfair treatment. Face the accounts.", love: "Honest conversations. A relationship finds equilibrium — or ends fairly.", career: "Contracts, legal matters, ethical decisions. Do the right thing.", spiritual: "You are accountable — and so is the universe. Both, always.", element: "Air", astrology: "Libra", yesNo: "Maybe" },
  "The Hanged Man":      { headline: "Surrender to see a new view.", upright: "Pause, surrender and a fresh perspective. Stop rowing — the current knows.", reversed: "Stalling, martyrdom or stubbornly avoiding a shift.", love: "A relationship in suspension. Let it be still; do not force.", career: "Delays with meaning. Use the pause to see the problem differently.", spiritual: "The world turns upside-down so you can finally see it.", element: "Water", astrology: "Neptune", yesNo: "No" },
  "Death":               { headline: "The old must go for the new to arrive.", upright: "Endings, transformation and the release of what is finished. Grieve, then rise.", reversed: "Resistance to change, stagnation or a slow-motion ending.", love: "A relationship transforms — deepens, ends or begins anew. Nothing stays as it was.", career: "Close a chapter to open the next. Do not cling.", spiritual: "Every ending is a doorway.", element: "Water", astrology: "Scorpio", yesNo: "No" },
  "Temperance":          { headline: "Blend, breathe, balance.", upright: "Moderation, patience and gentle synthesis. Mix opposites with care and time.", reversed: "Imbalance, excess or clashing energies. Slow down and rebalance.", love: "Harmony, healing, patient blending of two lives.", career: "Steady progress. Collaborate and adjust as you go.", spiritual: "You are the alchemist. Blend spirit and body with breath.", element: "Fire", astrology: "Sagittarius", yesNo: "Yes" },
  "The Devil":           { headline: "The chains are looser than they look.", upright: "Attachment, addiction, shadow bonds. Notice what you are choosing to be chained to.", reversed: "Release, breaking free, reclaiming power. The lock is opening.", love: "Intense chemistry that may be unhealthy. Ask: is this love or dependence?", career: "Golden handcuffs or unhealthy ambition. Choose freedom.", spiritual: "Meet the shadow with honesty, not fear.", element: "Earth", astrology: "Capricorn", yesNo: "No" },
  "The Tower":            { headline: "The false structure must fall.", upright: "Sudden change, revelation and breakthrough. What was built on sand collapses so truth can stand.", reversed: "A disaster averted, delayed change or fear of the fall.", love: "A shocking reveal or breakup — or the shattering of an illusion inside a strong bond.", career: "Sudden upheaval clears the way. Do not rebuild on the old foundation.", spiritual: "Lightning strikes to wake you. Thank it.", element: "Fire", astrology: "Mars", yesNo: "No" },
  "The Star":             { headline: "Hope, restored.", upright: "Renewal, inspiration and quiet faith after a storm. The wound is closing.", reversed: "Despair, disconnection or dimmed hope. Look up again.", love: "Healing love. Trust is rebuilt slowly and beautifully.", career: "A dream becomes possible. Guidance and small miracles.", spiritual: "You are guided. Keep pouring your gift into the world.", element: "Air", astrology: "Aquarius", yesNo: "Yes" },
  "The Moon":             { headline: "Not everything you see is real.", upright: "Illusion, intuition and the tides of the subconscious. Feel the fear — walk anyway.", reversed: "Illusions clearing, hidden truth surfacing, release of anxiety.", love: "Confusion, mixed signals or dreams about someone. Ask for clarity.", career: "Uncertainty. Do not sign without reading the small print.", spiritual: "Dreams, symbols and shadow work speak loudly now.", element: "Water", astrology: "Pisces", yesNo: "Maybe" },
  "The Sun":              { headline: "Joy, warmth, yes.", upright: "Vitality, success and simple happiness. The sun rises on your endeavour.", reversed: "Temporary clouds, ego or forced positivity. Joy is real when it is honest.", love: "Warm, playful, radiant love. Engagement, marriage or a happy child.", career: "Recognition, success and creative bloom.", spiritual: "You are the light. Shine without apology.", element: "Fire", astrology: "Sun", yesNo: "Yes" },
  "Judgement":            { headline: "Answer the call.", upright: "Awakening, reckoning and rebirth. You know what you are being asked to do.", reversed: "Self-doubt, avoiding the call or harsh self-judgement.", love: "A reunion, a second chance, or an honest reckoning that changes everything.", career: "A calling clarifies. Rise to it.", spiritual: "The old self dies. Rise into who you truly are.", element: "Fire", astrology: "Pluto", yesNo: "Yes" },
  "The World":            { headline: "Completion — and the next spiral begins.", upright: "Fulfilment, wholeness and successful completion. A cycle closes with grace.", reversed: "Unfinished business or a delay right before the finish line.", love: "A relationship reaches its next level — engagement, marriage, or a shared dream fulfilled.", career: "Graduation, promotion, or the successful close of a long project.", spiritual: "You have come full circle. Celebrate — then begin again.", element: "Earth", astrology: "Saturn", yesNo: "Yes" },
};

/* ------------------------- MINOR ARCANA ------------------------- */

type SuitMeta = { element: string; life: string; upright: string; reversed: string; love: string; career: string; spiritual: string };
const SUITS: Record<string, SuitMeta> = {
  wands:     { element: "Fire",  life: "passion, action, will",       upright: "energy and forward motion", reversed: "delay, burnout or misdirected fire", love: "passion and desire",         career: "ambition, launches, creative drive", spiritual: "the inner flame" },
  cups:      { element: "Water", life: "emotion, love, intuition",    upright: "feelings flowing well",     reversed: "emotional blocks or overflow",       love: "the heart's currents",       career: "creative and caring work",           spiritual: "the language of the soul" },
  swords:    { element: "Air",   life: "mind, truth, communication",  upright: "clarity and cutting truth", reversed: "confusion, harsh words or overthinking", love: "communication and honesty", career: "strategy, ideas, decisions",         spiritual: "clear seeing" },
  pentacles: { element: "Earth", life: "body, money, craft",          upright: "material stability",        reversed: "material worry or poor foundation",  love: "steady, embodied love",       career: "money, career, craft, health",       spiritual: "spirit made matter" },
};

type RankMeta = { court?: boolean; upright: string; reversed: string; love: string; career: string; spiritual: string };
const RANKS: Record<number, RankMeta & { name: string }> = {
  1:  { name: "Ace",    upright: "a bright new spark of this suit's energy — pure potential offered by the universe.", reversed: "a delayed or blocked new beginning; the seed is there but conditions are not yet right.", love: "a fresh emotional or physical spark.",              career: "a new opportunity worth opening.",             spiritual: "a gift arriving with your name on it." },
  2:  { name: "Two",    upright: "a choice, a balance, a partnership — two forces meeting for the first time.",       reversed: "imbalance or an avoided decision.",                                                       love: "a partnership choice.",                             career: "a decision between two paths.",                spiritual: "hold the tension and listen." },
  3:  { name: "Three",  upright: "expansion, collaboration, first fruits of the seed.",                                reversed: "a delay in growth or a group out of sync.",                                              love: "expanding connection or third-party dynamics.",     career: "teamwork and first results.",                  spiritual: "you are growing — celebrate it." },
  4:  { name: "Four",   upright: "stability, structure, a moment of rest inside the process.",                         reversed: "stagnation or resistance to needed change.",                                             love: "steady ground — or getting stuck in comfort.",      career: "consolidate before the next push.",            spiritual: "rest is not the opposite of the work." },
  5:  { name: "Five",   upright: "challenge, friction, a growth-inducing struggle.",                                    reversed: "recovery, easing of conflict.",                                                          love: "friction that can be worked through.",              career: "a setback that teaches.",                      spiritual: "your edges are being sanded smooth." },
  6:  { name: "Six",    upright: "harmony, reciprocity, generous flow.",                                                reversed: "loss of balance, one-sided giving or receiving.",                                        love: "generosity and remembered joy.",                    career: "success shared and rewarded.",                 spiritual: "give what you have received." },
  7:  { name: "Seven",  upright: "reflection, choice, testing your resolve.",                                           reversed: "self-deception or scattered focus.",                                                     love: "reflect on what you truly want.",                   career: "assess your options carefully.",               spiritual: "a truth test — face it." },
  8:  { name: "Eight",  upright: "movement, mastery, momentum.",                                                        reversed: "restriction, being stuck or moving without purpose.",                                    love: "things are speeding up — or feel stuck.",           career: "skill built through steady practice.",         spiritual: "keep walking; the path opens." },
  9:  { name: "Nine",   upright: "near-completion, fulfilment with a last hurdle.",                                     reversed: "worry, disappointment or self-imposed limits.",                                          love: "almost there — do not sabotage.",                   career: "one more push to the finish.",                 spiritual: "gratitude for how far you've come." },
  10: { name: "Ten",    upright: "completion of the cycle, culmination — for better or heavier.",                       reversed: "an ending resisted or a burden not put down.",                                          love: "a defining chapter closes.",                        career: "a phase completes; rest before the next.",     spiritual: "carry the wisdom, drop the weight." },
  11: { name: "Page",   court: true, upright: "curious student energy — a message, a beginner, or an inner apprentice.", reversed: "immaturity, gossip or refusal to learn.",                                             love: "a young or fresh admirer, or beginner's love.",     career: "a new learning opportunity or junior role.",   spiritual: "beginner's mind is holy." },
  12: { name: "Knight", court: true, upright: "action-oriented seeker — pursuit, quests, momentum.",                    reversed: "recklessness, impatience or aggressive energy.",                                       love: "an ardent pursuit or a passionate arrival.",         career: "bold moves — but check the map.",              spiritual: "channel the fire into the journey." },
  13: { name: "Queen",  court: true, upright: "mastery from the inside — emotional intelligence, care, sovereign wisdom.", reversed: "the shadow of that mastery — coldness, over-giving, moodiness.",                     love: "a nurturing, self-possessed partner (or that in you).", career: "leadership through people, not power.",       spiritual: "hold the throne of your own heart." },
  14: { name: "King",   court: true, upright: "outward mastery — authority, results, protective leadership.",           reversed: "tyranny, arrogance or the abuse of power.",                                          love: "a committed, dependable partner (or that in you).", career: "senior leadership, decisive authority.",       spiritual: "power in service of the whole." },
};

/* ------------------------- LOOKUP ------------------------- */

const YES_NO_BY_RANK: Record<number, "Yes" | "No" | "Maybe"> = {
  1: "Yes", 2: "Maybe", 3: "Yes", 4: "Maybe", 5: "No", 6: "Yes", 7: "Maybe", 8: "Yes", 9: "Maybe", 10: "Maybe", 11: "Maybe", 12: "Yes", 13: "Yes", 14: "Yes",
};

export function isCourtCard(card: TarotCard): boolean {
  return card.arcana === "minor" && !!card.number && card.number >= 11 && card.number <= 14;
}

export function getCardDetails(card: TarotCard): CardDetails {
  // Custom decks (nakshatra / health / lost-found / soulmates) — build from card's own keywords.
  if (!card.id.startsWith("m") && !card.suit) {
    return {
      headline: card.keywords[0] ?? card.name,
      upright: `${card.name}: ${card.keywords.join("; ")}.`,
      reversed: `Reversed — ${card.keywordsReversed.join("; ")}.`,
      love: `In love, this card asks you to sit with: ${card.keywords[0]}.`,
      career: `At work, this card highlights: ${card.keywords[1] ?? card.keywords[0]}.`,
      spiritual: `Spiritually, it invites: ${card.keywords[2] ?? card.keywords[0]}.`,
      yesNo: "Maybe",
    };
  }

  if (card.arcana === "major") {
    const m = MAJORS[card.name];
    if (m) return m;
  }

  if (card.arcana === "minor" && card.suit && card.number) {
    const s = SUITS[card.suit];
    const r = RANKS[card.number];
    const rankName = r?.name ?? `#${card.number}`;
    return {
      headline: r?.court ? `${rankName} of ${cap(card.suit)} — ${s.element} personality.` : `${rankName} of ${cap(card.suit)}.`,
      upright: `${rankName} of ${cap(card.suit)}: ${r?.upright ?? ""} With ${cap(card.suit)}, this plays out in the realm of ${s.life} — ${s.upright}.`,
      reversed: `Reversed: ${r?.reversed ?? ""} Expect ${s.reversed}.`,
      love: `Love — ${r?.love ?? ""} (${s.love})`,
      career: `Career — ${r?.career ?? ""} (${s.career})`,
      spiritual: `Spiritual — ${r?.spiritual ?? ""} (${s.spiritual})`,
      element: s.element,
      yesNo: YES_NO_BY_RANK[card.number],
    };
  }

  // Fallback
  return {
    headline: card.name,
    upright: card.keywords.join(", "),
    reversed: card.keywordsReversed.join(", "),
    love: card.keywords[0] ?? "",
    career: card.keywords[1] ?? card.keywords[0] ?? "",
    spiritual: card.keywords[2] ?? card.keywords[0] ?? "",
  };
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
