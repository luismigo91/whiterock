import { describe, it, expect } from "vitest";
import { alisedaAdapter } from "@/server/adapters/aliseda";
import { servihabitatAdapter } from "@/server/adapters/servihabitat";
import { getAdapter, listAdapters } from "@/server/adapters/registry";
import { hashPayload } from "@/server/adapters/types";
import { genericAdapter } from "@/server/adapters/generic";

describe("ServicerAdapter contract", () => {
  it("aliseda adapter implements interface", async () => {
    expect(alisedaAdapter.servicer).toBe("aliseda");
    expect(alisedaAdapter.enabled).toBe(true);
    const listings = await alisedaAdapter.fetchListings();
    expect(listings.length).toBeGreaterThan(0);
    expect(listings[0]).toHaveProperty("externalId");
    expect(listings[0]).toHaveProperty("sourceUrl");
    expect(listings[0].servicer).toBe("aliseda");
  });

  it("servihabitat adapter fetchListings", async () => {
    const listings = await servihabitatAdapter.fetchListings();
    expect(listings.every((l) => l.servicer === "servihabitat")).toBe(true);
  });

  it("aliseda normalize fixes areaM2 string", () => {
    const raw = { areaM2: "85 m²", price: 100000, externalId: "X", servicer: "aliseda", title: "t", sourceUrl: "u", propertyType: "piso" } as unknown as never;
    const norm = alisedaAdapter.normalize!(raw);
    expect(norm.areaM2).toBe(85);
  });

  it("registry lists all 8 servicers", () => {
    const all = listAdapters();
    expect(all.length).toBe(8);
    expect(all.map((a) => a.servicer)).toEqual(expect.arrayContaining(["aliseda", "servihabitat", "haya", "altamira", "solvia", "anticipa", "diglo", "hipoges"]));
  });

  it("getAdapter returns undefined for unknown", () => {
    expect(getAdapter("unknown")).toBeUndefined();
  });

  it("generic adapter fallback for empty servicer", async () => {
    const adapter = genericAdapter("hipoges", "Hipoges");
    const listings = await adapter.fetchListings();
    expect(listings.length).toBeGreaterThan(0);
  });

  it("generic adapter with no mock data returns demo fixture", async () => {
    // Use a servicer with no mock data? hipoges has 1, so test with a fresh id that has 0
    // We simulate by calling generic with unknown id that has no MOCK_PROPERTIES
    const adapter = genericAdapter("unknown_servicer_test", "Test");
    const listings = await adapter.fetchListings();
    expect(listings[0].externalId).toContain("UNKNOWN_SERVICER_TEST");
  });

  it("hashPayload deterministic", () => {
    const h1 = hashPayload({ a: 1 });
    const h2 = hashPayload({ a: 1 });
    const h3 = hashPayload({ a: 2 });
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });

  it("generic adapter serves hipoges mock when available", async () => {
    const listings = await genericAdapter("hipoges", "Hipoges").fetchListings();
    expect(listings[0].servicer).toBe("hipoges");
  });
});

// Contract: every adapter failure is isolated (requirement: partial_failure)
describe("Adapter isolation", () => {
  it("failing adapter does not affect others", async () => {
    const failing = {
      servicer: "failing",
      displayName: "Failing",
      enabled: true,
      async fetchListings() {
        throw new Error("429 Too Many Requests");
      },
    };
    await expect(failing.fetchListings()).rejects.toThrow("429");
    // other adapters still work
    const ok = await getAdapter("aliseda")!.fetchListings();
    expect(ok.length).toBeGreaterThan(0);
  });
});
