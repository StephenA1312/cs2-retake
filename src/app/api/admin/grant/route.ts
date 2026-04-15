import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";

const ADMIN_STEAM_IDS = (process.env.ADMIN_STEAM_IDS ?? "").split(",").filter(Boolean);

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steamId = (session.user as any)?.id ?? "";
  if (!ADMIN_STEAM_IDS.includes(steamId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

    await db
      .insert(users)
      .values({
        steamId: targetSteamId,
        vipTier: vipTier === "free" ? null : vipTier,
        vipExpiresAt: expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.steamId,
        set: {
          vipTier: vipTier === "free" ? null : vipTier,
          vipExpiresAt: expiresAt,
          updatedAt: now,
        },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin grant error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}