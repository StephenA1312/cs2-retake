CREATE TABLE IF NOT EXISTS users (
  steam_id              TEXT PRIMARY KEY,
  steam_name            TEXT,
  steam_avatar          TEXT,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  vip_tier              TEXT,
  vip_expires_at        INTEGER,
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL
);
