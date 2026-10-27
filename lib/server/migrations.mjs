/**
 * Database schema, as append-only migrations: add a new entry at the end, never edit an old one.
 * Plain JavaScript so both the app (lib/server/db.ts) and the recovery tool (scripts/admin.mjs)
 * apply exactly the same schema.
 */
// prettier-ignore
export const MIGRATIONS = [
  // 1 — core
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner','admin','manager','viewer')),
    password_hash TEXT NOT NULL,
    totp_secret TEXT,
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    disabled INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  );
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,               -- SHA-256 of the cookie token, never the token itself
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    mfa_pending INTEGER NOT NULL DEFAULT 0,
    ip TEXT,
    user_agent TEXT
  );
  CREATE INDEX sessions_user ON sessions(user_id);
  CREATE TABLE rate_limits (
    bucket TEXT NOT NULL,
    ts INTEGER NOT NULL
  );
  CREATE INDEX rate_limits_bucket ON rate_limits(bucket, ts);
  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    meta TEXT,
    ip TEXT
  );
  CREATE INDEX audit_ts ON audit_log(ts);
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE pageviews (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    day TEXT NOT NULL,
    visitor TEXT NOT NULL,
    session TEXT NOT NULL,
    path TEXT NOT NULL,
    locale TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    country TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    screen TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    scroll INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX pageviews_ts ON pageviews(ts);
  CREATE INDEX pageviews_day ON pageviews(day);
  CREATE INDEX pageviews_session ON pageviews(session);
  CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    day TEXT NOT NULL,
    visitor TEXT NOT NULL,
    session TEXT NOT NULL,
    name TEXT NOT NULL,
    path TEXT,
    meta TEXT
  );
  CREATE INDEX events_ts ON events(ts);

  CREATE TABLE clients (
    id INTEGER PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    telegram TEXT,
    country TEXT,
    language TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect','active','paused','past')),
    tags TEXT,
    notes TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE TABLE leads (
    id INTEGER PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','spam','archived')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    contact TEXT,
    company TEXT,
    challenge_type TEXT,
    challenge TEXT,
    stage TEXT,
    areas TEXT,
    budget TEXT,
    timing TEXT,
    service_id TEXT,
    locale TEXT,
    page TEXT,
    visitor TEXT,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    delivered_to TEXT
  );
  CREATE INDEX leads_created ON leads(created_at);
  CREATE TABLE deals (
    id INTEGER PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    service_id TEXT,
    value_usd REAL NOT NULL DEFAULT 0,
    recurring INTEGER NOT NULL DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','discovery','proposal','negotiation','won','lost')),
    expected_close TEXT,
    closed_at INTEGER,
    notes TEXT
  );
  CREATE TABLE invoices (
    id INTEGER PRIMARY KEY,
    created_at INTEGER NOT NULL,
    number TEXT NOT NULL UNIQUE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','AMD','EUR','RUB')),
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','partial','overdue','void')),
    description TEXT
  );
  CREATE TABLE payments (
    id INTEGER PRIMARY KEY,
    created_at INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT,
    note TEXT
  );
  CREATE TABLE expenses (
    id INTEGER PRIMARY KEY,
    created_at INTEGER NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    amount REAL NOT NULL,
    note TEXT
  );
  CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    created_at INTEGER NOT NULL,
    title TEXT NOT NULL,
    due_date TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    done_at INTEGER,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE TABLE activities (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kind TEXT NOT NULL DEFAULT 'note' CHECK (kind IN ('note','call','email','meeting','message','system')),
    body TEXT NOT NULL
  );
  CREATE INDEX activities_client ON activities(client_id, ts);
  `,
  // 2 — security hardening (v4.1): forced password change, TOTP replay protection.
  `
  ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE users ADD COLUMN totp_last_step INTEGER NOT NULL DEFAULT 0;
  `,
];
