# cs2retake

A website for the **cs2retakes.com** Counter-Strike 2 retake server community — featuring Steam authentication, VIP subscriptions via Stripe, and a player dashboard.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: NextAuth v5 with Steam OpenID
- **Payments**: Stripe (subscriptions + one-time payments)
- **Database**: Cloudflare D1 with Drizzle ORM
- **Deployment**: Cloudflare Pages
- **Styling**: Tailwind CSS v4

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Environment Variables

```
AUTH_SECRET=                # NextAuth secret (generate with: openssl rand -base64 32)
AUTH_STEAM_ID=              # Steam OpenID Provider ID
AUTH_STEAM_KEY=             # Steam API key
STRIPE_SECRET_KEY=           # Stripe secret key
STRIPE_PUBLISHABLE_KEY=      # Stripe publishable key
STRIPE_WEBHOOK_SECRET=       # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_KEY=      # Stripe publishable key (client-side)
NEXT_PUBLIC_SERVER_IP=       # Game server IP (e.g. play.403.com)
NEXT_PUBLIC_DISCORD_URL=     # Discord invite URL
NEXT_PUBLIC_PRICE_MONTHLY=   # Stripe price ID for monthly VIP
NEXT_PUBLIC_PRICE_LIFETIME=  # Stripe price ID for lifetime VIP
```

## Database

Schema is managed via Drizzle ORM with Cloudflare D1. Migrations are run via `wrangler d1 migrations`.

```bash
# Apply migrations locally
wrangler d1 migrations apply cs2retake --local

# Apply migrations to production
wrangler d1 migrations apply cs2retake --remote
```

## Deployment

Deployed on Cloudflare Pages via `@opennextjs/cloudflare`. The `cloudflare` adapter is preconfigured — push to `main` to deploy.

```bash
# Preview deployment
npm run build
```

## Features

- **Steam Login** — Players authenticate via Steam OpenID; accounts are created/updated on each login
- **VIP Subscriptions** — Monthly or lifetime VIP purchased via Stripe
- **Player Dashboard** — View VIP status, server IP, and billing info
- **Admin Panel** — Grant/revoke VIP access for users
- **Billing Portal** — Cancel subscriptions and view payment history
