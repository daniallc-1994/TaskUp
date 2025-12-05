import { NextResponse } from "next/server";

export function GET() {
  const body = `User-agent: *\nAllow: /\nSitemap: ${process.env.NEXT_PUBLIC_SITE_URL || "https://taskup.no"}/sitemap.xml\n`;
  return new NextResponse(body, { headers: { "Content-Type": "text/plain" } });
}
