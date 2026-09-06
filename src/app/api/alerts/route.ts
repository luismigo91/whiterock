import { NextRequest, NextResponse } from "next/server";
import { prisma, isDbAvailable } from "@/lib/prisma";

function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id") ?? "demo-user";
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (await isDbAvailable()) {
    try {
      const alerts = await prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50, include: { property: true } });
      return NextResponse.json(alerts);
    } catch {}
  }
  return NextResponse.json([]);
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req);
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (await isDbAvailable()) {
    try {
      await prisma.alert.updateMany({ where: { id, userId }, data: { isRead: true } });
      return NextResponse.json({ ok: true });
    } catch {}
  }
  return NextResponse.json({ ok: true });
}
