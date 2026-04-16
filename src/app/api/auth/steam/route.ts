import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    return new Response("NEXTAUTH_URL not configured", { status: 500 });
  }

  const steamUrl = new URL("https://steamcommunity.com/openid/login");
  steamUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  steamUrl.searchParams.set("openid.mode", "checkid_setup");
  steamUrl.searchParams.set(
    "openid.return_to",
    `${baseUrl}/api/auth/steam/callback`
  );
  steamUrl.searchParams.set("openid.realm", baseUrl);
  steamUrl.searchParams.set(
    "openid.identity",
    "http://specs.openid.net/auth/2.0/identifier_select"
  );
  steamUrl.searchParams.set(
    "openid.claimed_id",
    "http://specs.openid.net/auth/2.0/identifier_select"
  );

  return Response.redirect(steamUrl.toString());
}
