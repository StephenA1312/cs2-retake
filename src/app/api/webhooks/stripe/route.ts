import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const steamId = sub.metadata?.steamId;
        if (!steamId) break;

        const periodEnd = sub.items.data[0]?.current_period_end ?? null;
        const isActive = sub.status === "active" && !sub.cancel_at_period_end;
        const isCanceling = sub.status === "active" && sub.cancel_at_period_end;

        await db
          .insert(users)
          .values({
            steamId,
            stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            stripeSubscriptionId: sub.id,
            vipTier: isActive || isCanceling ? "monthly" : null,
            vipExpiresAt: isCanceling ? periodEnd : null,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: users.steamId,
            set: {
              stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
              stripeSubscriptionId: sub.id,
              vipTier: isActive || isCanceling ? "monthly" : null,
              vipExpiresAt: isCanceling ? periodEnd : null,
              updatedAt: now,
            },
          });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const steamId = sub.metadata?.steamId;
        if (!steamId) break;

        await db
          .update(users)
          .set({ vipTier: null, vipExpiresAt: null, stripeSubscriptionId: null, updatedAt: now })
          .where(eq(users.steamId, steamId));
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const steamId = pi.metadata?.steamId;
        const tier = pi.metadata?.tier;
        if (!steamId || tier !== "lifetime") break;

        await db
          .insert(users)
          .values({
            steamId,
            stripeCustomerId: typeof pi.customer === "string" ? pi.customer : (pi.customer?.id ?? null),
            vipTier: "lifetime",
            vipExpiresAt: null,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: users.steamId,
            set: {
              vipTier: "lifetime",
              vipExpiresAt: null,
              updatedAt: now,
            },
          });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook DB error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
