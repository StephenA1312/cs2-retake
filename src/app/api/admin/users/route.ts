import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { isNotNull, asc } from "drizzle-orm";

const ADMIN_STEAM_IDS = (process.env.ADMIN_STEAM_IDS ?? "").split(",").filter(Boolean);

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steamId = (session.user as any)?.id ?? "";
  if (!ADMIN_STEAM_IDS.includes(steamId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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