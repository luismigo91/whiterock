import type { ServicerAdapter, RawListing } from "./types";
import { MOCK_PROPERTIES } from "@/lib/mockData";
import { parseServihabitatHtml } from "./servihabitat.cheerio";
import fs from "fs";
import path from "path";

async function fetchHtml(url: string, fallback: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Whiterock/1.0" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (html.includes("captcha")) throw new Error("WAF captcha");
    return html;
  } catch {
    try {
      return fs.readFileSync(path.join(process.cwd(), fallback), "utf-8");
    } catch {
      return "";
    }
  }
}

export const servihabitatAdapter: ServicerAdapter = {
  servicer: "servihabitat",
  displayName: "Servihabitat (CaixaBank)",
  enabled: true,
  async fetchListings(): Promise<RawListing[]> {
    const html = await fetchHtml("https://www.servihabitat.com/es/busqueda", "tests/fixtures/snapshots/servihabitat/list.html");
    const parsed = html ? parseServihabitatHtml(html) : [];
    if (parsed.length > 0) return parsed;
    const items = MOCK_PROPERTIES.filter((p) => p.servicer === "servihabitat");
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
};
