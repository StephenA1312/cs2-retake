import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Image from "next/image";
import SignOutButton from "./SignOutButton";
import CopyIpButton from "./CopyIpButton";

const SERVER_IP = "play.403.com";
const DISCORD_URL = "https://discord.gg/ejBw3fXHZe";

const IconCrown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const IconDiscord = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const IconServer = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <line x1="6" x2="6.01" y1="6" y2="6" />
    <line x1="6" x2="6.01" y1="18" y2="18" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ADMIN_STEAM_IDS = (process.env.ADMIN_STEAM_IDS ?? "").split(",").filter(Boolean);

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const user = session.user as { id?: string; name?: string | null; image?: string | null };
  const isAdmin = ADMIN_STEAM_IDS.includes(user.id ?? "");

  const db = await getDb();
  const dbUser = await db.select().from(users).where(eq(users.steamId, user.id ?? "")).get();

  const hasVip = dbUser?.vipTier != null;
  const isCanceling = hasVip && dbUser?.vipExpiresAt != null;
  const periodEnd = dbUser?.vipExpiresAt ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-heading text-sm font-bold tracking-wider">
            <span className="text-primary">RET</span>AKES
          </a>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 bg-card border border-border">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Avatar"}
              width={72}
              height={72}
              className="rounded-none border border-border"
              unoptimized
            />
          ) : (
            <div className="size-[72px] bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <IconUser />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-heading text-xl font-bold truncate">
              {user.name ?? "Steam User"}
            </p>
            {user.id && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Steam ID: {user.id}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {hasVip ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 text-xs text-primary font-heading">
                  <IconCrown />
                  VIP {(dbUser?.vipTier ?? "monthly").toUpperCase()}{isCanceling ? " · CANCELING" : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted border border-border text-xs text-muted-foreground font-heading">
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  FREE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Grid: Server + VIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Server Info */}
          <div className="p-6 bg-card border border-border space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <IconServer />
              <span className="font-heading text-sm font-bold">Server</span>
            </div>
            <div className="space-y-2">
              {[
                ["Address", SERVER_IP],
                ["Location", "Dallas, TX"],
                ["Tickrate", "64-tick"],
                ["Mode", "Retake"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* VIP — adapts to subscription state */}
          <div className={`p-6 bg-card border space-y-4 ${hasVip ? "border-primary/30" : "border-border"}`}>
            <div className="flex items-center gap-2 text-primary">
              <IconCrown />
              <span className="font-heading text-sm font-bold">VIP Membership</span>
            </div>

            {hasVip ? (
              <>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">VIP {dbUser?.vipTier === "lifetime" ? "Lifetime" : "Monthly"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {isCanceling ? "Access until" : "Renews"}
                    </span>
                    <span className="font-medium">{periodEnd ? formatDate(periodEnd) : "—"}</span>
                  </div>
                  {isCanceling && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-yellow-500 font-medium">Canceling</span>
                    </div>
                  )}
                </div>
                <a
                  href="/dashboard/billing"
                  className="block w-full text-center border border-border text-foreground px-4 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  Manage Billing
                </a>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Unlock +30% XP, priority queue, full skin access, and exclusive chat tags.
                </p>
                <div className="space-y-2">
                  <a
                    href="/buy?tier=monthly"
                    className="flex items-center justify-between w-full bg-primary text-primary-foreground px-4 py-2.5 text-xs font-medium hover:bg-primary/80 transition-colors"
                  >
                    <span>VIP Monthly</span>
                    <span className="font-heading font-bold">$3/mo</span>
                  </a>
                  <a
                    href="/buy?tier=lifetime"
                    className="flex items-center justify-between w-full bg-muted border border-border text-foreground px-4 py-2.5 text-xs font-medium hover:border-primary/50 transition-colors"
                  >
                    <span>VIP Lifetime</span>
                    <span className="font-heading font-bold">$15</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="font-heading text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <CopyIpButton ip={SERVER_IP} />
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#5865F2] text-white px-4 py-2 text-xs font-medium hover:bg-[#4752C4] transition-colors"
            >
              <IconDiscord />
              Join Discord
            </a>
            <a
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
            >
              Billing
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
            >
              ← Home
            </a>
            {isAdmin && (
              <a
                href="/dashboard/admin"
                className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-2 text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                Admin
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
