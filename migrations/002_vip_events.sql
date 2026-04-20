CREATE TABLE IF NOT EXISTS vip_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  steam_id   TEXT NOT NULL,
  event_type TEXT NOT NULL,
  tier       TEXT,
  source     TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vip_events_created_at ON vip_events(created_at);
CREATE INDEX IF NOT EXISTS idx_vip_events_steam_id   ON vip_events(steam_id);

INSERT INTO vip_events (steam_id, event_type, tier, source, created_at)
  SELECT steam_id, 'granted', vip_tier, 'backfill', created_at
  FROM users
  WHERE vip_tier IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM vip_events WHERE source = 'backfill');
