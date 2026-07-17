import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/tarot", changefreq: "daily", priority: "0.9" },
          { path: "/astrology", changefreq: "weekly", priority: "0.9" },
          { path: "/kundli", changefreq: "weekly", priority: "0.8" },
          { path: "/panchang", changefreq: "daily", priority: "0.8" },
          { path: "/horoscope", changefreq: "daily", priority: "0.9" },
          { path: "/numerology", changefreq: "weekly", priority: "0.7" },
          { path: "/compatibility", changefreq: "weekly", priority: "0.7" },
          { path: "/ai", changefreq: "weekly", priority: "0.8" },
          { path: "/learn", changefreq: "weekly", priority: "0.6" },
        ];
        const urls = entries.map(
          (e) =>
            `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
