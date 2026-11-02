CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  session_id text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  amount_total integer NOT NULL CHECK (amount_total >= 0),
  currency text NOT NULL,
  payment_intent_id text,
  customer_email text,
  customer_name text,
  customer_phone text,
  shipping_address jsonb,
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array'),
  stock_applied boolean NOT NULL DEFAULT false,
  stock_issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
