import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, getOrCreateCustomer } from "@/lib/stripe";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier } = await request.json();
  if (!tier || !["monthly", "lifetime"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const steamId = (session.user as any)?.id ?? "";

  // Check D1 first — fast, no Stripe call needed
  const db = await getDb();
  const dbUser = await db.select().from(users).where(eq(users.steamId, steamId)).get();
  if (dbUser?.vipTier != null) {
    return NextResponse.json({ alreadySubscribed: true });
  }

  try {
    if (tier === "lifetime") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1500,
        currency: "usd",
        metadata: { steamId, tier },
        automatic_payment_methods: { enabled: true },
      });

      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }

    // Monthly — reuse existing customer
    const customer = await getOrCreateCustomer(steamId, session.user?.name);

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_MONTHLY }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      metadata: { steamId, tier },
    });

    const invoiceId =
      typeof subscription.latest_invoice === "string"
        ? subscription.latest_invoice
        : subscription.latest_invoice?.id;

    if (!invoiceId) {
      return NextResponse.json({ error: "No invoice on subscription" }, { status: 500 });
    }

    const invoicePayments = await stripe.invoicePayments.list({
      invoice: invoiceId,
      expand: ["data.payment.payment_intent"],
    });

    const defaultPayment = invoicePayments.data.find((p) => p.is_default);
    const paymentIntent = defaultPayment?.payment.payment_intent as Stripe.PaymentIntent | null | undefined;

    if (!paymentIntent?.client_secret) {
      return NextResponse.json({ error: "Failed to create subscription payment" }, { status: 500 });
    }

    // Store subscription ID in D1 so billing page can cancel without querying Stripe
    const now = Math.floor(Date.now() / 1000);
    await db
      .insert(users)
      .values({
        steamId,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.steamId,
        set: {
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          updatedAt: now,
        },
      });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
