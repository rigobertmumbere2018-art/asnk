import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://asnk-scouts-nord-kivu.rigobertmumbere2018.workers.dev";

const ROUTES = [
  "/", "/mouvement", "/actualites", "/evenements", "/districts",
  "/galerie", "/documents", "/contact", "/auth", "/inscription",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...ROUTES.map((p) => `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`),
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});