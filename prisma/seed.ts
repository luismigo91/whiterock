import { PrismaClient } from "@prisma/client";
import { MOCK_PROPERTIES } from "../src/lib/mockData";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding", MOCK_PROPERTIES.length, "properties");
  for (const p of MOCK_PROPERTIES) {
    await prisma.property.upsert({
      where: { servicer_externalId: { servicer: p.servicer as never, externalId: p.externalId } },
      update: {},
      create: {
        id: p.id,
        externalId: p.externalId,
        servicer: p.servicer as never,
        title: p.title,
        description: p.description,
        price: Math.round(p.price * 100),
        propertyType: p.propertyType as never,
        status: p.status as never,
        addressRaw: p.addressRaw,
        addressNormalized: p.addressNormalized,
        province: p.province,
        municipality: p.municipality,
        postalCode: p.postalCode,
        latitude: p.latitude,
        longitude: p.longitude,
        geocodeConfidence: p.geocodeConfidence as never,
        approximateLocation: p.approximateLocation,
        areaM2: p.areaM2,
        rooms: p.rooms,
        bathrooms: p.bathrooms,
        yearBuilt: p.yearBuilt,
        energyCert: p.energyCert,
        photos: p.photos as never,
        sourceUrl: p.sourceUrl,
        lastSeenAt: new Date(p.lastSeenAt),
      },
    });
  }
  console.log("Seed done");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
