// Dream Library — original symbol database for Dream Oracle AI.
// Every entry is written for this product; nothing is copied from another app.

export type DreamSymbol = {
  slug: string;
  name: string;
  category: string;
  essence: string;        // one line summary
  meaning: string;
  positive: string;
  negative: string;
  psychological: string;
  spiritual: string;
  historical: string;
  variations: string[];
  related: string[];
  faqs: { q: string; a: string }[];
};

type Seed = {
  name: string;
  category: string;
  essence: string;
  meaning: string;
  positive: string;
  negative: string;
  psychological: string;
  spiritual: string;
  historical: string;
  variations: string[];
  related: string[];
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const SEEDS: Seed[] = [
  {
    name: "Flying", category: "Body and movement",
    essence: "Rising above a situation you have outgrown.",
    meaning: "Flying dreams appear when a part of you has gained a wider view of your life. The dream shows the moment your perspective lifted above the detail you were stuck inside.",
    positive: "Freedom, confidence, released pressure, a decision that finally feels light, creative breakthrough.",
    negative: "Escapism, avoiding a responsibility on the ground, ambition that has left the body behind.",
    psychological: "The mind rehearses autonomy. Flying often follows a week where you asserted a boundary or imagined leaving something behind.",
    spiritual: "Traditionally read as the subtle body travelling, and as a sign that your inner life is asking for more space than your outer life gives it.",
    historical: "Recorded across Egyptian, Greek and Indian dream texts as a message of elevation, favour and the soul's mobility.",
    variations: ["Flying easily and joyfully", "Struggling to stay in the air", "Flying low over water", "Being unable to land"],
    related: ["Falling", "Bird", "Mountain", "Stairs"],
  },
  {
    name: "Falling", category: "Body and movement",
    essence: "A support you were counting on is being tested.",
    meaning: "Falling marks the moment control loosens. The dream is rarely about danger, it is about the nervous system noticing that something you leaned on is no longer firm.",
    positive: "Honest recognition, letting go of forcing, the end of an exhausting grip.",
    negative: "Anxiety about status, finances or a relationship, fear of a mistake becoming visible.",
    psychological: "Common during transitions, new jobs and new homes. The startle reflex often joins in and wakes you.",
    spiritual: "Read as surrender, a descent that returns you to the ground so a truer footing can be built.",
    historical: "Older manuals link falling to the loss of a position and advise reviewing agreements rather than fearing accidents.",
    variations: ["Falling and waking up", "Falling slowly", "Falling into water", "Being pushed"],
    related: ["Flying", "Stairs", "Ocean", "House"],
  },
  {
    name: "Water", category: "Nature",
    essence: "The state of your feelings, shown as a landscape.",
    meaning: "Water is the oldest picture of emotion. Its clarity, depth and movement describe how your feelings are behaving right now.",
    positive: "Clear water means emotional honesty, healing and renewal. Gentle water means calm restored.",
    negative: "Muddy or rising water suggests feelings you are not naming, or pressure that is building faster than you admit.",
    psychological: "Water tracks emotional regulation. Rough water often follows suppressed conflict.",
    spiritual: "Purification and blessing. In many traditions water carries prayer and washes an old identity away.",
    historical: "Temples were built beside rivers and springs because water was treated as a doorway between worlds.",
    variations: ["Clear water", "Muddy water", "Rising flood", "Swimming easily"],
    related: ["Ocean", "River", "Rain", "Fish"],
  },
  {
    name: "Ocean", category: "Nature",
    essence: "The vast, unmanaged part of your inner life.",
    meaning: "The ocean shows scale. Something in your life is larger than your current plan and the dream is asking you to respect its size.",
    positive: "Awe, possibility, a life that is bigger than your worry, deep rest.",
    negative: "Overwhelm, a feeling of being small in front of a decision, fear of losing yourself in someone else's world.",
    psychological: "Often appears before major commitments where the outcome cannot be fully controlled.",
    spiritual: "The universal mind. Sitting on a shore in a dream is a classic image of the soul meeting eternity.",
    historical: "Sea dreams were read as signs of journeys, trade and long change.",
    variations: ["Calm sea", "Storm at sea", "Standing on the shore", "Drowning"],
    related: ["Water", "River", "Boat", "Fish"],
  },
  {
    name: "River", category: "Nature",
    essence: "Time and direction moving through your life.",
    meaning: "A river shows the flow you are in. Its speed, banks and crossings describe how your life is progressing and where a decision waits.",
    positive: "Momentum, natural timing, a path opening on its own.",
    negative: "Being carried somewhere you did not choose, or standing on the bank unable to cross.",
    psychological: "Crossing a river usually corresponds to a real change of role or place.",
    spiritual: "Rivers mark thresholds. In many traditions crossing water is initiation.",
    historical: "Sacred rivers were considered living beings that could accept prayers and release burdens.",
    variations: ["Crossing a bridge", "Swimming against the current", "Dry riverbed", "Clear flowing river"],
    related: ["Water", "Ocean", "Bridge", "Rain"],
  },
  {
    name: "Rain", category: "Weather",
    essence: "Release after a long hold.",
    meaning: "Rain in a dream is emotion finally moving. It arrives after periods of holding yourself together in public.",
    positive: "Relief, cleansing, fertility, a soft heart returning.",
    negative: "Grief that has not been given time, or a mood that has soaked into everything.",
    psychological: "Often follows a week of restraint. The body is asking for a proper release.",
    spiritual: "Blessing and grace. Rain has been prayed for as an answer more than as weather.",
    historical: "Read as prosperity in agricultural cultures and as divine consent to a plan.",
    variations: ["Soft rain", "Heavy storm", "Rain indoors", "Standing in rain by choice"],
    related: ["Water", "Storm", "River", "Tears"],
  },
  {
    name: "Fire", category: "Nature",
    essence: "Transformation that will not be negotiated with.",
    meaning: "Fire burns away the version of a situation that cannot continue. Its size shows how urgent the change has become.",
    positive: "Passion, purification, courage, clarity about what actually matters.",
    negative: "Anger that has grown beyond its cause, burnout, a situation consuming your resources.",
    psychological: "Appears near anger you consider unacceptable to express, and near intense creative drive.",
    spiritual: "The sacred flame. Offerings are made to fire because fire changes substance completely.",
    historical: "Fire dreams were read as both warning and blessing depending on whether the dreamer was warmed or burned.",
    variations: ["Controlled flame", "House on fire", "Watching fire calmly", "Being burned"],
    related: ["House", "Anger", "Sun", "Candle"],
  },
  {
    name: "Snake", category: "Reptiles",
    essence: "Life force, healing and instinct that demands respect.",
    meaning: "A snake shows raw energy in your life. It can heal or bite, and the dream usually places you at the exact distance you are keeping from that energy.",
    positive: "Healing, renewal, sharp instinct, awakened vitality, shedding an old self.",
    negative: "Hidden risk, a person you sense but cannot prove, fear that keeps you frozen.",
    psychological: "Snakes carry a fast, pre verbal alarm. They often appear when your body already knows something your mind has not accepted.",
    spiritual: "Kundalini, the coiled energy at the base of the spine. Also the guardian of thresholds and treasure.",
    historical: "Snakes appear on healing staffs and temple walls across Indian, Greek and Egyptian traditions.",
    variations: ["Snake in the house", "Being bitten", "White snake", "Many snakes", "Killing a snake"],
    related: ["Fear", "Healing", "Temple", "Water"],
  },
  {
    name: "Dog", category: "Animals",
    essence: "Loyalty, protection and the friend test.",
    meaning: "Dogs represent trust in your dream language. Their mood shows the current health of your close relationships.",
    positive: "Loyal support, a friend who is genuinely on your side, protective instinct.",
    negative: "Betrayal fear, a relationship that has started to bark instead of speak.",
    psychological: "Reflects attachment and how safe you feel being dependent on someone.",
    spiritual: "Guides and guardians of the threshold between worlds.",
    historical: "Dogs were considered messengers and protectors of the departing soul.",
    variations: ["Friendly dog", "Barking dog", "Being chased by a dog", "Injured dog"],
    related: ["Cat", "Friend", "Being chased", "House"],
  },
  {
    name: "Cat", category: "Pets",
    essence: "Independence and unspoken intuition.",
    meaning: "A cat shows the part of you that stays free, senses subtly and does not explain itself.",
    positive: "Trusted intuition, self possession, sensuality, boundaries that hold.",
    negative: "Emotional distance, something in your life you are treating too casually.",
    psychological: "Often appears when a person needs to reclaim privacy or personal space.",
    spiritual: "Long treated as a guardian of the household and a keeper of subtle sight.",
    historical: "Honoured in Egypt as sacred, and read across cultures as a sign of the unseen.",
    variations: ["Black cat", "Cat sitting calmly", "Cat scratching", "Rescuing a cat"],
    related: ["Dog", "Mirror", "House", "Moon"],
  },
  {
    name: "Bird", category: "Birds",
    essence: "News, ideas and the wish to rise.",
    meaning: "Birds carry messages in dreams. The species, height and freedom of the bird colours the message.",
    positive: "Good news, inspiration, an idea that is ready to leave the nest.",
    negative: "A caged bird points to talent you are keeping quiet, or a life that feels too small.",
    psychological: "Reflects hope and creative appetite.",
    spiritual: "Birds are traditional carriers between earth and sky and between the living and the departed.",
    historical: "Ancient priests read bird flight as omens of favourable or unfavourable timing.",
    variations: ["Bird flying free", "Caged bird", "Wounded bird", "Bird entering the house"],
    related: ["Flying", "Sky", "Message", "Mountain"],
  },
  {
    name: "Teeth", category: "Body parts",
    essence: "Confidence, capability and how you show yourself.",
    meaning: "Teeth dreams appear when self image is under review, especially before being judged by others.",
    positive: "A chance to rebuild confidence honestly instead of performing it.",
    negative: "Fear of losing face, worry about ageing, exhaustion, a promise you cannot keep.",
    psychological: "One of the most common stress dreams. Frequently linked with jaw tension and speech you held back.",
    spiritual: "Read as a call to speak carefully and to protect your word.",
    historical: "Old texts connected falling teeth to family news, though modern practice reads it as self image first.",
    variations: ["Teeth falling out", "Crumbling teeth", "Loose tooth", "Perfect new teeth"],
    related: ["Mirror", "Speech", "Public exposure", "Health"],
  },
  {
    name: "Being chased", category: "People",
    essence: "Something wants your attention and you keep moving.",
    meaning: "The chase is rarely about the pursuer. It is about the part of you that refuses to stop and look.",
    positive: "Once you turn and face it, the dream usually changes and the fear drops sharply.",
    negative: "Avoidance, deadline pressure, an unfinished conversation following you around.",
    psychological: "Classic avoidance imagery. The pursuer is usually a disowned feeling such as anger or grief.",
    spiritual: "The shadow asking for integration, not punishment.",
    historical: "Treated in older texts as a warning to settle disputes quickly.",
    variations: ["Unknown chaser", "Being chased slowly", "Turning to face the chaser", "Hiding successfully"],
    related: ["Fear", "Shadow", "Dog", "Running"],
  },
  {
    name: "Death", category: "Death and endings",
    essence: "An ending, almost never a prediction.",
    meaning: "Death in dreams marks the close of a chapter, a role or an old self. It appears at the door of real change.",
    positive: "Completion, freedom from an outgrown identity, permission to begin again.",
    negative: "Fear of loss, unfinished grief, resistance to a change already happening.",
    psychological: "Frequently seen during career change, separation, relocation and recovery.",
    spiritual: "Initiation. Many traditions treat a death dream as a rebirth signal.",
    historical: "Dream interpreters have consistently warned against reading death dreams literally.",
    variations: ["Own death", "Death of a loved one", "Attending a funeral", "Talking with someone who has died"],
    related: ["Ghost", "Rebirth", "Marriage", "Temple"],
  },
  {
    name: "Ghost", category: "Death and endings",
    essence: "Something unfinished that is still present.",
    meaning: "A ghost is memory that has not been processed. It visits until it is acknowledged.",
    positive: "A chance to complete a goodbye, to forgive, or to reclaim something you left behind.",
    negative: "Being haunted by regret, guilt or an old relationship that still shapes your choices.",
    psychological: "Common in unresolved grief and after abrupt endings.",
    spiritual: "Read as ancestral contact and as a request for remembrance.",
    historical: "Rituals of remembrance exist in nearly every culture precisely for these dreams.",
    variations: ["Friendly ghost", "Frightening presence", "A deceased relative speaking", "A house that feels haunted"],
    related: ["Death", "House", "Memory", "Temple"],
  },
  {
    name: "Baby", category: "Family",
    essence: "A new beginning that needs care to survive.",
    meaning: "A baby is something recently born in your life: a project, a relationship, a version of you. The dream shows how well you are caring for it.",
    positive: "Fresh potential, tenderness, a creative venture worth protecting.",
    negative: "Feeling unprepared, responsibility arriving faster than resources.",
    psychological: "Appears at the start of demanding new commitments as often as it does around actual parenthood.",
    spiritual: "The divine child, pure potential entering your life.",
    historical: "Widely read as a favourable omen of growth and increase.",
    variations: ["Holding a calm baby", "Crying baby", "Forgetting a baby", "Finding an unknown baby"],
    related: ["Pregnancy", "Family", "Home", "Marriage"],
  },
  {
    name: "Marriage", category: "Relationships",
    essence: "Two parts of your life agreeing to work together.",
    meaning: "A wedding dream shows union. It can be about a relationship, but it is just as often about integrating two sides of yourself.",
    positive: "Commitment, harmony, a decision finally made with the whole self.",
    negative: "Pressure to commit, fear of losing independence, an obligation you have not chosen freely.",
    psychological: "Often follows a period of internal conflict that has just resolved.",
    spiritual: "The sacred marriage, the inner masculine and feminine coming into balance.",
    historical: "Long read as an auspicious sign of alliance and of new family bonds.",
    variations: ["Own wedding", "Attending a wedding", "A wedding that goes wrong", "Marrying a stranger"],
    related: ["Love", "Baby", "Temple", "Family"],
  },
  {
    name: "Pregnancy", category: "Family",
    essence: "Something is growing that is not yet visible.",
    meaning: "Pregnancy dreams announce a phase of development. The result is not ready, and the dream is asking for patience.",
    positive: "Creative growth, a plan maturing, hope carried quietly.",
    negative: "Anxiety about timing, or carrying something for someone else.",
    psychological: "Very common during study, business building and personal reinvention.",
    spiritual: "Sacred potential and the responsibility that comes with it.",
    historical: "Treated as an omen of increase in wealth or family across most traditions.",
    variations: ["Own pregnancy", "Someone else pregnant", "Unexpected pregnancy", "Long pregnancy"],
    related: ["Baby", "Marriage", "Home", "Garden"],
  },
  {
    name: "House", category: "Objects and places",
    essence: "The structure of your own self.",
    meaning: "A house is the map of your inner world. Rooms are areas of life, the basement is memory and the upper floors are thought and aspiration.",
    positive: "Discovering new rooms points to unused capacity and untapped talent.",
    negative: "Damaged walls, leaks or intruders point to boundaries that need repair.",
    psychological: "Perhaps the most reliable self portrait the dreaming mind produces.",
    spiritual: "The temple of the self, and the state of your inner sanctuary.",
    historical: "House dreams were read as reports on the health of the family line.",
    variations: ["Childhood home", "New rooms discovered", "Empty house", "House being repaired"],
    related: ["Door", "Mirror", "Family", "Fire"],
  },
  {
    name: "Mirror", category: "Objects and places",
    essence: "Self recognition, honestly or uncomfortably.",
    meaning: "A mirror shows how you currently see yourself, and how much of that image belongs to other people's opinions.",
    positive: "Clarity, self acceptance, seeing your growth for the first time.",
    negative: "Self criticism, identity confusion, performing a version of yourself.",
    psychological: "Appears around image, reputation and comparison.",
    spiritual: "The reflection of the soul, and a reminder that the observer is not the reflection.",
    historical: "Mirrors were treated as thresholds and were covered during mourning in several cultures.",
    variations: ["Broken mirror", "Unfamiliar reflection", "No reflection", "Clear calm reflection"],
    related: ["Teeth", "House", "Water", "Identity"],
  },
  {
    name: "Money", category: "Money and value",
    essence: "Self worth, energy and exchange.",
    meaning: "Money in dreams measures value more than finance. Finding, losing or giving money mirrors how you value your own time and effort.",
    positive: "Recognition, a fair exchange, resources arriving, confidence in your worth.",
    negative: "Insecurity, fear of scarcity, giving more than you receive.",
    psychological: "Strongly tied to self esteem and to how safe you feel asking for what you deserve.",
    spiritual: "Flow. Traditions treat wealth dreams as tests of generosity rather than as forecasts.",
    historical: "Finding coins was read as unexpected support, losing them as a warning to review commitments.",
    variations: ["Finding money", "Losing a wallet", "Giving money away", "Counting money"],
    related: ["Gold", "Jewellery", "Work", "Success"],
  },
  {
    name: "Blood", category: "Body parts",
    essence: "Life force, family line and what is costing you.",
    meaning: "Blood shows vitality and expense. It marks where your energy is going and whether the cost is sustainable.",
    positive: "Deep bond, courage, honest sacrifice for something you believe in.",
    negative: "Depletion, an injury to trust, a situation quietly draining you.",
    psychological: "Appears during exhaustion and after emotional injury.",
    spiritual: "Kinship and lineage, and the sacredness of what is given freely.",
    historical: "Read as family news and as a sign of shared destiny.",
    variations: ["Small wound", "Bleeding without pain", "Someone else bleeding", "Stopping the bleeding"],
    related: ["Health", "Family", "Fire", "Death"],
  },
  {
    name: "Temple", category: "Religion",
    essence: "The still centre asking for a visit.",
    meaning: "A temple, mosque, church or shrine marks the part of your life that is asking for meaning rather than achievement.",
    positive: "Protection, guidance, peace, a decision made from a settled place.",
    negative: "Feeling spiritually distant, or seeking approval where you need honesty.",
    psychological: "Appears when values need re alignment with daily behaviour.",
    spiritual: "Direct contact with the sacred, and often a call to a simple practice.",
    historical: "Sleeping in temples for guidance was a formal practice in Greek and Indian traditions.",
    variations: ["Praying calmly", "Closed temple", "Bell ringing", "Being unable to enter"],
    related: ["God", "Light", "Mountain", "Death"],
  },
  {
    name: "God", category: "Religion",
    essence: "A meeting with your highest standard and deepest comfort.",
    meaning: "Divine figures in dreams usually appear at turning points where reassurance or direction is needed.",
    positive: "Guidance, grace, courage, a clear inner yes.",
    negative: "Judgement anxiety, guilt, a strict inner voice that has taken over.",
    psychological: "Often expresses the ideal self and the conscience.",
    spiritual: "Traditionally received as blessing and as a call to service.",
    historical: "Divine dreams were recorded as the most important class of dream in nearly every civilisation.",
    variations: ["A voice with no form", "A statue coming alive", "Light without shape", "A blessing received"],
    related: ["Temple", "Angels", "Light", "Guru"],
  },
  {
    name: "Train", category: "Travel",
    essence: "A shared track and a schedule you did not fully write.",
    meaning: "Trains show life direction inside a system, such as career, family expectation or education.",
    positive: "Progress, being on the right track, arriving with others.",
    negative: "Missing the train points to a fear of being late in life, or to a path chosen by others.",
    psychological: "Common during career decisions and comparison with peers.",
    spiritual: "The soul's journey through fixed lessons.",
    historical: "Modern in imagery, but it inherited older road and caravan symbolism.",
    variations: ["Missing the train", "Wrong train", "Comfortable journey", "Train without a driver"],
    related: ["Travel", "Road", "Career", "Time"],
  },
  {
    name: "Forest", category: "Nature",
    essence: "The unmapped middle of a transition.",
    meaning: "A forest is the part of the journey where the path is unclear. It is a place of testing, not punishment.",
    positive: "Discovery, deep rest, contact with instinct, meeting an inner guide.",
    negative: "Feeling lost, decision fatigue, losing sight of the goal.",
    psychological: "Appears mid change, after leaving something but before arriving anywhere.",
    spiritual: "The sacred grove where initiation happens away from the crowd.",
    historical: "Forests in myth are where heroes lose their way and find their real task.",
    variations: ["Lost in the forest", "Sunlit forest", "Dark forest", "Finding a path"],
    related: ["Mountain", "Animals", "River", "Night"],
  },
  {
    name: "Mountain", category: "Nature",
    essence: "A goal that demands patience and altitude.",
    meaning: "Mountains show ambition and the effort required. Where you stand on it describes your progress honestly.",
    positive: "Achievement, perspective, endurance, a long plan working.",
    negative: "An obstacle that feels immovable, or an ambition set too high for the season.",
    psychological: "Reflects goal setting and perseverance.",
    spiritual: "The classic place of revelation, silence and vow.",
    historical: "Sacred mountains anchor almost every mythology as the meeting place of earth and sky.",
    variations: ["Climbing steadily", "Stuck on a slope", "Reaching the summit", "Seeing a mountain from far"],
    related: ["Flying", "Forest", "Temple", "Success"],
  },
  {
    name: "Snakebite", category: "Health",
    essence: "A warning that has already been felt in the body.",
    meaning: "Being bitten marks the point where a risk you sensed has made contact. The dream urges an honest review rather than panic.",
    positive: "Awareness arriving in time, a boundary that will now be enforced.",
    negative: "Betrayal, a health signal being ignored, a situation with hidden toxicity.",
    psychological: "Often follows a conversation where instinct disagreed with politeness.",
    spiritual: "An initiation through venom, an old tolerance dying.",
    historical: "Healing traditions used serpent imagery for both poison and cure.",
    variations: ["Bitten on the hand", "Bitten with no pain", "Surviving a bite", "Watching someone else bitten"],
    related: ["Snake", "Health", "Blood", "Fear"],
  },
  {
    name: "School", category: "School and work",
    essence: "Being measured, and the memory of being measured.",
    meaning: "School dreams gather every situation where you feel tested. Exams, corridors and forgotten homework all point to present evaluation.",
    positive: "Learning, preparation, a skill you are ready to prove.",
    negative: "Performance anxiety, imposter feelings, an old judgement still running.",
    psychological: "One of the most common adult stress dreams, usually unrelated to actual studies.",
    spiritual: "Life as a curriculum, and a lesson repeating until it is learned.",
    historical: "Modern in setting, ancient in meaning as the trial before recognition.",
    variations: ["Unprepared for an exam", "Late for class", "Back in an old classroom", "Teaching instead of studying"],
    related: ["Career", "Failure", "Success", "Time"],
  },
  {
    name: "Career", category: "Career and success",
    essence: "Purpose, contribution and the price you pay for both.",
    meaning: "Work dreams review your role. Offices, colleagues and tasks show how aligned your daily effort is with your direction.",
    positive: "Recognition, competence, a role that fits.",
    negative: "Overwork, invisible effort, a role you have outgrown.",
    psychological: "Frequent during appraisal season and job change.",
    spiritual: "Dharma, the right work for this stage of life.",
    historical: "Work dreams were read as omens about patronage and support.",
    variations: ["Promotion", "Being dismissed", "An unfamiliar workplace", "Working endlessly"],
    related: ["School", "Money", "Success", "Failure"],
  },
  {
    name: "Nightmare", category: "Health",
    essence: "An alarm, not an enemy.",
    meaning: "A nightmare is the mind raising the volume because a quieter signal was missed. Its intensity is a measure of urgency, not of danger.",
    positive: "Once decoded, nightmares release the most energy of any dream and often end recurring patterns.",
    negative: "Chronic nightmares can point to unprocessed stress or disturbed sleep and deserve real attention.",
    psychological: "Linked to stress load, sleep debt and unresolved threat. Rehearsing a calmer ending while awake reduces recurrence.",
    spiritual: "A guardian dream, harsh in tone but protective in purpose.",
    historical: "Traditional practice was to speak the dream aloud at dawn to remove its charge.",
    variations: ["Recurring nightmare", "Sleep paralysis", "Being trapped", "Waking in fear"],
    related: ["Being chased", "Ghost", "Fear", "Death"],
  },
  {
    name: "Lucid dream", category: "Health",
    essence: "Awareness waking up inside the dream.",
    meaning: "Lucidity means you recognised the dream while inside it. It marks growing self awareness in waking life as well.",
    positive: "Creative rehearsal, healing conversations, courage practised safely.",
    negative: "Over control can flatten the message the dream was trying to deliver.",
    psychological: "Trained through reality checks, dream journalling and consistent sleep timing.",
    spiritual: "A practice found in Tibetan dream yoga as preparation for clear awareness at all times.",
    historical: "Described in contemplative traditions long before it was studied in laboratories.",
    variations: ["Becoming aware briefly", "Full control", "Losing lucidity", "Flying while lucid"],
    related: ["Flying", "Mirror", "Meditation", "Nightmare"],
  },
];

export const DREAM_SYMBOLS: DreamSymbol[] = SEEDS.map((s) => ({
  slug: slugify(s.name),
  name: s.name,
  category: s.category,
  essence: s.essence,
  meaning: s.meaning,
  positive: s.positive,
  negative: s.negative,
  psychological: s.psychological,
  spiritual: s.spiritual,
  historical: s.historical,
  variations: s.variations,
  related: s.related,
  faqs: [
    { q: `Does dreaming of ${s.name.toLowerCase()} predict the future?`, a: "No. This dream describes your present inner situation. It reports on feeling and attention, not on fixed events." },
    { q: `Why does ${s.name.toLowerCase()} keep repeating in my dreams?`, a: "A repeated symbol means the message has not yet been acted on in waking life. Write the dream down, name the feeling it leaves, and take one small step that answers it." },
    { q: `Is this dream a good sign or a bad sign?`, a: `Both readings exist. Positive side: ${s.positive.split(",")[0].toLowerCase()}. Careful side: ${s.negative.split(",")[0].toLowerCase()}. Your mood on waking usually tells you which one applies.` },
  ],
}));

export const DREAM_CATEGORIES = Array.from(new Set(DREAM_SYMBOLS.map((d) => d.category))).sort();

export function findSymbol(slug: string) {
  return DREAM_SYMBOLS.find((d) => d.slug === slug) ?? null;
}

export function searchSymbols(q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return DREAM_SYMBOLS;
  return DREAM_SYMBOLS.filter((d) =>
    d.name.toLowerCase().includes(query) ||
    d.category.toLowerCase().includes(query) ||
    d.essence.toLowerCase().includes(query) ||
    d.related.some((r) => r.toLowerCase().includes(query)),
  );
}

export const QUICK_DREAMS = [
  "Flying", "Snake", "Temple", "Water", "Baby", "Marriage", "Ocean", "Dog", "Cat", "Fire",
  "Money", "Teeth", "Death", "Rain", "Forest", "Mountain", "Bird", "Blood", "River", "Train",
  "Mirror", "House",
];

export const DREAM_MOODS = [
  "Happy", "Peaceful", "Confused", "Scared", "Excited", "Sad", "Inspired", "Anxious",
] as const;
export type DreamMood = (typeof DREAM_MOODS)[number];

export function dreamOfTheDay(date = new Date()): DreamSymbol {
  const day = Math.floor(date.getTime() / 86400000);
  return DREAM_SYMBOLS[day % DREAM_SYMBOLS.length];
}
