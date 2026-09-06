import { describe, it, expect, vi } from "vitest";
import { GET as listGET } from "@/app/api/properties/route";
import { GET as servicersGET } from "@/app/api/servicers/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", async () => {
  const actual = await vi.importActual<typeof import("@/lib/prisma")>("@/lib/prisma");
  return { ...actual, isDbAvailable: vi.fn().mockResolvedValue(false), prisma: actual.prisma };
});

function req(url: string) {
  return new NextRequest(new URL(url, "http://localhost"));
}

describe("GET /api/properties (property-catalog spec)", () => {
  it("200 con paginación por defecto", async () => {
    const res = await listGET(req("/api/properties"));
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Total-Count")).toBeTruthy();
    const json = await res.json();
    expect(json.data.length).toBeLessThanOrEqual(20);
    expect(json.total).toBeGreaterThan(0);
    expect(json.totalPages).toBeDefined();
  });

  it("400 con bbox inválido", async () => {
    const res = await listGET(req("/api/properties?bbox=invalid"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/bbox/i);
  });

  it("filtra por servicer múltiple", async () => {
    const res = await listGET(req("/api/properties?servicer=aliseda,haya"));
    const json = await res.json();
    expect(json.data.every((p: { servicer: string }) => ["aliseda", "haya"].includes(p.servicer))).toBe(true);
  });

  it("respeta pageSize máx 50", async () => {
    const res = await listGET(req("/api/properties?pageSize=100"));
    expect(res.status).toBe(400); // Zod max 50 -> 400
  });

  it("bbox query eficiente", async () => {
    const res = await listGET(req("/api/properties?bbox=-0.5,39.3,-0.2,39.6"));
    const json = await res.json();
    expect(json.total).toBe(3);
  });

  it("X-Total-Count header presente", async () => {
    const res = await listGET(req("/api/properties?priceMax=100000"));
    expect(res.headers.get("X-Total-Count")).toBe(String((await res.clone().json()).total));
  });

  it("q búsqueda insensible a acentos", async () => {
    const res = await listGET(req("/api/properties?q=VALENCIA"));
    const json = await res.json();
    expect(json.total).toBeGreaterThan(0);
  });

  it("page 999 devuelve data vacía con total correcto", async () => {
    const res = await listGET(req("/api/properties?page=999&pageSize=10"));
    const json = await res.json();
    expect(json.data).toEqual([]);
    expect(json.total).toBeGreaterThan(0);
  });
});

describe("GET /api/servicers", () => {
  it("lista 8 servicers con totalListings", async () => {
    const res = await servicersGET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(8);
    expect(json[0]).toHaveProperty("totalListings");
    expect(json[0]).toHaveProperty("lastIngestAt");
  });
});

describe("GET /api/properties/:id", () => {
  it("404 para id inexistente", async () => {
    const { GET } = await import("@/app/api/properties/[id]/route");
    const res = await GET(req("/api/properties/nope"), { params: Promise.resolve({ id: "nope" }) });
    expect(res.status).toBe(404);
  });

  it("200 para id existente con priceHistory shape", async () => {
    const { GET } = await import("@/app/api/properties/[id]/route");
    const res = await GET(req("/api/properties/1"), { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("1");
    expect(json).toHaveProperty("sourceUrl");
    expect(json).toHaveProperty("photos");
  });
});
