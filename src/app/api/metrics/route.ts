import { NextResponse } from "next/server";
import { prisma, isDbAvailable } from "@/lib/prisma";

export async function GET() {
  const lines: string[] = [];
  lines.push("# HELP whiterock_properties_total Total properties by servicer");
  lines.push("# TYPE whiterock_properties_total gauge");
  try {
    if (await isDbAvailable()) {
      const counts = await prisma.property.groupBy({ by: ["servicer"], _count: true });
      for (const c of counts) lines.push(`whiterock_properties_total{servicer="${c.servicer}"} ${c._count}`);
      const jobs = await prisma.ingestJob.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
      lines.push("# HELP whiterock_ingest_total Ingest jobs");
      lines.push("# TYPE whiterock_ingest_total counter");
      for (const j of jobs) lines.push(`whiterock_ingest_total{servicer="${j.servicer}",status="${j.status}"} ${j.ingested}`);
    } else {
      // fallback mock
      const { MOCK_PROPERTIES } = await import("@/lib/mockData");
      const counts: Record<string, number> = {};
      for (const p of MOCK_PROPERTIES) counts[p.servicer] = (counts[p.servicer] ?? 0) + 1;
      for (const [s, n] of Object.entries(counts)) lines.push(`whiterock_properties_total{servicer="${s}"} ${n}`);
    }
  } catch {}
  lines.push("# HELP whiterock_geocode_cache_hit_total Geocode cache hits");
  lines.push("# TYPE whiterock_geocode_cache_hit_total counter");
  lines.push("whiterock_geocode_cache_hit_total 0");
  return new NextResponse(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; version=0.0.4" } });
}
