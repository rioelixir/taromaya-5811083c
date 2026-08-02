import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { VedicShell, VCard, StatTile } from "@/components/vedic/vedic-shell";
import { useProfiles } from "@/lib/vedic-num/profiles";
import { coreSheet } from "@/lib/vedic-num/core-numbers";
import { analyseNumber, analyseBusinessName, type AppliedKind } from "@/lib/vedic-num/applied";
import { vedicNumerology, loShuAdvanced } from "@/lib/vedic-numerology";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vedic-numerology/calculator")({
  component: CalculatorPage,
  head: () => ({
    meta: [
      { title: "Numerology Calculators — TAROMAYA" },
      { name: "description", content: "Driver, conductor, destiny, soul urge, name, mobile, business, vehicle and house number calculators with the full working shown for each result." },
      { property: "og:title", content: "Numerology Calculators — TAROMAYA" },
      { property: "og:description", content: "Every core and applied numerology calculator in one place, each with its method explained." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const TABS = ["Core numbers", "Name and grid", "Mobile", "Business", "Vehicle", "House"] as const;
type Tab = (typeof TABS)[number];

const GROUPS = [
  { key: "birth", label: "From your birth date" },
  { key: "name", label: "From your name" },
  { key: "cycle", label: "Present cycles" },
  { key: "advanced", label: "Advanced numbers" },
] as const;

function CalculatorPage() {
  const { active } = useProfiles();
  const [tab, setTab] = useState<Tab>("Core numbers");
  const [mobile, setMobile] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [house, setHouse] = useState("");
  const [business, setBusiness] = useState("");

  const birthDate = active?.birthDate ?? "";
  const fullName = active?.fullName ?? "";

  const sheet = useMemo(
    () => (birthDate ? coreSheet(fullName, birthDate) : null),
    [birthDate, fullName],
  );
  const vedic = useMemo(() => {
    if (!birthDate) return null;
    try { return vedicNumerology(birthDate, fullName); } catch { return null; }
  }, [birthDate, fullName]);
  const grid = useMemo(() => {
    if (!birthDate) return null;
    try { return loShuAdvanced(birthDate); } catch { return null; }
  }, [birthDate]);
  const driver = vedic?.mulank ?? null;

  const applied = (kind: AppliedKind, value: string) => analyseNumber(kind, value, driver);

  return (
    <VedicShell
      title="Calculators"
      subtitle={
        birthDate
          ? "Every number below is calculated from the profile you saved, with the method written under it."
          : "Save a profile first, then every calculator here fills itself in."
      }
    >
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-medium transition-colors",
              tab === t
                ? "bg-vnavy text-vsurface"
                : "border border-vline bg-vsurface text-vnavy-soft hover:text-vnavy",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Core numbers" ? (
        sheet ? (
          <>
            {GROUPS.map((g) => (
              <VCard key={g.key} title={g.label}>
                <div className="space-y-3">
                  {sheet.numbers
                    .filter((n) => n.group === g.key)
                    .map((n) => (
                      <article key={n.key} className="rounded-2xl border border-vline bg-vmist p-4">
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
                          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-vgold/50 bg-vgold/15 text-xl font-semibold text-vnavy">
                            {n.value}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-vnavy">{n.label}</h3>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-vgold-deep">{n.planet}</p>
                            <p className="mt-2 text-sm leading-relaxed text-vnavy-soft">{n.how}</p>
                            {n.meaning ? (
                              <p className="mt-2 text-sm leading-relaxed text-vnavy">{n.meaning}</p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              </VCard>
            ))}
            <VCard title="Pinnacles, challenges and debts" hint="The four life stages and the lessons attached to them.">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile label="Pinnacles" value={sheet.pinnacles.join(" · ")} />
                <StatTile label="Challenges" value={sheet.challenges.join(" · ")} />
                <StatTile label="Master numbers" value={sheet.masters.join(", ") || "None"} />
                <StatTile label="Karmic debts" value={sheet.karmicDebts.join(", ") || "None"} />
              </div>
            </VCard>
          </>
        ) : (
          <VCard title="Add a profile to see your core numbers">
            <p className="text-sm text-vnavy-soft">Save a name and birth date on the Profile tab.</p>
          </VCard>

        )
      ) : null}

      {tab === "Name and grid" ? (
        <>
          <VCard title="Name numbers" hint="Chaldean for the name, Pythagorean for the personality layers.">
            {vedic ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile accent label="Name number (Chaldean)" value={vedic.namank ?? "—"} />
                <StatTile label="Driver harmony" value={vedic.harmony.mulankNamank ?? "—"} />
                <StatTile label="Conductor harmony" value={vedic.harmony.bhagyankNamank ?? "—"} />

              </div>
            ) : (
              <p className="text-sm text-vnavy-soft">Save a profile with a name to see this.</p>
            )}
          </VCard>
          <VCard title="Lo Shu grid" hint="Each digit of your birth date placed in its fixed cell. Empty cells are the gaps to work on.">
            {grid ? (
              <div className="grid max-w-sm grid-cols-3 gap-2">
                {[4, 9, 2, 3, 5, 7, 8, 1, 6].map((cell) => {
                  const count = grid.counts[cell] ?? 0;
                  return (
                    <div
                      key={cell}
                      className={cn(
                        "grid aspect-square place-items-center rounded-2xl border text-center",
                        count > 0 ? "border-vgold/50 bg-vgold/12" : "border-dashed border-vline bg-vmist",
                      )}
                    >
                      <span className="text-lg font-semibold text-vnavy">
                        {count > 0 ? String(cell).repeat(count) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-vnavy-soft">Save a profile to see your grid.</p>
            )}
          </VCard>
        </>
      ) : null}

      {(["Mobile", "Vehicle", "House"] as const).map((kind) => {
        if (tab !== kind) return null;
        const value = kind === "Mobile" ? mobile : kind === "Vehicle" ? vehicle : house;
        const set = kind === "Mobile" ? setMobile : kind === "Vehicle" ? setVehicle : setHouse;
        const apiKind: AppliedKind = kind === "Mobile" ? "mobile" : kind === "Vehicle" ? "vehicle" : "house";
        const result = value.trim() ? applied(apiKind, value) : null;
        return (
          <VCard key={kind} title={`${kind} number analysis`} hint="Digits are summed, reduced, and read against your driver number.">
            <label className="block text-xs font-medium uppercase tracking-[0.18em] text-vnavy-soft" htmlFor={`num-${apiKind}`}>
              {kind === "Mobile" ? "Mobile number" : kind === "Vehicle" ? "Vehicle registration" : "House, flat or office number"}
            </label>
            <input
              id={`num-${apiKind}`}
              value={value}
              onChange={(e) => set(e.target.value)}
              inputMode="text"
              placeholder={kind === "Mobile" ? "98765 43210" : kind === "Vehicle" ? "DL 3C AB 1234" : "B 402"}
              className="mt-2 min-h-12 w-full rounded-xl border border-vline bg-vsurface px-4 text-base text-vnavy outline-none focus:border-vgold"
            />
            {result ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <StatTile accent label="Reduced number" value={result.reduced} note={`Total ${result.total}`} />
                  <StatTile label="Ruling planet" value={result.planet} />
                  <StatTile label="Score" value={`${result.score} / 100`} />
                  <StatTile label="With your driver" value={result.relationToOwner ?? "—"} />
                </div>
                <p className="text-sm leading-relaxed text-vnavy">{result.recommendation}</p>
                <div className="space-y-2">
                  {result.energies.map((e) => (
                    <div key={e.label}>
                      <div className="flex items-center justify-between text-xs text-vnavy-soft">
                        <span>{e.label}</span>
                        <span>{e.value}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-vline">
                        <div className="h-full rounded-full bg-vgold" style={{ width: `${e.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="list-none space-y-2 text-sm leading-relaxed text-vnavy-soft">
                  {[...result.suggestions, ...result.remedies].map((s) => (
                    <li key={s} className="rounded-xl border border-vline bg-vmist p-3">{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </VCard>
        );
      })}

      {tab === "Business" ? (
        <VCard title="Business name analysis" hint="Chaldean letter values, read against the founder's driver number.">
          <label className="block text-xs font-medium uppercase tracking-[0.18em] text-vnavy-soft" htmlFor="biz-name">
            Trading name
          </label>
          <input
            id="biz-name"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="Enter the name exactly as it is registered"
            className="mt-2 min-h-12 w-full rounded-xl border border-vline bg-vsurface px-4 text-base text-vnavy outline-none focus:border-vgold"
          />
          {(() => {
            const biz = analyseBusinessName(business, driver);
            if (!biz) return null;
            return (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                  <StatTile accent label="Name number" value={biz.nameNumber} note={`Compound ${biz.compound}`} />
                  <StatTile label="Ruling planet" value={biz.planet} />
                  <StatTile label="Score" value={`${biz.score} / 100`} />
                  <StatTile label="With founder" value={biz.founderRelation ?? "—"} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-vline bg-vmist p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-vgold-deep">Strengths</p>
                    <ul className="mt-2 space-y-1 text-sm text-vnavy-soft">
                      {biz.strength.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-vline bg-vmist p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-vgold-deep">Watch for</p>
                    <ul className="mt-2 space-y-1 text-sm text-vnavy-soft">
                      {biz.weakness.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-vnavy">{biz.launchAdvice}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatTile label="Favourable dates" value={biz.luckyDates.join(", ")} />
                  <StatTile label="Invoice endings" value={biz.luckyInvoiceEndings.join(", ")} />
                  <StatTile label="Account endings" value={biz.luckyAccountEndings.join(", ")} />
                </div>
              </div>
            );
          })()}
        </VCard>
      ) : null}
    </VedicShell>
  );
}
