import Stripe from "stripe";

// Lazy singleton — defers instantiation until first use so the build phase
// never evaluates this with a missing STRIPE_SECRET_KEY env var.
let _stripe: Stripe | null = null;

function getInstance(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    return getInstance()[prop as keyof Stripe];
  },
});

/** Finds the most recent active subscription for a given Steam ID, or null. */
export async function getActiveSubscription(steamId: string): Promise<Stripe.Subscription | null> {
  const customers = await stripe.customers.search({
    query: `metadata['steamId']:'${steamId}'`,
    limit: 10,
  });

  for (const customer of customers.data) {
    const { data } = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });
    if (data.length) return data[0];
  }

  return null;
}

/**
 * Returns an existing Stripe customer for this Steam ID, or creates one.
 * Prevents duplicate customers accumulating when a user buys multiple times.
 */
export async function getOrCreateCustomer(
  steamId: string,
  name?: string | null
): Promise<Stripe.Customer> {
  const existing = await stripe.customers.search({
    query: `metadata['steamId']:'${steamId}'`,
    limit: 1,
  });
  if (existing.data.length) return existing.data[0];
  return stripe.customers.create({ metadata: { steamId }, name: name ?? undefined });
}
