import { NextResponse } from "next/server";
import { and, asc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const days = Math.max(1, Math.min(90, Number(url.searchParams.get("days") ?? 14)));
  const now = Math.floor(Date.now() / 1000);
  const until = now + days * 86400;

  try {
    const db = await getDb();
    const rows = await db
      .select({
        steamId: users.steamId,
        steamName: users.steamName,
        vipExpiresAt: users.vipExpiresAt,
        stripeSubscriptionId: users.stripeSubscriptionId,
      })
      .from(users)
      .where(and(
        eq(users.vipTier, "monthly"),
        isNotNull(users.vipExpiresAt),
        gt(users.vipExpiresAt, now),
        sql`${users.vipExpiresAt} <= ${until}`,
      ))
      .orderBy(asc(users.vipExpiresAt));

    return NextResponse.json({ users: rows });
  } catch (err) {
    console.error("stats/expiring error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
