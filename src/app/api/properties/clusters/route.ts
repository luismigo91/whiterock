import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listProperties } from "@/server/repositories/property";
import { buildIndex, getClusters } from "@/server/services/cluster";

const qs = z.object({
  bbox: z.string(),
  zoom: z.coerce.number().min(0).max(22).default(6),
});

export async function GET(req: NextRequest) {
  const parsed = qs.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const parts = parsed.data.bbox.split(",").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return NextResponse.json({ error: "bbox must be minLng,minLat,maxLng,maxLat" }, { status: 400 });
  const bbox = parts as [number, number, number, number];

  const t0 = Date.now();
  // Reuse repository to get filtered by bbox but without pagination limit for clustering
  const { data } = await listProperties({ bbox, pageSize: 50, page: 1 }); // For demo we cluster only first 50 in viewport; for >500 we need full fetch (mock fallback handles)
  // If real DB, we would fetch all within bbox (limit 5000)
  // Build index on the fly (could be cached)
  const { MOCK_PROPERTIES } = await import("@/lib/mockData");
  const all = MOCK_PROPERTIES.filter((p) => {
    return p.longitude >= bbox[0] && p.longitude <= bbox[2] && p.latitude >= bbox[1] && p.latitude <= bbox[3];
  });
  buildIndex(all);
  const clusters = getClusters(bbox, parsed.data.zoom);

  const res = NextResponse.json({ type: "FeatureCollection", features: clusters });
  res.headers.set("X-Total-Count", String(all.length));
  res.headers.set("X-Took-Ms", String(Date.now() - t0));
  return res;
}
