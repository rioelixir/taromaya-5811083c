import { useState, useRef, useEffect, type ReactNode } from "react";
import { Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ChartZoomProps {
  children: ReactNode;
  label?: string;
}

/**
 * Wraps any chart/SVG and provides a full-screen zoom overlay with
 * pinch/scroll zoom and pan support.
 */
export function ChartZoom({ children, label = "Chart" }: ChartZoomProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const draggingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 6));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
      if (e.key === "0") { setScale(1); setTx(0); setTy(0); }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const reset = () => { setScale(1); setTx(0); setTy(0); };

  return (
    <>
      <div className="relative group">
        {children}
        <button
          type="button"
          aria-label={`Open ${label} in full screen`}
          onClick={() => { reset(); setOpen(true); }}
          className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/70 text-white px-3 py-1.5 text-xs font-semibold shadow-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Full Screen
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${label} full screen`}
          className="fixed inset-0 z-[9999] bg-white flex flex-col"
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            setScale((s) => Math.min(6, Math.max(0.5, s + delta)));
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <span className="text-gray-900 font-semibold">{label}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900" aria-label="Zoom out"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-gray-900 text-xs w-12 text-center font-semibold">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale((s) => Math.min(6, s + 0.25))} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900" aria-label="Zoom in"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={reset} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900" aria-label="Reset zoom"><RotateCcw className="w-4 h-4" /></button>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full bg-gray-900 hover:bg-black text-white" aria-label="Close full screen"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div
            className="flex-1 overflow-hidden touch-none select-none"
            onPointerDown={(e) => {
              draggingRef.current = { x: e.clientX - tx, y: e.clientY - ty };
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!draggingRef.current) return;
              setTx(e.clientX - draggingRef.current.x);
              setTy(e.clientY - draggingRef.current.y);
            }}
            onPointerUp={() => { draggingRef.current = null; }}
            onDoubleClick={reset}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75"
              style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "center center" }}
            >
              <div className="[&_svg]:!w-auto [&_svg]:!h-auto [&_svg]:max-w-[92vw] [&_svg]:max-h-[82vh]">
                {children}
              </div>
            </div>
          </div>
          <div className="px-4 py-2 text-center text-white/60 text-xs border-t border-white/10">
            Drag to pan • Scroll or +/- to zoom • Double-click to reset • Esc to close
          </div>
        </div>
      )}
    </>
  );
}
