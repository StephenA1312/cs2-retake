import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users, vipEvents } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { targetSteamId, vipTier, vipExpiresAt } = await request.json();
  if (!targetSteamId || !vipTier) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!["monthly", "lifetime", "free"].includes(vipTier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt =
      vipTier === "lifetime" || vipTier === "free"
        ? null
        : vipExpiresAt
          ? Math.floor(new Date(vipExpiresAt).getTime() / 1000)
          : null;

    const newTier = vipTier === "free" ? null : vipTier;

    await db
      .insert(users)
      .values({
        steamId: targetSteamId,
        vipTier: newTier,
        vipExpiresAt: expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.steamId,
        set: {
          vipTier: newTier,
          vipExpiresAt: expiresAt,
          updatedAt: now,
        },
      });

    await db.insert(vipEvents).values({
      steamId: targetSteamId,
      eventType: newTier ? "granted" : "revoked",
      tier: newTier,
      source: "admin",
      createdAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin grant error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}