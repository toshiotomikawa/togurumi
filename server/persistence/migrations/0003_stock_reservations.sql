CREATE TABLE IF NOT EXISTS stock_reservations (
  reservation_id text NOT NULL,
  slug text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  expires_at timestamptz NOT NULL,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reservation_id, slug)
);

CREATE INDEX IF NOT EXISTS stock_reservations_active_idx
  ON stock_reservations (slug, expires_at) WHERE released_at IS NULL;

CREATE TABLE IF NOT EXISTS order_stock_items (
  reservation_id text NOT NULL,
  slug text NOT NULL,
  session_id text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reservation_id, slug)
);
