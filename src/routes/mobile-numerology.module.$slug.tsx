import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Compass, ListChecks, Sigma } from "lucide-react";
import { MnCard, MnPill, Reveal } from "@/components/mobile-num/mn-kit";
import { MN_MODULES, mnModule } from "@/lib/mobile-num/modules";

export const Route = createFileRoute("/mobile-numerology/module/$slug")({
  loader: ({ params }) => {
    const mod = mnModule(params.slug);
    if (!mod) throw notFound();
    return { mod };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Module unavailable — Mobile Numerology" }, { name: "robots", content: "noindex" }] };
    }
    const { mod } = loaderData;
    const title = `${mod.title} — Mobile Numerology`;
    return {
      meta: [
        { title },
        { name: "description", content: mod.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: mod.blurb },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: ModuleMissing,
  component: ModuleDetail,
});

function ModuleDetail() {
  const { mod } = Route.useLoaderData();
  const index = MN_MODULES.findIndex((m) => m.slug === mod.slug);
  const next = MN_MODULES[(index + 1) % MN_MODULES.length]!;

  return (
    <div className="min-h-dvh bg-mnbg text-mnink">
      <div className="mn-wash px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14">
        <div className="mx-auto w-full max-w-3xl">
          <Link
            to="/mobile-numerology"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-mnindigo"
          >
            <ArrowLeft className="h-4 w-4" /> All modules
          </Link>
          <div className="mt-6">
            <MnPill>Module {String(index + 1).padStart(2, "0")}</MnPill>
          </div>
          <h1 className="mt-4 text-[30px] font-semibold leading-tight tracking-tight text-mnink sm:text-[42px]">
            {mod.title}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-mnink-soft">{mod.blurb}</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-3xl gap-4 px-5 pb-20 sm:px-8">
        <Reveal>
          <MnCard>
            <Head icon={ListChecks} text="What this module reads" />
            <ul className="mt-4 space-y-2.5">
              {mod.reads.map((r) => (
                <li key={r} className="flex gap-3 text-sm leading-relaxed text-mnink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mngold" />
                  {r}
                </li>
              ))}
            </ul>
          </MnCard>
        </Reveal>

        <Reveal delay={80}>
          <MnCard>
            <Head icon={Sigma} text="How it is calculated" />
            <ol className="mt-4 space-y-3">
              {mod.method.map((m, i) => (
                <li key={m} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mnindigo/10 text-[11px] font-semibold text-mnindigo">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-mnink-soft">{m}</p>
                </li>
              ))}
            </ol>
          </MnCard>
        </Reveal>

        <Reveal delay={140}>
          <MnCard className="border-mnindigo/25 bg-mnindigo/5">
            <Head icon={Compass} text="When to rely on it" />
            <p className="mt-3 text-sm leading-relaxed text-mnink">{mod.useIt}</p>
          </MnCard>
        </Reveal>

        <Reveal delay={200}>
          <Link
            to="/mobile-numerology/module/$slug"
            params={{ slug: next.slug }}
            className="mncard group flex items-center justify-between gap-4 p-5"
          >
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-mnink-soft">
                Next module
              </span>
              <span className="mt-1 block text-[15px] font-semibold text-mnink">{next.title}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-mnindigo transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </div>
  );
}

function Head({ icon: Icon, text }: { icon: typeof Sigma; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-mnindigo" />
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-mnink">{text}</h2>
    </div>
  );
}

function ModuleMissing() {
  return (
    <div className="grid min-h-dvh place-items-center bg-mnbg px-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-mnink">This module does not exist</h1>
        <p className="mt-2 text-sm text-mnink-soft">Pick one from the list instead.</p>
        <Link
          to="/mobile-numerology"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-mnindigo"
        >
          <ArrowLeft className="h-4 w-4" /> All modules
        </Link>
      </div>
    </div>
  );
}
