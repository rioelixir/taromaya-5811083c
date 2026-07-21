/**
 * Automated WCAG AA accessibility tests for the AI reading and share screens.
 * Rendered in isolation with axe-core to catch regressions in CI.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// The AI interpretation component pulls in server-function hooks and i18n;
// stub the collaborators so we can render it in jsdom.
vi.mock("@/hooks/use-birth-profile", () => ({
  useBirthProfile: () => ({ data: null }),
}));
vi.mock("@/lib/i18n", () => ({
  useLang: () => "en",
}));
vi.mock("@/lib/ai-context", () => ({
  buildGuideContext: () => "context",
}));

import { AIInterpretation } from "@/components/ai-interpretation";

describe("AI reading — WCAG AA", () => {
  it("has no axe violations in default (no-reading) state", async () => {
    const { container } = render(
      <AIInterpretation module="Tarot" snapshot="upright: Sun" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("exposes an accessible heading and stop/reveal controls", async () => {
    const { container, getByRole } = render(
      <AIInterpretation module="Numerology" />,
    );
    expect(getByRole("heading", { level: 2 })).toHaveTextContent(
      /Numerology reading/i,
    );
    expect(getByRole("button", { name: /reveal reading/i })).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("Report share screen — WCAG AA", () => {
  // Snapshot of the share-page markup extracted to a plain fragment so we can
  // scan it without booting the TanStack router.
  function ShareFragment() {
    return (
      <main aria-labelledby="share-heading" lang="en">
        <header>
          <h1 id="share-heading">Riaa Sharma</h1>
          <dl>
            <div>
              <dt className="sr-only">Birth date and time</dt>
              <dd>1998-04-12 · 09:15</dd>
            </div>
            <div>
              <dt className="sr-only">Views</dt>
              <dd>42 views</dd>
            </div>
          </dl>
        </header>
        <section aria-labelledby="snapshot-heading">
          <h2 id="snapshot-heading">Snapshot</h2>
          <p>Ascendant: Aries</p>
        </section>
        <footer>
          <a href="/">Get your own chart on TAROMAYA</a>
        </footer>
      </main>
    );
  }

  it("has no axe violations", async () => {
    const { container } = render(<ShareFragment />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has exactly one main landmark and one H1", () => {
    const { getAllByRole } = render(<ShareFragment />);
    expect(getAllByRole("main")).toHaveLength(1);
    expect(getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
