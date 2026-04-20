import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { isNotNull, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const db = await getDb();
    const allUsers = await db
      .select({
        steamId: users.steamId,
        steamName: users.steamName,
        vipTier: users.vipTier,
        vipExpiresAt: users.vipExpiresAt,
        updatedAt: users.updatedAt,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users)
      .where(isNotNull(users.vipTier))
      .orderBy(asc(users.vipExpiresAt))

    return NextResponse.json({ users: allUsers });
  } catch (err) {
    console.error("Admin list error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}