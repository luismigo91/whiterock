import type { ServicerAdapter, RawListing } from "./types";
import { MOCK_PROPERTIES } from "@/lib/mockData";

export const alisedaAdapter: ServicerAdapter = {
  servicer: "aliseda",
  displayName: "Aliseda (Santander)",
  enabled: true,
  async fetchListings(): Promise<RawListing[]> {
    // TODO: implement real scraping against https://www.alisedainmobiliaria.com
    // For now return mock filtered data to keep contract testable
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
    // Normalize superficie "85 m²" etc — example of 4.4 requirement
    if (typeof raw.areaM2 === "string") {
      const n = parseFloat((raw.areaM2 as unknown as string).replace(/[^\d.]/g, ""));
      raw.areaM2 = isNaN(n) ? null : n;
    }
    return raw;
  },
};
