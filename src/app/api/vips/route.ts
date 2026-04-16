import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.VIP_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const now = Math.floor(Date.now() / 1000);

    const vipUsers = await db
      .select({ steamId: users.steamId })
      .from(users)
      .where(
        sql`${users.vipTier} IS NOT NULL AND (${users.vipTier} = 'lifetime' OR ${users.vipExpiresAt} > ${now})`
      );

    return NextResponse.json({
      vips: vipUsers.map((u) => u.steamId),
    });
  } catch (err) {
    console.error("VIP list error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
