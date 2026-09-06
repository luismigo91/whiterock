import { describe, it, expect, vi } from "vitest";
import { listProperties } from "@/server/repositories/property";

vi.mock("@/lib/prisma", async () => {
  const actual = await vi.importActual<typeof import("@/lib/prisma")>("@/lib/prisma");
  return { ...actual, isDbAvailable: vi.fn().mockResolvedValue(false), prisma: actual.prisma };
});

describe("V3 pricePerM2", () => {
  it("filtra por pricePerM2Max (gangas)", async () => {
    const { data } = await listProperties({ pricePerM2Max: 1000, pageSize: 50 });
    expect(data.every((p) => (p as unknown as { pricePerM2: number | null }).pricePerM2 !== null && (p as unknown as { pricePerM2: number }).pricePerM2 <= 1000)).toBe(true);
  });

  it("sort pricePerM2Asc ordena gangas primero", async () => {
    const { data } = await listProperties({ sort: "pricePerM2Asc", pageSize: 50 });
    const ppms = data.map((p) => (p as unknown as { pricePerM2: number | null }).pricePerM2).filter((v) => v !== null) as number[];
    for (let i = 1; i < ppms.length; i++) expect(ppms[i - 1]).toBeLessThanOrEqual(ppms[i]);
  });

  it("pricePerM2 null cuando areaM2 null", async () => {
    const { data } = await listProperties({ pageSize: 50 });
    const withoutArea = data.find((p) => p.areaM2 === null);
    if (withoutArea) expect((withoutArea as unknown as { pricePerM2: number | null }).pricePerM2).toBeNull();
  });
});

describe("V3 image proxy", () => {
  it("GET /api/image?url= devuelve image/* con cache header", async () => {
    // mock fetch for upstream image
    const origFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (k: string) => (k === "content-type" ? "image/jpeg" : null) },
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    } as unknown as Response);

    const { GET } = await import("@/app/api/image/route");
    const req = { nextUrl: { searchParams: new URLSearchParams({ url: "https://picsum.photos/seed/wh1/800/600" }) } } as unknown as import("next/server").NextRequest;
    const res = await GET(req);
    expect(res.headers.get("Content-Type")).toMatch(/image\//);
    expect(res.headers.get("Cache-Control")).toMatch(/max-age=86400/);

    global.fetch = origFetch;
  });

  it("400 sin url", async () => {
    const { GET } = await import("@/app/api/image/route");
    const req = { nextUrl: { searchParams: new URLSearchParams({}) } } as unknown as import("next/server").NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
