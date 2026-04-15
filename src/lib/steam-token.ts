const TTL_MS = 2 * 60 * 1000; // 2 minutes

async function hmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Creates a signed, short-lived token encoding the verified Steam ID. */
export async function createSteamToken(steamId: string): Promise<string> {
  const expiry = Date.now() + TTL_MS;
  const payload = `${steamId}:${expiry}`;
  const sig = await hmac(process.env.NEXTAUTH_SECRET!, payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

/** Returns the Steam ID if the token is valid and unexpired, otherwise null. */
export async function verifySteamToken(token: string): Promise<string | null> {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const colonIdx = payload.indexOf(":");
    const steamId = payload.slice(0, colonIdx);
    const expiry = parseInt(payload.slice(colonIdx + 1), 10);
    if (!steamId || isNaN(expiry) || Date.now() > expiry) return null;
    const expectedSig = await hmac(process.env.NEXTAUTH_SECRET!, payload);
    // Constant-time comparison
    if (sig.length !== expectedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    return diff === 0 ? steamId : null;
  } catch {
    return null;
  }
}
