import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { buffer: ArrayBuffer; contentType: string; expires: number }>();

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad protocol");
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const key = url;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return new NextResponse(cached.buffer, {
      headers: { "Content-Type": cached.contentType, "Cache-Control": "public, max-age=86400" },
    });
  }

  try {
    const res = await fetch(url, { headers: { "User-Agent": "Whiterock/1.0" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) throw new Error("not image");
    const buffer = await res.arrayBuffer();
    cache.set(key, { buffer, contentType, expires: Date.now() + 60 * 60 * 1000 });
    // simple LRU cap 50
    if (cache.size > 50) {
      const first = cache.keys().next().value as string;
      cache.delete(first);
    }
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    // fallback 1x1 transparent gif
    const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    return new NextResponse(gif, { headers: { "Content-Type": "image/gif", "Cache-Control": "public, max-age=3600" } });
  }
}
