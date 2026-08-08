CREATE TABLE users (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL,
  password_hash text,
  google_id text UNIQUE,
  email text,
  role text NOT NULL CHECK (role IN ('admin', 'moderator'))
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 600),
  created_at timestamptz NOT NULL
);

CREATE INDEX reviews_created_at_idx ON reviews (created_at DESC);

CREATE TABLE site_content (
  locale text NOT NULL CHECK (locale IN ('en-US', 'pt-BR', 'es-ES')),
  section text NOT NULL CHECK (section IN ('home', 'about', 'contact', 'shop', 'journal', 'reviews')),
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (locale, section)
);

CREATE TABLE faq_content (
  locale text PRIMARY KEY CHECK (locale IN ('en-US', 'pt-BR', 'es-ES')),
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE journal_posts (
  id text PRIMARY KEY,
  slug text NOT NULL,
  locale text NOT NULL CHECK (locale IN ('en-US', 'pt-BR', 'es-ES')),
  title text NOT NULL,
  published_on date NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  summary text NOT NULL,
  body text NOT NULL,
  author text NOT NULL DEFAULT 'Bella',
  archived boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (locale, slug)
);

CREATE INDEX journal_posts_public_idx
  ON journal_posts (locale, archived, sort_order, published_on DESC);
