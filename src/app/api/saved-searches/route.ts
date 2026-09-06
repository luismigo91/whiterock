import { NextRequest, NextResponse } from "next/server";
import { prisma, isDbAvailable } from "@/lib/prisma";

// In-memory fallback for demo without auth/db
const memStore = new Map<string, { id: string; userId: string; name: string; filters: unknown; createdAt: string }[]>();

function getUserId(req: NextRequest): string | null {
  // Mock auth: use header x-user-id or fallback to anonymous
  return req.headers.get("x-user-id") ?? req.cookies.get("next-auth.session-token")?.value ?? "demo-user";
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (await isDbAvailable()) {
    try {
      const items = await prisma.savedSearch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
      return NextResponse.json(items);
    } catch {}
  }
  return NextResponse.json(memStore.get(userId) ?? []);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { name, filters } = body as { name?: string; filters?: unknown };
  if (!name || !filters) return NextResponse.json({ error: "name and filters required" }, { status: 400 });

  if (await isDbAvailable()) {
    try {
      const created = await prisma.savedSearch.create({ data: { userId, name, filters: filters as never } });
      return NextResponse.json(created, { status: 201 });
    } catch {}
  }
  const id = `ss-${Date.now()}`;
  const item = { id, userId, name, filters, createdAt: new Date().toISOString() };
  const arr = memStore.get(userId) ?? [];
  arr.unshift(item);
  memStore.set(userId, arr);
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (await isDbAvailable()) {
    try {
      await prisma.savedSearch.deleteMany({ where: { id, userId } });
      return NextResponse.json({ ok: true });
    } catch {}
  }
  const arr = memStore.get(userId) ?? [];
  memStore.set(userId, arr.filter((x) => x.id !== id));
  return NextResponse.json({ ok: true });
}
