// Client-side image compression: resize + re-encode to WebP via canvas.
// Keeps SVG/GIF untouched. Skips work when file is already small enough.

export type CompressOpts = {
  maxWidth: number;
  maxHeight: number;
  quality?: number; // 0..1
  mime?: "image/webp" | "image/jpeg";
  /** If file is under this size and within dims, skip re-encoding. */
  skipIfUnder?: number;
};

const PASSTHROUGH = /^image\/(svg\+xml|gif)$/i;

export async function compressImage(file: File, opts: CompressOpts): Promise<File> {
  if (PASSTHROUGH.test(file.type)) return file;
  if (!file.type.startsWith("image/")) return file;

  const mime = opts.mime ?? "image/webp";
  const quality = opts.quality ?? 0.85;

  const bitmap = await loadBitmap(file);
  const { width: sw, height: sh } = bitmap;

  const scale = Math.min(1, opts.maxWidth / sw, opts.maxHeight / sh);
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const alreadySmall =
    opts.skipIfUnder != null &&
    file.size <= opts.skipIfUnder &&
    scale === 1 &&
    file.type === mime;
  if (alreadySmall) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap.source, 0, 0, dw, dh);
  bitmap.close();

  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob((b) => res(b), mime, quality),
  );
  if (!blob) return file;

  // Only keep the re-encode if it actually saves bytes; otherwise return original.
  if (blob.size >= file.size && scale === 1) return file;

  const ext = mime === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${ext}`, { type: mime, lastModified: Date.now() });
}

type LoadedBitmap = { width: number; height: number; source: CanvasImageSource; close: () => void };

async function loadBitmap(file: File): Promise<LoadedBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      return { width: bmp.width, height: bmp.height, source: bmp, close: () => bmp.close?.() };
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = url;
  });
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    source: img,
    close: () => URL.revokeObjectURL(url),
  };
}

export const PRESETS = {
  logo: { maxWidth: 512, maxHeight: 512, quality: 0.92, skipIfUnder: 40 * 1024 },
  background: { maxWidth: 2048, maxHeight: 2048, quality: 0.82, skipIfUnder: 300 * 1024 },
  card: { maxWidth: 900, maxHeight: 1500, quality: 0.85, skipIfUnder: 120 * 1024 },
} satisfies Record<string, CompressOpts>;
