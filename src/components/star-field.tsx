export function StarField({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Deep nebula wash */}
      <div className="absolute inset-0 nebula-wash" />

      {/* Twinkling star layers */}
      <div className="absolute inset-0 star-field animate-twinkle opacity-80" />
      <div
        className="absolute inset-0 star-field-dense opacity-60"
        style={{ animation: "twinkle 5s ease-in-out infinite reverse" }}
      />

      {/* Drifting aurora clouds */}
      <div className="absolute -top-1/3 -left-1/4 h-[70vh] w-[70vh] rounded-full bg-galaxy/30 blur-[120px] animate-aurora" />
      <div
        className="absolute -bottom-1/3 -right-1/4 h-[65vh] w-[65vh] rounded-full bg-aurora/25 blur-[120px] animate-aurora"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[55vh] w-[80vh] rounded-full bg-gold/8 blur-[140px] animate-aurora"
        style={{ animationDelay: "-10s" }}
      />

      {/* Shooting stars */}
      <div className="shooting-star" style={{ top: "18%", left: "-10%", animationDelay: "2s" }} />
      <div className="shooting-star" style={{ top: "62%", left: "-10%", animationDelay: "9s" }} />

      {/* Distant crescent moon sigil */}
      <div className="absolute top-8 right-8 opacity-40">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gold-soft/60 to-transparent blur-md" />
      </div>
    </div>
  );
}
