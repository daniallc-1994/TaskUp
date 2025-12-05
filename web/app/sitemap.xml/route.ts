import { NextResponse } from "next/server";

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://taskup.no";
  const urls = ["/", "/how-it-works", "/pricing", "/features", "/auth/login", "/auth/signup", "/dashboard", "/tasks", "/wallet", "/messages", "/legal/terms", "/legal/privacy", "/legal/cookies", "/legal/disputes"];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `<url><loc>${base}${u}</loc></url>`)
    .join("\n")}\n</urlset>`;
  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
