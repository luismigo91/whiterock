import type { ServicerAdapter, RawListing } from "./types";
import { MOCK_PROPERTIES } from "@/lib/mockData";

export function genericAdapter(servicer: string, displayName: string): ServicerAdapter {
  return {
    servicer,
    displayName,
    enabled: true,
    async fetchListings(): Promise<RawListing[]> {
      // Stub: returns mock data filtered by servicer (for demo)
      const items = MOCK_PROPERTIES.filter((p) => p.servicer === servicer);
      if (items.length) {
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
      }
      // Fallback generic fixture
      return [
        {
          externalId: `${servicer.toUpperCase()}-DEMO-1`,
          servicer,
          title: `Piso demo ${displayName}`,
          description: `Inmueble de ejemplo para ${displayName}`,
          price: 99000,
          propertyType: "piso",
          status: "disponible",
          addressRaw: "Calle Ejemplo 1, Madrid",
          province: "Madrid",
          municipality: "Madrid",
          postalCode: "28001",
          latitude: 40.416 + Math.random() * 0.1 - 0.05,
          longitude: -3.703 + Math.random() * 0.1 - 0.05,
          areaM2: 75,
          rooms: 3,
          bathrooms: 1,
          photos: ["https://picsum.photos/seed/" + servicer + "/800/600"],
          sourceUrl: `https://example.com/${servicer}/demo-1`,
        },
      ];
    },
  };
}
