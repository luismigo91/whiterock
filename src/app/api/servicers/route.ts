import { NextResponse } from "next/server";
import { listServicers } from "@/server/repositories/property";

export async function GET() {
  const servicers = await listServicers();
  return NextResponse.json(servicers);
}
