export function StarField({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 star-field animate-twinkle opacity-70" />
      <div className="absolute -top-1/3 -left-1/4 h-[60vh] w-[60vh] rounded-full bg-galaxy/25 blur-3xl animate-aurora" />
      <div className="absolute -bottom-1/3 -right-1/4 h-[55vh] w-[55vh] rounded-full bg-aurora/20 blur-3xl animate-aurora" style={{ animationDelay: "-6s" }} />
    </div>
  );
}
