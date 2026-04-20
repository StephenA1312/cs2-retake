import { NextResponse } from "next/server";
import { and, eq, gt, gte, isNotNull, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, vipEvents } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const db = await getDb();
    const now = Math.floor(Date.now() / 1000);
    const weekAgo = now - 7 * 86400;
    const in14d = now + 14 * 86400;

    const [monthly, lifetime, expiring, recentGranted] = await Promise.all([
      db.select({ c: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.vipTier, "monthly"), or(isNull(users.vipExpiresAt), gt(users.vipExpiresAt, now)))),
      db.select({ c: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.vipTier, "lifetime")),
      db.select({ c: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.vipTier, "monthly"), isNotNull(users.vipExpiresAt), gt(users.vipExpiresAt, now), sql`${users.vipExpiresAt} <= ${in14d}`)),
      db.select({ c: sql<number>`count(*)` })
        .from(vipEvents)
        .where(and(eq(vipEvents.eventType, "granted"), gte(vipEvents.createdAt, weekAgo))),
    ]);

    return NextResponse.json({
      activeMonthly: Number(monthly[0]?.c ?? 0),
      activeLifetime: Number(lifetime[0]?.c ?? 0),
      expiringSoon: Number(expiring[0]?.c ?? 0),
      newThisWeek: Number(recentGranted[0]?.c ?? 0),
    });
  } catch (err) {
    console.error("stats/overview error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
