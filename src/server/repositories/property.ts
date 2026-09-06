import { MOCK_PROPERTIES, type MockProperty } from "@/lib/mockData";
import { prisma, isDbAvailable } from "@/lib/prisma";

export type PropertyFilters = {
  servicer?: string[];
  propertyType?: string[];
  province?: string;
  municipality?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  roomsMin?: number;
  bathroomsMin?: number;
  status?: string;
  bbox?: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
  q?: string;
  sort?: "priceAsc" | "priceDesc" | "newest" | "areaDesc";
  page?: number;
  pageSize?: number;
  includeDelisted?: boolean;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesMock(p: MockProperty, f: PropertyFilters): boolean {
  if (!f.includeDelisted && p.status === "delisted") return false;
  if (f.servicer?.length && !f.servicer.includes(p.servicer)) return false;
  if (f.propertyType?.length && !f.propertyType.includes(p.propertyType)) return false;
  if (f.province && normalize(p.province) !== normalize(f.province)) return false;
  if (f.municipality && normalize(p.municipality) !== normalize(f.municipality)) return false;
  if (f.priceMin !== undefined && p.price < f.priceMin) return false;
  if (f.priceMax !== undefined && p.price > f.priceMax) return false;
  if (f.areaMin !== undefined && (p.areaM2 ?? 0) < f.areaMin) return false;
  if (f.areaMax !== undefined && (p.areaM2 ?? 999999) > f.areaMax) return false;
  if (f.roomsMin !== undefined && (p.rooms ?? 0) < f.roomsMin) return false;
  if (f.bathroomsMin !== undefined && (p.bathrooms ?? 0) < f.bathroomsMin) return false;
  if (f.status && p.status !== f.status) return false;
  if (f.bbox) {
    const [minLng, minLat, maxLng, maxLat] = f.bbox;
    if (p.longitude < minLng || p.longitude > maxLng || p.latitude < minLat || p.latitude > maxLat) return false;
  }
  if (f.q) {
    const q = normalize(f.q);
    const hay = normalize(`${p.title} ${p.description} ${p.municipality} ${p.province} ${p.addressRaw}`);
    if (!hay.includes(q)) return false;
  }
  return true;
}

export async function listProperties(filters: PropertyFilters): Promise<{ data: MockProperty[]; total: number; totalPages: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));

  // Try DB first, fallback to mock
  const dbAvailable = await isDbAvailable();
  if (dbAvailable) {
    try {
      const where: Record<string, unknown> = {};
      if (filters.servicer?.length) where.servicer = { in: filters.servicer };
      if (filters.propertyType?.length) where.propertyType = { in: filters.propertyType };
      if (filters.province) where.province = { equals: filters.province, mode: "insensitive" };
      if (filters.municipality) where.municipality = { equals: filters.municipality, mode: "insensitive" };
      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        where.price = {};
        if (filters.priceMin !== undefined) (where.price as Record<string, unknown>).gte = filters.priceMin * 100; // DB stores cents
        if (filters.priceMax !== undefined) (where.price as Record<string, unknown>).lte = filters.priceMax * 100;
      }
      if (filters.bbox) {
        const [minLng, minLat, maxLng, maxLat] = filters.bbox;
        where.longitude = { gte: minLng, lte: maxLng };
        where.latitude = { gte: minLat, lte: maxLat };
      }
      if (!filters.includeDelisted) where.status = { not: "delisted" };
      else if (filters.status) where.status = filters.status;

      // q search handled post-filter for simplicity (could use full-text)
      const orderBy: Record<string,string> =
        filters.sort === "priceAsc" ? { price: "asc" } :
        filters.sort === "priceDesc" ? { price: "desc" } :
        filters.sort === "areaDesc" ? { areaM2: "desc" } :
        { createdAt: "desc" };

      const [total, rows] = await Promise.all([
        prisma.property.count({ where: where as never }),
        prisma.property.findMany({
          where: where as never,
          orderBy: orderBy as never,
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: { priceHistory: { orderBy: { date: "asc" } }, statusHistory: { orderBy: { date: "asc" } } },
        }),
      ]);

      // Map DB rows to MockProperty shape for API consistency
      const data = (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
        id: r.id as string,
        externalId: r.externalId as string,
        servicer: r.servicer as string,
        title: r.title as string,
        description: (r.description as string) ?? "",
        price: Math.round((r.price as number) / 100),
        propertyType: r.propertyType as string,
        status: r.status as string,
        addressRaw: (r.addressRaw as string) ?? "",
        addressNormalized: (r.addressNormalized as string) ?? "",
        province: (r.province as string) ?? "",
        municipality: (r.municipality as string) ?? "",
        postalCode: (r.postalCode as string) ?? "",
        latitude: r.latitude as number,
        longitude: r.longitude as number,
        geocodeConfidence: (r.geocodeConfidence as string) as MockProperty["geocodeConfidence"],
        approximateLocation: r.approximateLocation as boolean,
        areaM2: r.areaM2 as number | null,
        rooms: r.rooms as number | null,
        bathrooms: r.bathrooms as number | null,
        yearBuilt: r.yearBuilt as number | null,
        energyCert: r.energyCert as string | null,
        photos: (r.photos as string[]) ?? [],
        sourceUrl: r.sourceUrl as string,
        lastSeenAt: (r.lastSeenAt as Date).toISOString(),
        createdAt: (r.createdAt as Date).toISOString(),
      })) as MockProperty[];

      // Apply q + area/rooms filters post-DB if needed
      let filtered = data;
      if (filters.q || filters.areaMin !== undefined || filters.areaMax !== undefined || filters.roomsMin !== undefined || filters.bathroomsMin !== undefined) {
        filtered = data.filter((p) => matchesMock(p, { ...filters, page: 1, pageSize: 1000, bbox: undefined }));
        // re-paginate after filter (inefficient but OK for fallback)
        return { data: filtered.slice(0, pageSize), total: filtered.length, totalPages: Math.ceil(filtered.length / pageSize) };
      }

      return { data, total, totalPages: Math.ceil(total / pageSize) };
    } catch (e) {
      console.warn("[propertyRepo] DB error, fallback to mock", e);
    }
  }

  // Mock path
  let filtered = MOCK_PROPERTIES.filter((p) => matchesMock(p, filters));
  // sort
  if (filters.sort === "priceAsc") filtered = filtered.sort((a, b) => a.price - b.price);
  else if (filters.sort === "priceDesc") filtered = filtered.sort((a, b) => b.price - a.price);
  else if (filters.sort === "areaDesc") filtered = filtered.sort((a, b) => (b.areaM2 ?? 0) - (a.areaM2 ?? 0));
  else filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const data = filtered.slice((page - 1) * pageSize, page * pageSize);
  return { data, total, totalPages };
}

