-- schema.sql

-- 1) Extensão para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Tipos ENUM
DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('user','affiliate','admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE TYPE user_status AS ENUM ('trial_active','trial_expired','active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE TYPE subscription_status AS ENUM ('active','cancelled','expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE TYPE commission_type AS ENUM ('subscription','trade');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE TYPE notification_status AS ENUM ('pending','sent','failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

-- 3) Tabelas principais

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255)    NOT NULL UNIQUE,
  password        VARCHAR(255)    NOT NULL,
  role            user_role       NOT NULL DEFAULT 'user',
  status          user_status     NOT NULL DEFAULT 'trial_active',
  trial_ends_at   TIMESTAMPTZ      NULL,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  user_id           UUID PRIMARY KEY
                    REFERENCES users(id) ON DELETE CASCADE,
  sizing_override   INTEGER       NOT NULL DEFAULT 30,
  leverage_override INTEGER       NOT NULL DEFAULT 6,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE user_credentials (
  id         UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange   VARCHAR(100)    NOT NULL,
  api_key    TEXT     NOT NULL,
  api_secret TEXT     NOT NULL,
  is_testnet BOOLEAN  NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE plans (
  id          UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  price_id    VARCHAR(100) NOT NULL,
  currency    CHAR(3)     NOT NULL,
  unit_amount NUMERIC(14,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id    UUID      NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  status     subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at    TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_financial (
  id        UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  profit    NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE commissions (
  id         UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  type       commission_type NOT NULL,
  amount     NUMERIC(14,2) NOT NULL,
  meta       JSONB      NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE affiliate_financial (
  id           UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits      NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE affiliate_commission_credits (
  id           UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id      UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       NUMERIC(14,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bot_logs (
  id        BIGSERIAL PRIMARY KEY,
  level     VARCHAR(10) NOT NULL,
  message   TEXT       NOT NULL,
  meta      JSONB      NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_logs (
  id         BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  message    TEXT        NOT NULL,
  meta       JSONB       NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_logs (
  id         BIGSERIAL PRIMARY KEY,
  request    JSONB      NOT NULL,
  response   JSONB      NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE openai_logs (
  id         BIGSERIAL PRIMARY KEY,
  request    JSONB      NOT NULL,
  response   JSONB      NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id         UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,
  message    TEXT       NOT NULL,
  status     notification_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
