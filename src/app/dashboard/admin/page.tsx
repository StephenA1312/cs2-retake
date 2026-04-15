"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [steamId, setSteamId] = useState("");
  const [tier, setTier] = useState<"monthly" | "lifetime" | "free">("monthly");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const res = await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetSteamId: steamId.trim(),
        vipTier: tier,
        vipExpiresAt: tier !== "lifetime" && tier !== "free" ? expiresAt : null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setStatus({ type: "success", msg: `VIP ${tier} granted to ${steamId.trim()}` });
      setSteamId("");
      setTier("monthly");
      setExpiresAt("");
    } else {
      setStatus({ type: "error", msg: data.error ?? "Failed to grant VIP" });
    }
  }

  if (!session) {
    router.push("/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-heading text-sm font-bold tracking-wider">
            <span className="text-primary">RET</span>AKES
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-heading text-2xl font-bold mb-1">Admin Panel</h1>
        <p className="text-xs text-muted-foreground mb-8">Grant or revoke VIP subscriptions manually</p>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-card border border-border">
          {/* Steam ID */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Steam ID
            </label>
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="e.g. 76561198012345678"
              required
              className="w-full bg-muted border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Tier */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              VIP Tier
            </label>
            <div className="flex gap-3">
              {(["monthly", "lifetime", "free"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`flex-1 px-4 py-2 text-xs font-medium border transition-colors ${
                    tier === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Expiration (only for monthly) */}
          {tier === "monthly" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Expires At
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-muted border border-border px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to default to 1 month from now
              </p>
            </div>
          )}

          {status && (
            <div
              className={`px-4 py-3 text-xs font-medium ${
                status.type === "success"
                  ? "bg-primary/10 border border-primary/20 text-primary"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              {status.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {loading ? "Granting..." : "Grant VIP"}
          </button>
        </form>
      </main>
    </div>
  );
}