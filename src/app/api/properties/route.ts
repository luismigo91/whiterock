import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listProperties } from "@/server/repositories/property";

const querySchema = z.object({
  servicer: z.string().optional(),
  propertyType: z.string().optional(),
  province: z.string().optional(),
  municipality: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  pricePerM2Min: z.coerce.number().optional(),
  pricePerM2Max: z.coerce.number().optional(),
  areaMin: z.coerce.number().optional(),
  areaMax: z.coerce.number().optional(),
  roomsMin: z.coerce.number().optional(),
  bathroomsMin: z.coerce.number().optional(),
  status: z.string().optional(),
  bbox: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["priceAsc", "priceDesc", "newest", "areaDesc", "pricePerM2Asc", "pricePerM2Desc"]).optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(50).optional(),
  includeDelisted: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const q = parsed.data;

  let bbox: [number, number, number, number] | undefined;
  if (q.bbox) {
    const parts = q.bbox.split(",").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
      return NextResponse.json({ error: "bbox must be minLng,minLat,maxLng,maxLat" }, { status: 400 });
    }
    bbox = parts as [number, number, number, number];
  }

  const filters = {
    servicer: q.servicer ? q.servicer.split(",").filter(Boolean) : undefined,
    propertyType: q.propertyType ? q.propertyType.split(",").filter(Boolean) : undefined,
    province: q.province,
    municipality: q.municipality,
    priceMin: q.priceMin,
    priceMax: q.priceMax,
    pricePerM2Min: q.pricePerM2Min,
    pricePerM2Max: q.pricePerM2Max,
    areaMin: q.areaMin,
    areaMax: q.areaMax,
    roomsMin: q.roomsMin,
    bathroomsMin: q.bathroomsMin,
    status: q.status,
    bbox,
    q: q.q,
    sort: q.sort,
    page: q.page,
    pageSize: q.pageSize,
    includeDelisted: q.includeDelisted === "true",
  };

  const t0 = Date.now();
  const { data, total, totalPages } = await listProperties(filters);
  const tookMs = Date.now() - t0;

  const res = NextResponse.json({ data, total, totalPages, page: filters.page ?? 1, pageSize: filters.pageSize ?? 20, tookMs });
  res.headers.set("X-Total-Count", String(total));
  res.headers.set("X-Took-Ms", String(tookMs));
  return res;
}
