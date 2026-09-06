import { NextRequest, NextResponse } from "next/server";
import { getPropertyById } from "@/server/repositories/property";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prop = await getPropertyById(id);
  if (!prop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prop);
}
