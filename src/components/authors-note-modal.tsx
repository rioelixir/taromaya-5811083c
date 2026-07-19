import { useEffect, useState } from "react";
import { X } from "lucide-react";
import authorsNote from "@/assets/authors-note.jpeg.asset.json";

const STORAGE_KEY = "taromaya:authors-note:seen";

export function AuthorsNoteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative max-w-lg w-full glass rounded-3xl overflow-hidden gold-border shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 rounded-full bg-black/40 hover:bg-black/60 p-2 text-pearl"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="max-h-[85dvh] overflow-y-auto">
          <img
            src={authorsNote.url}
            alt="Author's Note — TAROMAYA"
            className="w-full h-auto block"
          />
        </div>
        <div className="p-4 flex justify-center bg-black/20 border-t border-white/10">
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-gold to-gold-soft text-cosmic font-medium px-6 py-2 text-sm"
          >
            Enter TAROMAYA
          </button>
        </div>
      </div>
    </div>
  );
}

export function markAuthorsNoteSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

export function hasSeenAuthorsNote() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Call right before a fresh signup so the modal shows on next mount. */
export function queueAuthorsNote() {
  try {
    localStorage.setItem("taromaya:authors-note:pending", "1");
  } catch {}
}

export function consumeAuthorsNotePending() {
  try {
    const v = localStorage.getItem("taromaya:authors-note:pending");
    if (v) localStorage.removeItem("taromaya:authors-note:pending");
    return v === "1";
  } catch {
    return false;
  }
}