export async function getPropertyById(id: string): Promise<MockProperty | null> {
  const dbAvailable = await isDbAvailable();
  if (dbAvailable) {
    try {
      const row = await prisma.property.findUnique({
        where: { id },
        include: { priceHistory: { orderBy: { date: "asc" } }, statusHistory: { orderBy: { date: "asc" } } },
      });
      if (row) {
        return {
          id: row.id,
          externalId: row.externalId,
          servicer: row.servicer,
          title: row.title,
          description: row.description ?? "",
          price: Math.round(row.price / 100),
          propertyType: row.propertyType,
          status: row.status,
          addressRaw: row.addressRaw ?? "",
          addressNormalized: row.addressNormalized ?? "",
          province: row.province ?? "",
          municipality: row.municipality ?? "",
          postalCode: row.postalCode ?? "",
          latitude: row.latitude,
          longitude: row.longitude,
          geocodeConfidence: row.geocodeConfidence as MockProperty["geocodeConfidence"],
          approximateLocation: row.approximateLocation,
          areaM2: row.areaM2,
          rooms: row.rooms,
          bathrooms: row.bathrooms,
          yearBuilt: row.yearBuilt,
          energyCert: row.energyCert,
          photos: row.photos as string[],
          sourceUrl: row.sourceUrl,
          lastSeenAt: row.lastSeenAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
        } as unknown as MockProperty & { priceHistory: unknown; statusHistory: unknown };
      }
    } catch {}
  }
  return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
}

export async function listServicers() {
  const dbAvailable = await isDbAvailable();
  if (dbAvailable) {
    try {
      const counts = await prisma.property.groupBy({ by: ["servicer"], _count: true, where: { status: { not: "delisted" } } });
      const lastJobs = await prisma.ingestJob.groupBy({ by: ["servicer"], _max: { finishedAt: true } });
      const mapCounts = new Map(counts.map((c) => [c.servicer, c._count]));
      const mapJobs = new Map(lastJobs.map((j) => [j.servicer, j._max.finishedAt]));
      return SERVICER_LIST.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        enabled: true,
        totalListings: mapCounts.get(s.id as never) ?? 0,
        lastIngestAt: mapJobs.get(s.id as never)?.toISOString() ?? null,
      }));
    } catch {}
  }
  // mock counts
  const counts = MOCK_PROPERTIES.reduce<Record<string, number>>((acc, p) => {
    acc[p.servicer] = (acc[p.servicer] ?? 0) + 1;
    return acc;
  }, {});
  return SERVICER_LIST.map((s) => ({
    id: s.id,
    displayName: s.displayName,
    enabled: true,
    totalListings: counts[s.id] ?? 0,
    lastIngestAt: new Date().toISOString(),
  }));
}

const SERVICER_LIST = [
  { id: "aliseda", displayName: "Aliseda (Santander)" },
  { id: "servihabitat", displayName: "Servihabitat (CaixaBank)" },
  { id: "haya", displayName: "Haya Real Estate" },
  { id: "altamira", displayName: "Altamira / doValue" },
  { id: "solvia", displayName: "Solvia (Sabadell)" },
  { id: "anticipa", displayName: "Anticipa" },
  { id: "diglo", displayName: "Diglo (Ibercaja)" },
  { id: "hipoges", displayName: "Hipoges" },
];
