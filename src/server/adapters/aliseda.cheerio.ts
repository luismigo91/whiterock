import * as cheerio from "cheerio";
import type { RawListing } from "./types";

export function parseAlisedaHtml(html: string, baseUrl = "https://www.alisedainmobiliaria.com"): RawListing[] {
  const $ = cheerio.load(html);
  const cards = $(".property-card");
  if (cards.length === 0) return [];
  const listings: RawListing[] = [];
  cards.each((_, el) => {
    const $el = $(el);
    const externalId = $el.attr("data-id") || $el.find("a").attr("href")?.split("/").pop() || `ALI-${Math.random()}`;
    const title = $el.find("h3").text().trim() || "Piso Aliseda";
    const priceText = $el.find(".price").text().replace(/[^\d]/g, "");
    const price = priceText ? parseInt(priceText, 10) : 0;
    const areaText = $el.find(".area").text().replace(/[^\d]/g, "");
    const areaM2 = areaText ? parseFloat(areaText) : null;
    const roomsText = $el.find(".rooms").text().match(/\d+/);
    const rooms = roomsText ? parseInt(roomsText[0], 10) : null;
    const href = $el.find("a").attr("href") || `/detalle/${externalId}`;
    const sourceUrl = href.startsWith("http") ? href : baseUrl + href;
    const img = $el.find("img").attr("src") || $el.find("img").attr("data-src") || "";
    const addressRaw = $el.find(".address").text().trim() || "Madrid";
    listings.push({
      externalId,
      servicer: "aliseda",
      title,
      price,
      propertyType: "piso",
      addressRaw,
      province: addressRaw.includes("Madrid") ? "Madrid" : undefined,
      municipality: addressRaw.split(",").pop()?.trim(),
      areaM2,
      rooms,
      photos: img ? [img] : [],
      sourceUrl,
      rawPayload: { title, price, externalId },
    });
  });
  return listings;
}
