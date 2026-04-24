import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const steamId = (session.user as any)?.id ?? "";
  const db = await getDb();
  const dbUser = await db.select().from(users).where(eq(users.steamId, steamId)).get();

  const hasVip = dbUser?.vipTier != null;
  const isCanceling = hasVip && dbUser?.vipExpiresAt != null;
  const periodEnd = dbUser?.vipExpiresAt ? formatDate(dbUser.vipExpiresAt) : null;
  const amount = dbUser?.vipTier === "monthly" ? "$3/month" : null;

  async function cancelSubscription() {
    "use server";
    const session2 = await auth();
    if (!session2?.user) return;
    const sid = (session2.user as any)?.id ?? "";

    const db2 = await getDb();
    const row = await db2.select().from(users).where(eq(users.steamId, sid)).get();
    if (!row?.stripeSubscriptionId) return;

    const updated = await stripe.subscriptions.update(row.stripeSubscriptionId, { cancel_at_period_end: true });
    const newPeriodEnd = updated.items.data[0]?.current_period_end ?? null;

    const now = Math.floor(Date.now() / 1000);
    await db2
      .update(users)
      .set({ vipExpiresAt: newPeriodEnd, updatedAt: now })
      .where(eq(users.steamId, sid));

    redirect("/dashboard/billing");
  }

  async function resumeSubscription() {
    "use server";
    const session2 = await auth();
    if (!session2?.user) return;
    const sid = (session2.user as any)?.id ?? "";

    const db2 = await getDb();
    const row = await db2.select().from(users).where(eq(users.steamId, sid)).get();
    if (!row?.stripeSubscriptionId) return;

    await stripe.subscriptions.update(row.stripeSubscriptionId, { cancel_at_period_end: false });

    const now = Math.floor(Date.now() / 1000);
    await db2
      .update(users)
      .set({ vipExpiresAt: null, updatedAt: now })
      .where(eq(users.steamId, sid));

    redirect("/dashboard/billing");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-heading text-sm font-bold tracking-wider">
            <span className="text-primary">Retake</span>Base
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
            </svg>
            Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your VIP subscription</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan status */}
          <div className="p-6 bg-card border border-border space-y-5">
            <p className="font-heading text-xs text-muted-foreground uppercase tracking-wider">Current Plan</p>

            {hasVip ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg font-bold">
                    VIP {dbUser?.vipTier === "lifetime" ? "Lifetime" : "Monthly"}
                  </span>
                  <span className={`font-heading text-xs px-2 py-0.5 border ${
                    isCanceling
                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}>
                    {isCanceling ? "CANCELING" : "ACTIVE"}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span>{amount}</span>
                    </div>
                  )}
                  {periodEnd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {isCanceling ? "Access until" : "Next billing"}
                      </span>
                      <span>{periodEnd}</span>
                    </div>
                  )}
                  {dbUser?.vipTier === "lifetime" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="text-primary">Never</span>
                    </div>
                  )}
                </div>

                {dbUser?.vipTier === "monthly" && dbUser.stripeSubscriptionId && (
                  <div className="pt-1">
                    {isCanceling ? (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          VIP access continues until {periodEnd}, then expires.
                        </p>
                        <form action={resumeSubscription}>
                          <button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground px-4 py-2.5 text-xs font-medium hover:bg-primary/80 transition-colors"
                          >
                            Resume Subscription
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Canceling keeps VIP active until {periodEnd} — it won&apos;t renew after that.
                        </p>
                        <form action={cancelSubscription}>
                          <button
                            type="submit"
                            className="w-full border border-red-500/30 text-red-400 px-4 py-2.5 text-xs font-medium hover:bg-red-500/10 transition-colors"
                          >
                            Cancel Subscription
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg font-bold text-muted-foreground">Free</span>
                  <span className="font-heading text-xs px-2 py-0.5 border border-border text-muted-foreground">
                    NO VIP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You don&apos;t have an active VIP subscription.
                </p>
              </>
            )}
          </div>

          {/* Upgrade options */}
          <div className="p-6 bg-card border border-border space-y-5">
            <p className="font-heading text-xs text-muted-foreground uppercase tracking-wider">
              {hasVip ? "Switch Plan" : "Upgrade to VIP"}
            </p>
            <div className="space-y-2">
              <a
                href="/buy?tier=monthly"
                className="flex items-center justify-between w-full bg-primary text-primary-foreground px-4 py-3 text-xs font-medium hover:bg-primary/80 transition-colors"
              >
                <div>
                  <p className="font-bold">VIP Monthly</p>
                  <p className="text-primary-foreground/70 mt-0.5">Priority queue, +30% XP, skins</p>
                </div>
                <span className="font-heading font-bold text-sm shrink-0 ml-4">$3/mo</span>
              </a>
              <a
                href="/buy?tier=lifetime"
                className="flex items-center justify-between w-full bg-muted border border-border text-foreground px-4 py-3 text-xs font-medium hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="font-bold">VIP Lifetime</p>
                  <p className="text-muted-foreground mt-0.5">Everything, forever</p>
                </div>
                <span className="font-heading font-bold text-sm shrink-0 ml-4">$15</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
