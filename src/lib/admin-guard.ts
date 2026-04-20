import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

const ADMIN_STEAM_IDS = (process.env.ADMIN_STEAM_IDS ?? "").split(",").filter(Boolean);

export type AdminGuardResult =
  | { ok: true; session: Session; steamId: string }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminGuardResult> {
  const session = await auth();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const steamId = (session.user as { id?: string } | undefined)?.id ?? "";
  if (!ADMIN_STEAM_IDS.includes(steamId)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, session, steamId };
}
