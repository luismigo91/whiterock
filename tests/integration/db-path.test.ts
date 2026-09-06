import { describe, it, expect, vi } from "vitest";

type DbRow = {
  id: string;
  externalId: string;
  servicer: string;
  title: string;
  description: string;
  price: number; // cents
  propertyType: string;
  status: string;
  addressRaw: string;
  addressNormalized: string;
  province: string;
  municipality: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  geocodeConfidence: string;
  approximateLocation: boolean;
  areaM2: number | null;
  rooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  energyCert: string | null;
  photos: string[];
  sourceUrl: string;
  lastSeenAt: Date;
  createdAt: Date;
};

function row(partial: Partial<DbRow> & { id: string }): DbRow {
  const i = Number(partial.id.replace(/\D/g, "") || 0);
  return {
    externalId: `EXT-${partial.id}`,
    servicer: "aliseda",
    title: `Piso ${partial.id} Madrid`,
    description: "desc",
    price: 100000 * 100,
    propertyType: "piso",
    status: "disponible",
    addressRaw: "Calle Ejemplo 1, Madrid",
    addressNormalized: "Calle Ejemplo 1, Madrid",
    province: "Madrid",
    municipality: "Madrid",
    postalCode: "28001",
    latitude: 40.416,
    longitude: -3.703,
    geocodeConfidence: "high",
    approximateLocation: false,
    areaM2: 100,
    rooms: 3,
    bathrooms: 1,
    yearBuilt: 2000,
    energyCert: "E",
    photos: [],
    sourceUrl: "https://example.com",
    lastSeenAt: new Date("2026-09-06T12:00:00Z"),
    createdAt: new Date(Date.UTC(2026, 0, i || 1)),
    ...partial,
  };
}

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", async () => {
  const actual = await vi.importActual<typeof import("@/lib/prisma")>("@/lib/prisma");
  return {
    ...actual,
    isDbAvailable: vi.fn().mockResolvedValue(true),
    prisma: { ...(actual.prisma as object), property: { findMany } },
  };
});

import { listProperties } from "@/server/repositories/property";

describe("DB path: paginación y sort globales", () => {
  it("page=2 con filtro q respeta el offset", async () => {
    findMany.mockResolvedValue([1, 2, 3, 4, 5, 6].map((n) => row({ id: `p${n}` })));
    const { data, total, totalPages } = await listProperties({ q: "piso", page: 2, pageSize: 2 });
    // newest first → p6,p5 | p4,p3 | p2,p1
    expect(total).toBe(6);
    expect(totalPages).toBe(3);
    expect(data.map((d) => d.id)).toEqual(["p4", "p3"]);
  });

  it("pricePerM2Desc ordena por €/m², no por precio", async () => {
    findMany.mockResolvedValue([
      row({ id: "a", price: 100000 * 100, areaM2: 100 }), // ppm 1000
      row({ id: "b", price: 90000 * 100, areaM2: 50 }), // ppm 1800
      row({ id: "c", price: 120000 * 100, areaM2: 200 }), // ppm 600
    ]);
    const { data } = await listProperties({ sort: "pricePerM2Desc", pageSize: 10 });
    expect(data.map((d) => d.id)).toEqual(["b", "a", "c"]);
  });
});
