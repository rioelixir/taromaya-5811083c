import type { Gender, Tradition } from "./baby-names";

/**
 * Taromaya's own baby name book.
 *
 * The app suggests names from this list instead of asking an outside AI model,
 * so name ideas are instant, free and always the same for the same choices.
 * Names are grouped by the sound they start with, which is what the Vedic
 * naming tradition (Namakarana) cares about.
 */

export type BookName = {
  name: string;
  meaning: string;
  origin: Tradition;
  gender: Gender;
};

export const NAME_BOOK: BookName[] = [
  // A / E / I / O / U
  { name: "Aarav", meaning: "Peaceful and calm", origin: "Sanskrit", gender: "Boy" },
  { name: "Aadi", meaning: "The very first", origin: "Sanskrit", gender: "Boy" },
  { name: "Advait", meaning: "One of a kind", origin: "Sanskrit", gender: "Boy" },
  { name: "Arjun", meaning: "Bright and pure", origin: "Hindu", gender: "Boy" },
  { name: "Anant", meaning: "Endless", origin: "Sanskrit", gender: "Boy" },
  { name: "Aanya", meaning: "Grace without limit", origin: "Sanskrit", gender: "Girl" },
  { name: "Aarohi", meaning: "Rising higher", origin: "Sanskrit", gender: "Girl" },
  { name: "Amara", meaning: "Forever", origin: "Sanskrit", gender: "Girl" },
  { name: "Anaya", meaning: "Caring guardian", origin: "Sanskrit", gender: "Girl" },
  { name: "Advika", meaning: "The only one", origin: "Sanskrit", gender: "Girl" },
  { name: "Aarush", meaning: "First light of the sun", origin: "Sanskrit", gender: "Unisex" },
  { name: "Eshan", meaning: "Lord of all", origin: "Sanskrit", gender: "Boy" },
  { name: "Ekansh", meaning: "One whole part", origin: "Sanskrit", gender: "Boy" },
  { name: "Esha", meaning: "Wish and desire", origin: "Sanskrit", gender: "Girl" },
  { name: "Ira", meaning: "The earth", origin: "Sanskrit", gender: "Girl" },
  { name: "Ishaan", meaning: "Sun and Lord Shiva", origin: "Sanskrit", gender: "Boy" },
  { name: "Ishita", meaning: "One who wishes well", origin: "Sanskrit", gender: "Girl" },
  { name: "Om", meaning: "The first sound", origin: "Sanskrit", gender: "Unisex" },
  { name: "Ojas", meaning: "Bright strength", origin: "Sanskrit", gender: "Boy" },
  { name: "Utkarsh", meaning: "Growing upward", origin: "Sanskrit", gender: "Boy" },
  { name: "Uma", meaning: "Mother goddess", origin: "Hindu", gender: "Girl" },
  { name: "Urvi", meaning: "The wide earth", origin: "Sanskrit", gender: "Girl" },

  // Ch / Chu / Che / Cho
  { name: "Chetan", meaning: "Awake and aware", origin: "Sanskrit", gender: "Boy" },
  { name: "Chirag", meaning: "A small lamp", origin: "Hindu", gender: "Boy" },
  { name: "Charvi", meaning: "Beautiful one", origin: "Sanskrit", gender: "Girl" },
  { name: "Chhavi", meaning: "A gentle glow", origin: "Sanskrit", gender: "Girl" },

  // D / Da / Di / Du / De / Do / Dh
  { name: "Daksh", meaning: "Skilful", origin: "Sanskrit", gender: "Boy" },
  { name: "Darsh", meaning: "One who sees clearly", origin: "Sanskrit", gender: "Boy" },
  { name: "Dhruv", meaning: "The steady star", origin: "Sanskrit", gender: "Boy" },
  { name: "Divit", meaning: "Immortal", origin: "Sanskrit", gender: "Boy" },
  { name: "Diya", meaning: "A little lamp", origin: "Hindu", gender: "Girl" },
  { name: "Dhriti", meaning: "Quiet courage", origin: "Sanskrit", gender: "Girl" },
  { name: "Deva", meaning: "Shining one", origin: "Sanskrit", gender: "Unisex" },

  // G / Gha / Ga
  { name: "Gaurav", meaning: "Pride and honour", origin: "Sanskrit", gender: "Boy" },
  { name: "Girish", meaning: "Lord of mountains", origin: "Hindu", gender: "Boy" },
  { name: "Gauri", meaning: "Fair and bright", origin: "Hindu", gender: "Girl" },
  { name: "Gia", meaning: "Full of life", origin: "Modern", gender: "Girl" },

  // H / Ha / Hi / Hu / He / Ho
  { name: "Harsh", meaning: "Joy", origin: "Sanskrit", gender: "Boy" },
  { name: "Hriday", meaning: "The heart", origin: "Sanskrit", gender: "Boy" },
  { name: "Hitesh", meaning: "One who wants your good", origin: "Hindu", gender: "Boy" },
  { name: "Hasita", meaning: "Full of smiles", origin: "Sanskrit", gender: "Girl" },
  { name: "Hetal", meaning: "Friendly", origin: "Hindu", gender: "Girl" },
  { name: "Hiya", meaning: "Heart", origin: "Sanskrit", gender: "Girl" },

  // K / Ka / Ki / Ku / Ke / Ko
  { name: "Kabir", meaning: "Great, a poet saint", origin: "Hindu", gender: "Boy" },
  { name: "Kartik", meaning: "Born in a holy month", origin: "Hindu", gender: "Boy" },
  { name: "Kiaan", meaning: "Grace of God", origin: "Modern", gender: "Boy" },
  { name: "Kunal", meaning: "Lotus", origin: "Sanskrit", gender: "Boy" },
  { name: "Kavya", meaning: "A poem", origin: "Sanskrit", gender: "Girl" },
  { name: "Kiara", meaning: "Bright and dark eyed", origin: "Modern", gender: "Girl" },
  { name: "Kritika", meaning: "A star in the sky", origin: "Sanskrit", gender: "Girl" },
  { name: "Kaveri", meaning: "A holy river", origin: "Hindu", gender: "Girl" },

  // L / La / Li / Lu / Le / Lo
  { name: "Laksh", meaning: "The aim", origin: "Sanskrit", gender: "Boy" },
  { name: "Lakshya", meaning: "The target you reach", origin: "Sanskrit", gender: "Boy" },
  { name: "Lavanya", meaning: "Grace and beauty", origin: "Sanskrit", gender: "Girl" },
  { name: "Lipika", meaning: "A written line", origin: "Sanskrit", gender: "Girl" },
  { name: "Luv", meaning: "Son of Lord Rama", origin: "Hindu", gender: "Boy" },

  // M / Ma / Mi / Mu / Me / Mo
  { name: "Manav", meaning: "A human being", origin: "Sanskrit", gender: "Boy" },
  { name: "Mihir", meaning: "The sun", origin: "Sanskrit", gender: "Boy" },
  { name: "Mohit", meaning: "One who charms", origin: "Hindu", gender: "Boy" },
  { name: "Maya", meaning: "Magic of the world", origin: "Sanskrit", gender: "Girl" },
  { name: "Meera", meaning: "A loving devotee", origin: "Hindu", gender: "Girl" },
  { name: "Mira", meaning: "Ocean and wonder", origin: "Modern", gender: "Girl" },
  { name: "Mitali", meaning: "Friendship", origin: "Sanskrit", gender: "Girl" },

  // N / Na / Ni / Nu / Ne / No
  { name: "Naman", meaning: "A respectful bow", origin: "Sanskrit", gender: "Boy" },
  { name: "Nirvaan", meaning: "Free and at peace", origin: "Sanskrit", gender: "Boy" },
  { name: "Nakul", meaning: "Brave brother", origin: "Hindu", gender: "Boy" },
  { name: "Naina", meaning: "Beautiful eyes", origin: "Hindu", gender: "Girl" },
  { name: "Nitya", meaning: "Always, forever", origin: "Sanskrit", gender: "Girl" },
  { name: "Navya", meaning: "Brand new", origin: "Sanskrit", gender: "Girl" },

  // P / Pa / Pi / Pu / Pe / Po
  { name: "Parth", meaning: "A great archer", origin: "Hindu", gender: "Boy" },
  { name: "Pranav", meaning: "The sound Om", origin: "Sanskrit", gender: "Boy" },
  { name: "Prisha", meaning: "Beloved gift", origin: "Sanskrit", gender: "Girl" },
  { name: "Pari", meaning: "A fairy", origin: "Modern", gender: "Girl" },
  { name: "Poorvi", meaning: "From the east", origin: "Sanskrit", gender: "Girl" },

  // R / Ra / Ri / Ru / Re / Ro
  { name: "Rian", meaning: "Little king", origin: "Modern", gender: "Boy" },
  { name: "Rudra", meaning: "A form of Lord Shiva", origin: "Hindu", gender: "Boy" },
  { name: "Rohan", meaning: "One who climbs", origin: "Sanskrit", gender: "Boy" },
  { name: "Riya", meaning: "A singer", origin: "Modern", gender: "Girl" },
  { name: "Reeva", meaning: "A river", origin: "Sanskrit", gender: "Girl" },
  { name: "Ridhi", meaning: "Good fortune", origin: "Sanskrit", gender: "Girl" },

  // S / Sa / Si / Su / Se / So / Sh
  { name: "Sai", meaning: "A holy teacher", origin: "Hindu", gender: "Unisex" },
  { name: "Samarth", meaning: "Able and strong", origin: "Sanskrit", gender: "Boy" },
  { name: "Shaurya", meaning: "Bravery", origin: "Sanskrit", gender: "Boy" },
  { name: "Sohan", meaning: "Handsome", origin: "Hindu", gender: "Boy" },
  { name: "Saanvi", meaning: "Goddess Lakshmi", origin: "Sanskrit", gender: "Girl" },
  { name: "Siya", meaning: "Goddess Sita", origin: "Hindu", gender: "Girl" },
  { name: "Suhani", meaning: "Pleasant", origin: "Hindu", gender: "Girl" },
  { name: "Shanaya", meaning: "First ray of sun", origin: "Modern", gender: "Girl" },

  // T / Ta / Ti / Tu / Te / To / Th
  { name: "Tanish", meaning: "Ambition", origin: "Sanskrit", gender: "Boy" },
  { name: "Tejas", meaning: "Shine and sharpness", origin: "Sanskrit", gender: "Boy" },
  { name: "Tara", meaning: "A star", origin: "Sanskrit", gender: "Girl" },
  { name: "Tanvi", meaning: "Slender and lovely", origin: "Sanskrit", gender: "Girl" },
  { name: "Trisha", meaning: "Wish", origin: "Sanskrit", gender: "Girl" },

  // V / Va / Vi / Vu / Ve / Vo
  { name: "Vihaan", meaning: "Dawn", origin: "Sanskrit", gender: "Boy" },
  { name: "Vivaan", meaning: "Full of life", origin: "Sanskrit", gender: "Boy" },
  { name: "Ved", meaning: "Sacred knowledge", origin: "Sanskrit", gender: "Boy" },
  { name: "Viraj", meaning: "Shining and splendid", origin: "Sanskrit", gender: "Boy" },
  { name: "Vanya", meaning: "Of the forest", origin: "Sanskrit", gender: "Girl" },
  { name: "Vedika", meaning: "A holy altar", origin: "Sanskrit", gender: "Girl" },
  { name: "Veda", meaning: "Knowledge", origin: "Sanskrit", gender: "Girl" },

  // Y / Ya / Yi / Yu / Ye / Yo
  { name: "Yash", meaning: "Fame", origin: "Sanskrit", gender: "Boy" },
  { name: "Yuvan", meaning: "Young and strong", origin: "Sanskrit", gender: "Boy" },
  { name: "Yamini", meaning: "The night", origin: "Sanskrit", gender: "Girl" },
  { name: "Yuvika", meaning: "A young girl", origin: "Sanskrit", gender: "Girl" },

  // J / Ja / Ji / Ju / Je / Jo
  { name: "Jai", meaning: "Victory", origin: "Hindu", gender: "Boy" },
  { name: "Jayant", meaning: "Winner", origin: "Sanskrit", gender: "Boy" },
  { name: "Janvi", meaning: "The river Ganga", origin: "Hindu", gender: "Girl" },
  { name: "Jiya", meaning: "Heart and life", origin: "Modern", gender: "Girl" },

  // B / Bha / Bh
  { name: "Bhavya", meaning: "Grand and splendid", origin: "Sanskrit", gender: "Unisex" },
  { name: "Bodhi", meaning: "Awakening", origin: "Sanskrit", gender: "Unisex" },

  // Sikh
  { name: "Gurleen", meaning: "Lost in the teacher's love", origin: "Sikh", gender: "Girl" },
  { name: "Harleen", meaning: "Absorbed in God", origin: "Sikh", gender: "Girl" },
  { name: "Jaspreet", meaning: "Love of praise", origin: "Sikh", gender: "Unisex" },
  { name: "Manveer", meaning: "Brave at heart", origin: "Sikh", gender: "Boy" },
  { name: "Ekamjot", meaning: "One light", origin: "Sikh", gender: "Unisex" },
  { name: "Simran", meaning: "Quiet remembering of God", origin: "Sikh", gender: "Girl" },

  // Muslim
  { name: "Ayaan", meaning: "A gift of God", origin: "Muslim", gender: "Boy" },
  { name: "Rayyan", meaning: "A gate of heaven", origin: "Muslim", gender: "Boy" },
  { name: "Zayd", meaning: "Growth", origin: "Muslim", gender: "Boy" },
  { name: "Imran", meaning: "Long life", origin: "Muslim", gender: "Boy" },
  { name: "Aisha", meaning: "Alive and well", origin: "Muslim", gender: "Girl" },
  { name: "Zara", meaning: "Blooming flower", origin: "Muslim", gender: "Girl" },
  { name: "Inaya", meaning: "Kindness and care", origin: "Muslim", gender: "Girl" },
  { name: "Noor", meaning: "Light", origin: "Muslim", gender: "Unisex" },

  // Christian
  { name: "Aaron", meaning: "High mountain", origin: "Christian", gender: "Boy" },
  { name: "Ethan", meaning: "Strong and firm", origin: "Christian", gender: "Boy" },
  { name: "Noah", meaning: "Rest and comfort", origin: "Christian", gender: "Boy" },
  { name: "Samuel", meaning: "God has heard", origin: "Christian", gender: "Boy" },
  { name: "Anna", meaning: "Grace", origin: "Christian", gender: "Girl" },
  { name: "Elena", meaning: "Shining light", origin: "Christian", gender: "Girl" },
  { name: "Maria", meaning: "Beloved and pure", origin: "Christian", gender: "Girl" },
  { name: "Sarah", meaning: "Princess", origin: "Christian", gender: "Girl" },

  // Modern short names
  { name: "Aria", meaning: "A song", origin: "Modern", gender: "Girl" },
  { name: "Nia", meaning: "Purpose", origin: "Modern", gender: "Girl" },
  { name: "Zia", meaning: "Light and glow", origin: "Modern", gender: "Unisex" },
  { name: "Kai", meaning: "The sea", origin: "Modern", gender: "Unisex" },
  { name: "Neo", meaning: "New", origin: "Modern", gender: "Unisex" },
  { name: "Ayan", meaning: "Path of light", origin: "Modern", gender: "Boy" },
];
