import { NextResponse } from "next/server";
import { isDbAvailable } from "@/lib/prisma";

export async function GET() {
  const dbUp = await isDbAvailable();
  const redisUp = process.env.REDIS_URL ? "unknown" : "disabled";
  const status = dbUp ? "ok" : "degraded";
  const code = dbUp ? 200 : 503;
  return NextResponse.json(
    { status, db: dbUp ? "up" : "down", redis: redisUp, version: process.env.npm_package_version ?? "0.1.0", timestamp: new Date().toISOString() },
    { status: code }
  );
}
