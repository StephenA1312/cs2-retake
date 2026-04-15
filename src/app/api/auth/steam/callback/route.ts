import { type NextRequest } from "next/server";
import { createSteamToken } from "@/lib/steam-token";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Verify the OpenID assertion with Steam
  const verifyParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("openid.")) verifyParams.set(key, value);
  }
  verifyParams.set("openid.mode", "check_authentication");

  const verifyRes = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });
  const verifyText = await verifyRes.text();

  if (!verifyText.includes("is_valid:true")) {
    return Response.redirect(
      new URL("/signin?error=SteamVerificationFailed", request.url)
    );
  }

  const claimedId = searchParams.get("openid.claimed_id") ?? "";
  const steamId = claimedId.split("/id/")[1];
  if (!steamId) {
    return Response.redirect(
      new URL("/signin?error=InvalidSteamId", request.url)
    );
  }

  // Issue a short-lived signed token and hand off to the client-side sign-in
  const token = await createSteamToken(steamId);
  return Response.redirect(
    new URL(`/auth/complete?token=${encodeURIComponent(token)}`, request.url)
  );
}
