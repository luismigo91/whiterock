import { NextRequest, NextResponse } from "next/server";
import { ingestAll } from "@/server/services/ingest";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Allow without secret in dev
  const results = await ingestAll();
  // Also evaluate alerts (fire and forget)
  try {
    const { MOCK_PROPERTIES } = await import("@/lib/mockData");
    // In real impl, evaluateAlerts() would compare against SavedSearch; here we just log
    console.log("[cron] ingest done", results.map((r) => `${r.servicer}:${r.ingested}`).join(","));
  } catch {}
  return NextResponse.json({ ok: true, results });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
