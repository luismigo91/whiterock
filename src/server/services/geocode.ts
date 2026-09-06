// GeocodeService - Nominatim primary, Google fallback, cache via GeocodeCache or in-memory
import { prisma } from "@/lib/prisma";

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  province?: string;
  municipality?: string;
  postalCode?: string;
  neighborhood?: string;
  provider: string;
  confidence: "high" | "medium" | "low" | "pending";
  approximateLocation: boolean;
};

const memCache = new Map<string, GeocodeResult>();

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function geocode(address: string): Promise<GeocodeResult | null> {
  const normalized = normalizeAddress(address);
  const key = hash(normalized);
  if (memCache.has(key)) return memCache.get(key)!;

  // Try DB cache
  try {
    const cached = await prisma.geocodeCache.findUnique({ where: { normalizedHash: key } });
    if (cached) {
      const r: GeocodeResult = {
        latitude: cached.latitude,
        longitude: cached.longitude,
        province: cached.province ?? undefined,
        municipality: cached.municipality ?? undefined,
        postalCode: cached.postalCode ?? undefined,
        neighborhood: cached.neighborhood ?? undefined,
        provider: cached.provider ?? "cache",
        confidence: cached.confidence as GeocodeResult["confidence"],
        approximateLocation: cached.confidence === "low",
      };
      memCache.set(key, r);
      return r;
    }
  } catch {
    // DB not available
  }

  // Try Nominatim live (with timeout, fail soft)
  try {
    const url = `${process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org"}/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Whiterock/1.0 (contact@whiterock.es)" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        address: Record<string, string>;
        importance?: number;
      }>;
      if (data[0]) {
        const a = data[0].address;
        const result: GeocodeResult = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          province: a.state ?? a.province ?? a.county,
          municipality: a.city ?? a.town ?? a.village ?? a.municipality,
          postalCode: a.postcode,
          neighborhood: a.suburb ?? a.neighbourhood,
          provider: "nominatim",
          confidence: data[0].importance && data[0].importance > 0.6 ? "high" : "medium",
          approximateLocation: false,
        };
        memCache.set(key, result);
        // persist cache async (no await)
        prisma.geocodeCache
          .create({
            data: {
              normalizedHash: key,
              normalizedAddress: normalized,
              latitude: result.latitude,
              longitude: result.longitude,
              province: result.province,
              municipality: result.municipality,
              postalCode: result.postalCode,
              neighborhood: result.neighborhood,
              provider: result.provider,
              confidence: result.confidence as never,
            },
          })
          .catch(() => {});
        return result;
      }
    }
  } catch {
    // fallback
  }

  return null;
}

export function getGeocodeCoverageStats(total: number, geocoded: number) {
  return { total, geocoded, pct: total ? Math.round((geocoded / total) * 100) : 0 };
}
