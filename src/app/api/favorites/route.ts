import { NextRequest, NextResponse } from "next/server";
import { prisma, isDbAvailable } from "@/lib/prisma";

const memFav = new Map<string, Set<string>>();

function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id") ?? "demo-user";
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (await isDbAvailable()) {
    try {
      const favs = await prisma.favorite.findMany({ where: { userId }, include: { property: true } });
      return NextResponse.json(favs);
    } catch {}
  }
  const set = memFav.get(userId) ?? new Set();
  return NextResponse.json(Array.from(set).map((id) => ({ id, propertyId: id, userId })));
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const { propertyId } = (await req.json().catch(() => ({}))) as { propertyId?: string };
  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  if (await isDbAvailable()) {
    try {
      const fav = await prisma.favorite.upsert({
        where: { userId_propertyId: { userId, propertyId } },
        create: { userId, propertyId },
        update: {},
      });
      return NextResponse.json(fav, { status: 201 });
    } catch {}
  }
  const set = memFav.get(userId) ?? new Set();
  set.add(propertyId);
  memFav.set(userId, set);
  return NextResponse.json({ userId, propertyId }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  const id = req.nextUrl.searchParams.get("propertyId") ?? req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  if (await isDbAvailable()) {
    try {
      await prisma.favorite.deleteMany({ where: { userId, propertyId: id } });
      return NextResponse.json({ ok: true });
    } catch {}
  }
  memFav.get(userId)?.delete(id);
  return NextResponse.json({ ok: true });
}
