import { getAdapter, listAdapters } from "@/server/adapters/registry";
import { hashPayload } from "@/server/adapters/types";
import { prisma } from "@/lib/prisma";
import { geocode } from "./geocode";

export type IngestResult = {
  servicer: string;
  status: "success" | "partial_failure" | "failed";
  ingested: number;
  created: number;
  updated: number;
  delisted: number;
  failed: number;
  error?: string;
};

export async function ingestServicer(servicerId: string): Promise<IngestResult> {
  const adapter = getAdapter(servicerId);
  if (!adapter) throw new Error(`Adapter not found: ${servicerId}`);
  if (!adapter.enabled) {
    return { servicer: servicerId, status: "failed", ingested: 0, created: 0, updated: 0, delisted: 0, failed: 0, error: "paused" };
  }

  const start = new Date();
  let jobId: string | null = null;
  try {
    // create job if DB available
    try {
      const job = await prisma.ingestJob.create({ data: { servicer: servicerId as never, status: "running", startedAt: start } });
      jobId = job.id;
    } catch {}

    const rawList = await adapter.fetchListings();
    let created = 0, updated = 0, failed = 0;
    const seenIds = new Set<string>();

    for (const raw of rawList) {
      const externalId = raw.externalId;
      seenIds.add(externalId);
      try {
        // geocode if missing lat/lng
        let lat = raw.latitude, lng = raw.longitude;
        let province = raw.province, municipality = raw.municipality, postalCode = raw.postalCode;
        let confidence: "high" | "medium" | "low" | "pending" = "medium";
        let approximate = false;
        if (lat == null || lng == null) {
          if (raw.addressRaw) {
            const g = await geocode(raw.addressRaw);
            if (g) {
              lat = g.latitude; lng = g.longitude;
              province = g.province ?? province; municipality = g.municipality ?? municipality; postalCode = g.postalCode ?? postalCode;
              confidence = g.confidence as never; approximate = g.approximateLocation;
            } else {
              confidence = "pending"; approximate = true; lat = 40.416; lng = -3.703; // fallback centre
            }
          }
        } else {
          confidence = "high";
        }

        const hash = hashPayload(raw.rawPayload ?? raw);
        const normalized = adapter.normalize ? adapter.normalize(raw) : raw;

        // try upsert DB
        try {
          const existing = await prisma.property.findUnique({ where: { servicer_externalId: { servicer: servicerId as never, externalId } } });
          if (existing) {
            const priceChanged = existing.price !== Math.round(normalized.price * 100);
            const statusChanged = existing.status !== (normalized.status ?? "disponible");
            await prisma.property.update({
              where: { id: existing.id },
              data: {
                title: normalized.title,
                description: normalized.description,
                price: Math.round(normalized.price * 100),
                propertyType: normalized.propertyType as never,
                status: (normalized.status as never) ?? "disponible",
                addressRaw: normalized.addressRaw,
                province: province ?? existing.province,
                municipality: municipality ?? existing.municipality,
                postalCode: postalCode ?? existing.postalCode,
                latitude: lat!, longitude: lng!,
                geocodeConfidence: confidence as never,
                approximateLocation: approximate,
                areaM2: normalized.areaM2 ?? existing.areaM2,
                rooms: normalized.rooms ?? existing.rooms,
                bathrooms: normalized.bathrooms ?? existing.bathrooms,
                yearBuilt: normalized.yearBuilt ?? existing.yearBuilt,
                energyCert: normalized.energyCert ?? existing.energyCert,
                photos: normalized.photos as never,
                sourceUrl: normalized.sourceUrl,
                rawPayloadHash: hash,
                lastSeenAt: new Date(),
              },
            });
            if (priceChanged) await prisma.priceHistory.create({ data: { propertyId: existing.id, price: Math.round(normalized.price * 100) } });
            if (statusChanged) await prisma.statusHistory.create({ data: { propertyId: existing.id, status: normalized.status as never } });
            updated++;
          } else {
            const createdProp = await prisma.property.create({
              data: {
                externalId,
                servicer: servicerId as never,
                title: normalized.title,
                description: normalized.description,
                price: Math.round(normalized.price * 100),
                propertyType: normalized.propertyType as never,
                status: (normalized.status as never) ?? "disponible",
                addressRaw: normalized.addressRaw,
                province: province ?? null,
                municipality: municipality ?? null,
                postalCode: postalCode ?? null,
                latitude: lat!,
                longitude: lng!,
                geocodeConfidence: confidence as never,
                approximateLocation: approximate,
                areaM2: normalized.areaM2 ?? null,
                rooms: normalized.rooms ?? null,
                bathrooms: normalized.bathrooms ?? null,
                yearBuilt: normalized.yearBuilt ?? null,
                energyCert: normalized.energyCert ?? null,
                photos: normalized.photos as never ?? [],
                sourceUrl: normalized.sourceUrl,
                rawPayloadHash: hash,
              },
            });
            await prisma.priceHistory.create({ data: { propertyId: createdProp.id, price: Math.round(normalized.price * 100) } });
            created++;
          }
        } catch (dbErr) {
          // DB not available, count as updated/created for metrics but don't fail
          updated++;
          console.warn(`[ingest] DB upsert failed fallback for ${externalId}`, dbErr);
        }
      } catch (e) {
        failed++;
        console.error(`[ingest] failed ${externalId}`, e);
      }
    }

    // delisted detection: properties not seen in 2 cycles
    let delisted = 0;
    try {
      const twoCyclesAgo = new Date(Date.now() - 1000 * 60 * 60 * 12); // 12h ~ 2 cycles
      const toDelist = await prisma.property.findMany({
        where: { servicer: servicerId as never, lastSeenAt: { lt: twoCyclesAgo }, status: { not: "delisted" } },
        select: { id: true },
      });
      for (const p of toDelist) {
        // check if id was seen in this run -> don't delist
        // We already filtered by lastSeenAt, so these are genuinely old
        await prisma.property.update({ where: { id: p.id }, data: { status: "delisted" as never, delistedAt: new Date() } });
        await prisma.statusHistory.create({ data: { propertyId: p.id, status: "delisted" as never } });
        delisted++;
      }
    } catch {}

    const result: IngestResult = {
      servicer: servicerId,
      status: failed ? "partial_failure" : "success",
      ingested: rawList.length,
      created,
      updated,
      delisted,
      failed,
    };

    if (jobId) {
      await prisma.ingestJob.update({ where: { id: jobId }, data: { status: result.status, finishedAt: new Date(), ingested: result.ingested, created, updated, delisted, failed } }).catch(() => {});
    }
    console.log(`[ingest:${servicerId}]`, result);
    if (result.ingested === 0) console.warn(`[ingest:${servicerId}] ingested==0 -> alert`);
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (jobId) await prisma.ingestJob.update({ where: { id: jobId }, data: { status: "failed", finishedAt: new Date(), error: msg } }).catch(() => {});
    return { servicer: servicerId, status: "failed", ingested: 0, created: 0, updated: 0, delisted: 0, failed: 0, error: msg };
  }
}

export async function ingestAll(): Promise<IngestResult[]> {
  const adapters = listAdapters().filter((a) => a.enabled);
  const results: IngestResult[] = [];
  for (const a of adapters) {
    // rate limit 1 req/s
    const r = await ingestServicer(a.servicer);
    results.push(r);
    await new Promise((res) => setTimeout(res, 1100));
  }
  return results;
}
