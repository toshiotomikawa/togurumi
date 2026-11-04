CREATE TABLE IF NOT EXISTS refund_requests (
  id uuid PRIMARY KEY,
  session_id text NOT NULL UNIQUE REFERENCES orders (session_id),
  reason text NOT NULL CHECK (reason IN ('changed_mind', 'damaged', 'wrong_item', 'not_received', 'duplicate', 'other')),
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refund_requests_created_at_idx ON refund_requests (created_at DESC);
