export type RawListing = {
  externalId: string;
  servicer: string;
  title: string;
  description?: string;
  price: number; // euros
  propertyType: string;
  status?: string;
  addressRaw?: string;
  province?: string;
  municipality?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  areaM2?: number | null;
  rooms?: number | null;
  bathrooms?: number | null;
  yearBuilt?: number | null;
  energyCert?: string | null;
  photos?: string[];
  sourceUrl: string;
  rawPayload?: unknown;
};

export interface ServicerAdapter {
  servicer: string;
  displayName: string;
  enabled: boolean;
  fetchListings(): Promise<RawListing[]>;
  fetchDetail?(id: string): Promise<RawListing | null>;
  normalize?(raw: RawListing): RawListing;
}

export function hashPayload(payload: unknown): string {
  const str = JSON.stringify(payload);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return String(h);
}
