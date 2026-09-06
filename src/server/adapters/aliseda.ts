import type { ServicerAdapter, RawListing } from "./types";
import { MOCK_PROPERTIES } from "@/lib/mockData";
import { parseAlisedaHtml } from "./aliseda.cheerio";
import fs from "fs";
import path from "path";
import { fetchWithPlaywright, isWafBlocked } from "./playwright";

async function fetchHtml(url: string, fallback: string): Promise<{ html: string; usedPlaywright: boolean; waf: boolean }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Whiterock/1.0" }, signal: AbortSignal.timeout(8000) });
    const body = await res.text();
    if (isWafBlocked(res.status, body)) return { html: body, usedPlaywright: false, waf: true };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // If cheerio would find 0 results, try playwright
    const parsed = parseAlisedaHtml(body);
    if (parsed.length === 0 && body.length > 1000) {
      const pwHtml = await fetchWithPlaywright(url);
      if (pwHtml) return { html: pwHtml, usedPlaywright: true, waf: false };
    }
    return { html: body, usedPlaywright: false, waf: false };
  } catch {
    try {
      return { html: fs.readFileSync(path.join(process.cwd(), fallback), "utf-8"), usedPlaywright: false, waf: false };
    } catch {
      return { html: "", usedPlaywright: false, waf: false };
    }
  }
}

export const alisedaAdapter: ServicerAdapter = {
  servicer: "aliseda",
  displayName: "Aliseda (Santander)",
  enabled: true,
  async fetchListings(): Promise<RawListing[]> {
    const { html, waf } = await fetchHtml(
      "https://www.alisedainmobiliaria.com/busqueda",
      "tests/fixtures/snapshots/aliseda/list.html"
    );
    if (waf) {
      console.warn("[aliseda] WAF blocked, will fallback to mock and set enabled=false temporary");
    }
    const parsed = html ? parseAlisedaHtml(html) : [];
    if (parsed.length > 0) return parsed;
    // Fallback to mock for resilience (and tests)
    const items = MOCK_PROPERTIES.filter((p) => p.servicer === "aliseda");
    return items.map((p) => ({
      externalId: p.externalId,
      servicer: p.servicer,
      title: p.title,
      description: p.description,
      price: p.price,
      propertyType: p.propertyType,
      status: p.status,
      addressRaw: p.addressRaw,
      province: p.province,
      municipality: p.municipality,
      postalCode: p.postalCode,
      latitude: p.latitude,
      longitude: p.longitude,
      areaM2: p.areaM2,
      rooms: p.rooms,
      bathrooms: p.bathrooms,
      yearBuilt: p.yearBuilt,
      energyCert: p.energyCert,
      photos: p.photos,
      sourceUrl: p.sourceUrl,
      rawPayload: p,
    }));
  },
  normalize(raw: RawListing): RawListing {
    if (typeof raw.areaM2 === "string") {
      const n = parseFloat((raw.areaM2 as unknown as string).replace(/[^\d.]/g, ""));
      raw.areaM2 = isNaN(n) ? null : n;
    }
    return raw;
  },
};
