// Download any inline SVG chart as a PNG image.
import { useRef, useState, type ReactNode } from "react";
import { Download } from "lucide-react";

export function ChartExport({ children, filename = "chart" }: { children: ReactNode; filename?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      const vb = (svg.getAttribute("viewBox") ?? "0 0 640 640").split(/\s+/).map(Number);
      const w = (vb[2] || 640) * 2;
      const h = (vb[3] || 640) * 2;
      clone.setAttribute("width", String(w));
      clone.setAttribute("height", String(h));
      clone.setAttribute("style", "background:#0b0a12;color:#f5e9cf");
      const xml = new XMLSerializer().serializeToString(clone);
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("render failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#0b0a12";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${filename.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {children}
      <button
        type="button"
        onClick={download}
        disabled={busy}
        aria-label="Download this chart as an image"
        className="absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-background/70 text-primary backdrop-blur transition hover:bg-primary/15 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
