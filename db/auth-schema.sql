-- Better Auth v1.6 sqlite schema for phase 3.
-- Tables: user, session, account, verification.
-- Phase 4 replaces this with the Drizzle/Postgres schema.

CREATE TABLE IF NOT EXISTS user (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  email         TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image         TEXT,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token     TEXT NOT NULL UNIQUE,
  expiresAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS session_user_idx ON session(userId);
CREATE INDEX IF NOT EXISTS session_token_idx ON session(token);

CREATE TABLE IF NOT EXISTS account (
  id                       TEXT PRIMARY KEY,
  userId                   TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accountId                TEXT NOT NULL,
  providerId               TEXT NOT NULL,
  accessToken              TEXT,
  refreshToken             TEXT,
  idToken                  TEXT,
  accessTokenExpiresAt     INTEGER,
  refreshTokenExpiresAt    INTEGER,
  scope                    TEXT,
  password                 TEXT,
  createdAt                INTEGER NOT NULL,
  updatedAt                INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS account_user_idx ON account(userId);

CREATE TABLE IF NOT EXISTS verification (
  id         TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value      TEXT NOT NULL,
  expiresAt  INTEGER NOT NULL,
  createdAt  INTEGER NOT NULL,
  updatedAt  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);
