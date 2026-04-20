import { NextResponse } from "next/server";
import { gte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { vipEvents } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 30)));
  const now = Math.floor(Date.now() / 1000);
  // Build buckets aligned to UTC day boundaries and include the current day.
  const startOfToday = Math.floor(now / 86400) * 86400;
  const since = startOfToday - (days - 1) * 86400;

  try {
    const db = await getDb();
    const rows = await db
      .select({
        date: sql<string>`date(${vipEvents.createdAt}, 'unixepoch')`,
        eventType: vipEvents.eventType,
        count: sql<number>`count(*)`,
      })
      .from(vipEvents)
      .where(gte(vipEvents.createdAt, since))
      .groupBy(sql`date(${vipEvents.createdAt}, 'unixepoch')`, vipEvents.eventType);

    const byDate = new Map<string, { date: string; granted: number; revoked: number; renewed: number; expired: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date((since + i * 86400) * 1000).toISOString().slice(0, 10);
      byDate.set(d, { date: d, granted: 0, revoked: 0, renewed: 0, expired: 0 });
    }
    for (const r of rows) {
      const bucket = byDate.get(r.date);
      if (!bucket) continue;
      const k = r.eventType as "granted" | "revoked" | "renewed" | "expired";
      if (k in bucket) bucket[k] = Number(r.count);
    }

    return NextResponse.json({ series: Array.from(byDate.values()) });
  } catch (err) {
    console.error("stats/timeseries error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
