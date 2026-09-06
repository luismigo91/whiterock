import type { ServicerAdapter, RawListing } from "./types";
import { MOCK_PROPERTIES } from "@/lib/mockData";
export const solviaAdapter: ServicerAdapter = {
  servicer: "solvia",
  displayName: "Solvia (Sabadell)",
  enabled: true,
  async fetchListings(): Promise<RawListing[]> {
    const items = MOCK_PROPERTIES.filter((p) => p.servicer === "solvia");
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
