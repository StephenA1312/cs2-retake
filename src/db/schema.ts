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
