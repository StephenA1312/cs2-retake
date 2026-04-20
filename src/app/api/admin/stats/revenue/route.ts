import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireAdmin } from "@/lib/admin-guard";

type CacheEntry = {
  at: number;
  body: {
    mrrCents: number;
    lifetimeRevenueCents: number;
    last30dCents: number;
    activeSubs: number;
    currency: string;
  };
};
let cache: CacheEntry | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json(cache.body);
  }

  try {
    let mrrCents = 0;
    let activeSubs = 0;
    let currency = "usd";
    for await (const sub of stripe.subscriptions.list({ status: "active", limit: 100, expand: ["data.items.data.price"] })) {
      if (sub.cancel_at_period_end) continue;
      activeSubs++;
      for (const item of sub.items.data) {
        const price = item.price;
        const unit = price.unit_amount ?? 0;
        const qty = item.quantity ?? 1;
        const interval = price.recurring?.interval;
        const intervalCount = price.recurring?.interval_count ?? 1;
        let monthly = 0;
        if (interval === "month") monthly = (unit * qty) / intervalCount;
        else if (interval === "year") monthly = (unit * qty) / (12 * intervalCount);
        else if (interval === "week") monthly = (unit * qty * 52) / (12 * intervalCount);
        else if (interval === "day") monthly = (unit * qty * 30) / intervalCount;
        mrrCents += Math.round(monthly);
        if (price.currency) currency = price.currency;
      }
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
    let lifetimeRevenueCents = 0;
    let last30dCents = 0;
    for await (const pi of stripe.paymentIntents.list({ limit: 100 })) {
      if (pi.status !== "succeeded") continue;
      lifetimeRevenueCents += pi.amount_received ?? 0;
      if (pi.created >= thirtyDaysAgo) last30dCents += pi.amount_received ?? 0;
      if (pi.currency) currency = pi.currency;
    }

    const body = { mrrCents, lifetimeRevenueCents, last30dCents, activeSubs, currency };
    cache = { at: Date.now(), body };
    return NextResponse.json(body);
  } catch (err) {
    console.error("stats/revenue error:", err);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}
