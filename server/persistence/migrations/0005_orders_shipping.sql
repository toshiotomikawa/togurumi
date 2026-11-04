ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_amount integer NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  ADD COLUMN IF NOT EXISTS shipping_service text,
  ADD COLUMN IF NOT EXISTS shipping_review text;
