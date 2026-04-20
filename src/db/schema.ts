import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  steamId:              text("steam_id").primaryKey(),
  steamName:            text("steam_name"),
  steamAvatar:          text("steam_avatar"),
  stripeCustomerId:     text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // 'monthly' | 'lifetime' | null (null = free)
  vipTier:              text("vip_tier"),
  // unix timestamp (seconds) — null means no expiry (lifetime)
  vipExpiresAt:         integer("vip_expires_at"),
  createdAt:            integer("created_at").notNull(),
  updatedAt:            integer("updated_at").notNull(),
});

export type User = typeof users.$inferSelect;

export const vipEvents = sqliteTable("vip_events", {
  id:        integer("id").primaryKey({ autoIncrement: true }),
  steamId:   text("steam_id").notNull(),
  // 'granted' | 'revoked' | 'renewed' | 'expired'
  eventType: text("event_type").notNull(),
  // 'monthly' | 'lifetime' | null
  tier:      text("tier"),
  // 'stripe' | 'admin' | 'backfill'
  source:    text("source").notNull(),
  createdAt: integer("created_at").notNull(),
});

export type VipEvent = typeof vipEvents.$inferSelect;
