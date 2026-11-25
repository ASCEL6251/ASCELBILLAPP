import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 2;

export async function migrate(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
PRAGMA journal_mode = 'wal';
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS business (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  phone2 TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  logo TEXT NOT NULL DEFAULT '',
  signature TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  account_name TEXT NOT NULL DEFAULT '',
  account_no TEXT NOT NULL DEFAULT '',
  ifsc TEXT NOT NULL DEFAULT '',
  upi TEXT NOT NULL DEFAULT '',
  terms TEXT NOT NULL DEFAULT 'Thank you for doing business with us.',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
  template TEXT NOT NULL DEFAULT 'meridian',
  color TEXT NOT NULL DEFAULT '#1D2D3D',
  currency TEXT NOT NULL DEFAULT '₹',
  onboarded INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO business (id) VALUES (1);
CREATE TABLE IF NOT EXISTS parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'customer',
  opening_balance REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  hsn TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'pcs',
  category TEXT NOT NULL DEFAULT '',
  sale_price REAL NOT NULL DEFAULT 0,
  purchase_price REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  is_service INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'sale',
  number TEXT NOT NULL,
  party_id INTEGER,
  party_name TEXT NOT NULL DEFAULT '',
  party_phone TEXT NOT NULL DEFAULT '',
  party_address TEXT NOT NULL DEFAULT '',
  party_gstin TEXT NOT NULL DEFAULT '',
  party_state TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  due_date TEXT NOT NULL DEFAULT '',
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  shipping REAL NOT NULL DEFAULT 0,
  round_off REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  received REAL NOT NULL DEFAULT 0,
  payment_mode TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT NOT NULL DEFAULT '',
  terms TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id INTEGER,
  name TEXT NOT NULL,
  hsn TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  qty REAL NOT NULL DEFAULT 1,
  rate REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER NOT NULL,
  direction TEXT NOT NULL DEFAULT 'in',
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'Cash',
  reference TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inv_party ON invoices(party_id);
CREATE INDEX IF NOT EXISTS idx_inv_items ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_pay_party ON payments(party_id);
`);
    version = 1;
  }
  if (version === 1) {
    await db.execAsync(`
CREATE TABLE IF NOT EXISTS prefs (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL DEFAULT ''
);
`);
    version = 2;
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
