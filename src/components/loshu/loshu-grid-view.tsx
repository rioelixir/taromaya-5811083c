import { motion } from "framer-motion";
import { GRID_LAYOUT, type Digit, type LoShuAnalysis } from "@/lib/loshu/types";

/** The 3 by 3 magic square with each digit repeated inside its own cell. */
export function LoShuGridView({ analysis }: { analysis: LoShuAnalysis }) {
  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2 sm:gap-3">
      {GRID_LAYOUT.flat().map((digit, i) => {
        const count = analysis.counts[digit as Digit];
        return (
          <motion.div
            key={digit}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className={[
              "relative flex aspect-square items-center justify-center rounded-2xl border p-2 text-center shadow-sm",
              count
                ? "border-gold/50 bg-gold/10"
                : "border-white/10 bg-white/[0.02]",
            ].join(" ")}
          >
            <span className="absolute left-2 top-1.5 text-[10px] tracking-widest text-muted-foreground">
              {digit}
            </span>
            {count > 0 && (
              <span
                className={[
                  "font-display leading-none text-pearl break-all",
                  count >= 4 ? "text-xl" : count === 3 ? "text-2xl" : "text-3xl",
                ].join(" ")}
              >
                {String(digit).repeat(count)}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 140 140" className="h-32 w-32 -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/10" />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className="text-gold"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="-mt-24 text-center">
        <div className="font-display text-3xl gold-text">{score}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">of 100</div>
      </div>
      <div className="mt-14 text-xs text-muted-foreground">Overall energy score</div>
    </div>
  );
}

export function ZoneBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-pearl">{label}</span>
        <span className="text-gold">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gold"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
