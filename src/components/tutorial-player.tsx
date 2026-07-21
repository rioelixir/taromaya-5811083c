// Fullscreen-capable tutorial video player. Muted on load (no sound
// autoplay), keyboard controls, captions, replay, skip.

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Maximize2, SkipForward, Captions } from "lucide-react";
import type { Tutorial } from "@/lib/tutorials.functions";

function isEmbed(url: string): boolean {
  return /youtube\.com\/embed|player\.vimeo\.com|youtu\.be/i.test(url);
}

export function TutorialPlayer({ tutorial, onNext }: { tutorial: Tutorial; onNext?: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cc, setCc] = useState(true);

  useEffect(() => {
    // Reset on tutorial change; never autoplay with sound.
    setPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
    }
  }, [tutorial.id]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.muted = false; v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };
  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0; v.play(); setPlaying(true);
  };
  const fullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const embed = isEmbed(tutorial.video_url);

  return (
    <div ref={wrapRef} className="glass-card overflow-hidden">
      <div className="relative aspect-video w-full bg-black">
        {embed ? (
          <iframe
            title={tutorial.title}
            src={tutorial.video_url + (tutorial.video_url.includes("?") ? "&" : "?") + "rel=0&modestbranding=1"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
            loading="lazy"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full"
            src={tutorial.video_url}
            poster={tutorial.poster_url ?? undefined}
            playsInline
            controls
            muted
            preload="metadata"
            aria-label={tutorial.title}
          >
            {tutorial.captions_url && cc && (
              <track
                kind="captions"
                srcLang={tutorial.language === "hi" || tutorial.language === "hi-roman" ? "hi" : "en"}
                src={tutorial.captions_url}
                label={tutorial.language === "hi" ? "हिन्दी" : tutorial.language === "hi-roman" ? "Roman Hindi" : "English"}
                default
              />
            )}
          </video>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">{tutorial.title}</h3>
          {tutorial.description && <p className="truncate text-xs text-muted-foreground">{tutorial.description}</p>}
        </div>
        {!embed && (
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-ghost inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5">
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button onClick={replay} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5">
              <RotateCcw className="h-3 w-3" /> Replay
            </button>
            {tutorial.captions_url && (
              <button
                onClick={() => setCc((v) => !v)}
                aria-pressed={cc}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${cc ? "bg-primary/20 border-primary/40" : "border-white/10 hover:bg-white/5"}`}
              >
                <Captions className="h-3 w-3" /> CC
              </button>
            )}
            <button onClick={fullscreen} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5">
              <Maximize2 className="h-3 w-3" /> Fullscreen
            </button>
            {onNext && (
              <button onClick={onNext} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/5">
                <SkipForward className="h-3 w-3" /> Skip
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
