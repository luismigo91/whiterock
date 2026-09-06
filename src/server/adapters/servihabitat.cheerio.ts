import * as cheerio from "cheerio";
import type { RawListing } from "./types";

export function parseServihabitatHtml(html: string, baseUrl = "https://www.servihabitat.com"): RawListing[] {
  const $ = cheerio.load(html);
  const cards = $(".inmueble");
  if (cards.length === 0) return [];
  return cards
    .map((_, el) => {
      const $el = $(el);
      const externalId = $el.attr("data-ref") || $el.find("a.link").attr("href")?.split("/").pop() || `SHB-${Math.random()}`;
      const title = $el.find("h2").text().trim();
      const priceText = $el.find(".precio").text().replace(/[^\d]/g, "");
      const price = priceText ? parseInt(priceText, 10) : 0;
      const areaText = $el.find(".superficie").text().replace(/[^\d]/g, "");
      const areaM2 = areaText ? parseFloat(areaText) : null;
      const roomsText = $el.find(".habitaciones").text().match(/\d+/);
      const rooms = roomsText ? parseInt(roomsText[0], 10) : null;
      const href = $el.find("a.link").attr("href") || `/es/detalle/${externalId}`;
      const sourceUrl = href.startsWith("http") ? href : baseUrl + href;
      const img = $el.find("img").attr("data-src") || $el.find("img").attr("src") || "";
      const municipio = $el.find(".municipio").text().trim() || "Barcelona";
      return {
        externalId,
        servicer: "servihabitat",
        title,
        price,
        propertyType: "atico",
        addressRaw: municipio,
        province: "Barcelona",
        municipality: municipio,
        areaM2,
        rooms,
        photos: img ? [img] : [],
        sourceUrl,
        rawPayload: { title, price, externalId },
      } as RawListing;
    })
    .get();
}
