import { NextRequest, NextResponse } from "next/server";
import { ingestServicer, ingestAll } from "@/server/services/ingest";
import { getAdapter } from "@/server/adapters/registry";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ servicer: string }> }) {
  const { servicer } = await params;
  if (servicer === "all") {
    const results = await ingestAll();
    return NextResponse.json({ results });
  }
  const adapter = getAdapter(servicer);
  if (!adapter) return NextResponse.json({ error: `Unknown servicer: ${servicer}` }, { status: 404 });
  const result = await ingestServicer(servicer);
  return NextResponse.json(result);
}
