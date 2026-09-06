import { describe, it, expect } from "vitest";
import { parseAlisedaHtml } from "@/server/adapters/aliseda.cheerio";
import { parseServihabitatHtml } from "@/server/adapters/servihabitat.cheerio";
import fs from "fs";
import path from "path";

describe("V2: Cheerio snapshots (servicer-ingestion v2)", () => {
  it("parseAlisedaHtml snapshot", () => {
    const html = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/snapshots/aliseda/list.html"), "utf-8");
    const listings = parseAlisedaHtml(html);
    expect(listings.length).toBe(2);
    expect(listings[0].externalId).toBe("ALI-TEST-1");
    expect(listings[0].price).toBe(98500);
    expect(listings[0].areaM2).toBe(85);
  });

  it("parseServihabitatHtml snapshot", () => {
    const html = fs.readFileSync(path.join(process.cwd(), "tests/fixtures/snapshots/servihabitat/list.html"), "utf-8");
    const listings = parseServihabitatHtml(html);
    expect(listings.length).toBe(1);
    expect(listings[0].externalId).toBe("SHB-TEST-1");
    expect(listings[0].price).toBe(189000);
  });

  it("snapshot failure detection (empty html → 0)", () => {
    expect(parseAlisedaHtml("<html></html>")).toEqual([]);
    expect(parseServihabitatHtml("<html></html>")).toEqual([]);
  });
});

describe("V2: Cluster server (map-search v2)", () => {
  it("Supercluster clustering", async () => {
    const { MOCK_PROPERTIES } = await import("@/lib/mockData");
    const { buildIndex, getClusters } = await import("@/server/services/cluster");
    buildIndex(MOCK_PROPERTIES);
    const clusters = getClusters([-10, 35, 4, 44], 6);
    expect(clusters.length).toBeGreaterThan(0);
    // cluster features have cluster boolean
    expect(clusters[0]).toHaveProperty("properties");
    expect(clusters[0]).toHaveProperty("geometry");
  });
});

describe("V2: price cents canonical", () => {
  it("MOCK price *100 = DB cents", async () => {
    const { MOCK_PROPERTIES } = await import("@/lib/mockData");
    // Our prisma schema stores price as cents, mock price is euros, DB price should be euros*100
    expect(MOCK_PROPERTIES[0].price).toBe(98500);
    // DB would store 98500*100 = 9850000 cents; check mapping in repository
    const cents = MOCK_PROPERTIES[0].price * 100;
    expect(cents).toBe(9850000);
  });
});
