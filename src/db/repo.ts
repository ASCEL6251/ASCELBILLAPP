import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  Business,
  DocType,
  Expense,
  FullInvoice,
  Invoice,
  InvoiceLine,
  Item,
  Party,
  PartyWithBalance,
  Payment,
} from './types';
import { computeLine, round2 } from '@/lib/calc';
import { todayISO } from '@/lib/format';

/* ---------------- business ---------------- */

export function getBusiness(db: SQLiteDatabase) {
  return db.getFirstAsync<Business>('SELECT * FROM business WHERE id = 1') as Promise<Business>;
}

export async function updateBusiness(db: SQLiteDatabase, patch: Partial<Business>) {
  const keys = Object.keys(patch).filter((k) => k !== 'id');
  if (!keys.length) return;
  const sql = `UPDATE business SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = 1`;
  await db.runAsync(sql, keys.map((k) => (patch as any)[k]));
}

/* ---------------- parties ---------------- */

const BALANCE_SQL = `
  p.opening_balance
  + COALESCE((SELECT SUM(total - received) FROM invoices WHERE party_id = p.id AND type = 'sale'), 0)
  - COALESCE((SELECT SUM(total - received) FROM invoices WHERE party_id = p.id AND type = 'purchase'), 0)
  - COALESCE((SELECT SUM(amount) FROM payments WHERE party_id = p.id AND direction = 'in'), 0)
  + COALESCE((SELECT SUM(amount) FROM payments WHERE party_id = p.id AND direction = 'out'), 0)`;

export function listParties(db: SQLiteDatabase, q = '') {
  return db.getAllAsync<PartyWithBalance>(
    `SELECT p.*, (${BALANCE_SQL}) AS balance,
       (SELECT MAX(date) FROM invoices WHERE party_id = p.id) AS last_date
     FROM parties p
     WHERE p.name LIKE ? OR p.phone LIKE ?
     ORDER BY COALESCE((SELECT MAX(created_at) FROM invoices WHERE party_id = p.id), p.created_at) DESC`,
    `%${q}%`,
    `%${q}%`,
  );
}

export function getParty(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<PartyWithBalance>(
    `SELECT p.*, (${BALANCE_SQL}) AS balance, NULL AS last_date FROM parties p WHERE p.id = ?`,
    id,
  );
}

export async function saveParty(db: SQLiteDatabase, p: Partial<Party> & { name: string }) {
  if (p.id) {
    await db.runAsync(
      `UPDATE parties SET name=?, phone=?, email=?, gstin=?, address=?, state=?, kind=?, opening_balance=? WHERE id=?`,
      p.name, p.phone ?? '', p.email ?? '', p.gstin ?? '', p.address ?? '', p.state ?? '',
      p.kind ?? 'customer', p.opening_balance ?? 0, p.id,
    );
    return p.id;
  }
  const r = await db.runAsync(
    `INSERT INTO parties (name, phone, email, gstin, address, state, kind, opening_balance) VALUES (?,?,?,?,?,?,?,?)`,
    p.name, p.phone ?? '', p.email ?? '', p.gstin ?? '', p.address ?? '', p.state ?? '',
    p.kind ?? 'customer', p.opening_balance ?? 0,
  );
  return r.lastInsertRowId;
}

export async function deleteParty(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM payments WHERE party_id = ?', id);
  await db.runAsync('UPDATE invoices SET party_id = NULL WHERE party_id = ?', id);
  await db.runAsync('DELETE FROM parties WHERE id = ?', id);
}

export type LedgerRow =
  | { kind: 'invoice'; id: number; type: DocType; number: string; date: string; total: number; balance: number }
  | { kind: 'payment'; id: number; direction: 'in' | 'out'; date: string; amount: number; mode: string };

export async function partyLedger(db: SQLiteDatabase, partyId: number): Promise<LedgerRow[]> {
  const inv = await db.getAllAsync<Invoice>(
    'SELECT * FROM invoices WHERE party_id = ? ORDER BY date DESC, id DESC',
    partyId,
  );
  const pay = await db.getAllAsync<Payment>(
    'SELECT * FROM payments WHERE party_id = ? ORDER BY date DESC, id DESC',
    partyId,
  );
  const rows: LedgerRow[] = [
    ...inv.map((i) => ({
      kind: 'invoice' as const, id: i.id, type: i.type, number: i.number, date: i.date,
      total: i.total, balance: round2(i.total - i.received),
    })),
    ...pay.map((p) => ({
      kind: 'payment' as const, id: p.id, direction: p.direction, date: p.date, amount: p.amount, mode: p.mode,
    })),
  ];
  return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/* ---------------- items ---------------- */

export function listItems(db: SQLiteDatabase, q = '') {
  return db.getAllAsync<Item>(
    'SELECT * FROM items WHERE name LIKE ? OR hsn LIKE ? OR category LIKE ? ORDER BY name COLLATE NOCASE',
    `%${q}%`, `%${q}%`, `%${q}%`,
  );
}

export function getItem(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Item>('SELECT * FROM items WHERE id = ?', id);
}

export async function saveItem(db: SQLiteDatabase, it: Partial<Item> & { name: string }) {
  const vals = [
    it.name, it.hsn ?? '', it.unit ?? 'pcs', it.category ?? '', it.sale_price ?? 0,
    it.purchase_price ?? 0, it.tax_rate ?? 0, it.stock ?? 0, it.min_stock ?? 0, it.is_service ?? 0,
  ];
  if (it.id) {
    await db.runAsync(
      `UPDATE items SET name=?, hsn=?, unit=?, category=?, sale_price=?, purchase_price=?, tax_rate=?, stock=?, min_stock=?, is_service=? WHERE id=?`,
      [...vals, it.id],
    );
    return it.id;
  }
  const r = await db.runAsync(
    `INSERT INTO items (name, hsn, unit, category, sale_price, purchase_price, tax_rate, stock, min_stock, is_service) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    vals,
  );
  return r.lastInsertRowId;
}

export async function deleteItem(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
}

export async function itemMovements(db: SQLiteDatabase, itemId: number) {
  return db.getAllAsync<{ invoice_id: number; number: string; type: DocType; date: string; party_name: string; qty: number; rate: number }>(
    `SELECT l.invoice_id, i.number, i.type, i.date, i.party_name, l.qty, l.rate
     FROM invoice_items l JOIN invoices i ON i.id = l.invoice_id
     WHERE l.item_id = ? ORDER BY i.date DESC, i.id DESC LIMIT 50`,
    itemId,
  );
}

/* ---------------- invoices ---------------- */

export interface InvoiceFilter {
  q?: string;
  type?: DocType | 'all';
  partyId?: number;
  limit?: number;
}

export function listInvoices(db: SQLiteDatabase, f: InvoiceFilter = {}) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (f.q) {
    where.push('(party_name LIKE ? OR number LIKE ?)');
    args.push(`%${f.q}%`, `%${f.q}%`);
  }
  if (f.type && f.type !== 'all') {
    where.push('type = ?');
    args.push(f.type);
  }
  if (f.partyId) {
    where.push('party_id = ?');
    args.push(f.partyId);
  }
  const sql = `SELECT * FROM invoices ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY date DESC, id DESC ${f.limit ? `LIMIT ${f.limit}` : ''}`;
  return db.getAllAsync<Invoice>(sql, args);
}

export async function getInvoice(db: SQLiteDatabase, id: number): Promise<FullInvoice | null> {
  const inv = await db.getFirstAsync<Invoice>('SELECT * FROM invoices WHERE id = ?', id);
  if (!inv) return null;
  const lines = await db.getAllAsync<InvoiceLine>(
    'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id',
    id,
  );
  return { ...inv, lines };
}

const PREFIX: Record<DocType, string> = { sale: '', estimate: 'EST-', purchase: 'PUR-' };

export async function nextInvoiceNumber(db: SQLiteDatabase, type: DocType) {
  const biz = await getBusiness(db);
  const prefix = type === 'sale' ? biz.invoice_prefix : PREFIX[type];
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM invoices WHERE type = ?',
    type,
  );
  let n = (row?.n ?? 0) + 1;
  // make sure the number is unique even after deletions
  while (
    await db.getFirstAsync('SELECT id FROM invoices WHERE type = ? AND number = ?', type, `${prefix}${n}`)
  ) {
    n++;
  }
  return `${prefix}${n}`;
}

function stockSign(type: DocType) {
  return type === 'sale' ? -1 : type === 'purchase' ? 1 : 0;
}

async function applyStock(db: SQLiteDatabase, type: DocType, lines: InvoiceLine[], factor: 1 | -1) {
  const sign = stockSign(type) * factor;
  if (!sign) return;
  for (const l of lines) {
    if (l.item_id) {
      await db.runAsync('UPDATE items SET stock = stock + ? WHERE id = ? AND is_service = 0', sign * l.qty, l.item_id);
    }
  }
}

export type InvoiceDraft = Omit<Invoice, 'id' | 'created_at'> & { id?: number; lines: InvoiceLine[] };

export async function saveInvoice(db: SQLiteDatabase, draft: InvoiceDraft) {
  let id = draft.id;
  await db.withTransactionAsync(async () => {
    const lines = draft.lines.map(computeLine);
    if (id) {
      const old = await getInvoice(db, id);
      if (old) await applyStock(db, old.type, old.lines, -1);
      await db.runAsync('DELETE FROM invoice_items WHERE invoice_id = ?', id);
    }
    const cols = [
      'type', 'number', 'party_id', 'party_name', 'party_phone', 'party_address', 'party_gstin', 'party_state',
      'date', 'due_date', 'subtotal', 'discount', 'tax', 'shipping', 'round_off', 'total', 'received',
      'payment_mode', 'notes', 'terms', 'template', 'color',
    ] as const;
    const vals = cols.map((c) => (draft as any)[c] ?? null);
    if (id) {
      await db.runAsync(`UPDATE invoices SET ${cols.map((c) => `${c}=?`).join(', ')} WHERE id = ?`, [...vals, id]);
    } else {
      const r = await db.runAsync(
        `INSERT INTO invoices (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
        vals,
      );
      id = r.lastInsertRowId;
    }
    for (const l of lines) {
      await db.runAsync(
        `INSERT INTO invoice_items (invoice_id, item_id, name, hsn, unit, qty, rate, discount, tax_rate, tax, amount)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        id!, l.item_id, l.name, l.hsn, l.unit, l.qty, l.rate, l.discount, l.tax_rate, l.tax, l.amount,
      );
    }
    await applyStock(db, draft.type, lines, 1);
  });
  return id!;
}

export async function deleteInvoice(db: SQLiteDatabase, id: number) {
  await db.withTransactionAsync(async () => {
    const old = await getInvoice(db, id);
    if (old) await applyStock(db, old.type, old.lines, -1);
    await db.runAsync('DELETE FROM invoice_items WHERE invoice_id = ?', id);
    await db.runAsync('DELETE FROM invoices WHERE id = ?', id);
  });
}

export async function recordInvoicePayment(db: SQLiteDatabase, id: number, amount: number, mode: string) {
  await db.runAsync(
    'UPDATE invoices SET received = MIN(total, received + ?), payment_mode = ? WHERE id = ?',
    amount, mode, id,
  );
}

export async function convertEstimate(db: SQLiteDatabase, id: number) {
  const est = await getInvoice(db, id);
  if (!est) return null;
  const number = await nextInvoiceNumber(db, 'sale');
  const { id: _id, created_at: _c, ...rest } = est;
  return saveInvoice(db, { ...rest, type: 'sale', number, date: todayISO(), received: 0 });
}

/* ---------------- payments ---------------- */

export async function addPayment(db: SQLiteDatabase, p: Omit<Payment, 'id' | 'created_at'>) {
  const r = await db.runAsync(
    'INSERT INTO payments (party_id, direction, amount, date, mode, reference, note) VALUES (?,?,?,?,?,?,?)',
    p.party_id, p.direction, p.amount, p.date, p.mode, p.reference, p.note,
  );
  return r.lastInsertRowId;
}

export async function deletePayment(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM payments WHERE id = ?', id);
}

/* ---------------- expenses ---------------- */

export function listExpenses(db: SQLiteDatabase) {
  return db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY date DESC, id DESC');
}

export async function addExpense(db: SQLiteDatabase, e: Omit<Expense, 'id'>) {
  await db.runAsync('INSERT INTO expenses (category, amount, date, note) VALUES (?,?,?,?)', e.category, e.amount, e.date, e.note);
}

export async function deleteExpense(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

/* ---------------- dashboard ---------------- */

export async function dashboardStats(db: SQLiteDatabase) {
  const month = todayISO().slice(0, 7);
  const prev = (() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();
  const one = async (sql: string, ...args: any[]) =>
    ((await db.getFirstAsync<{ v: number }>(sql, ...args))?.v ?? 0) as number;

  const receivable = await one(
    `SELECT COALESCE(SUM(b),0) AS v FROM (SELECT (${BALANCE_SQL}) AS b FROM parties p) WHERE b > 0`,
  );
  const payable = await one(
    `SELECT COALESCE(-SUM(b),0) AS v FROM (SELECT (${BALANCE_SQL}) AS b FROM parties p) WHERE b < 0`,
  );
  const salesMonth = await one(`SELECT COALESCE(SUM(total),0) AS v FROM invoices WHERE type='sale' AND substr(date,1,7)=?`, month);
  const salesPrev = await one(`SELECT COALESCE(SUM(total),0) AS v FROM invoices WHERE type='sale' AND substr(date,1,7)=?`, prev);
  const purchaseMonth = await one(`SELECT COALESCE(SUM(total),0) AS v FROM invoices WHERE type='purchase' AND substr(date,1,7)=?`, month);
  const expenseMonth = await one(`SELECT COALESCE(SUM(amount),0) AS v FROM expenses WHERE substr(date,1,7)=?`, month);
  const stockValue = await one(`SELECT COALESCE(SUM(CASE WHEN stock > 0 THEN stock * purchase_price ELSE 0 END),0) AS v FROM items WHERE is_service = 0`);
  const itemCount = await one(`SELECT COUNT(*) AS v FROM items`);
  const lowStock = await db.getAllAsync<Item>(
    'SELECT * FROM items WHERE is_service = 0 AND stock <= min_stock ORDER BY stock ASC LIMIT 6',
  );
  const cashIn = await one(
    `SELECT COALESCE((SELECT SUM(received) FROM invoices WHERE type='sale'),0)
          + COALESCE((SELECT SUM(amount) FROM payments WHERE direction='in'),0)
          - COALESCE((SELECT SUM(received) FROM invoices WHERE type='purchase'),0)
          - COALESCE((SELECT SUM(amount) FROM payments WHERE direction='out'),0)
          - COALESCE((SELECT SUM(amount) FROM expenses),0) AS v`,
  );

  // daily sales for the last 6 months, grouped by month
  const series = await db.getAllAsync<{ m: string; v: number }>(
    `SELECT substr(date,1,7) AS m, SUM(total) AS v FROM invoices
     WHERE type='sale' AND date >= date('now','start of month','-5 months')
     GROUP BY m ORDER BY m`,
  );

  return {
    receivable, payable, salesMonth, salesPrev, purchaseMonth, expenseMonth,
    stockValue, itemCount, lowStock, cashIn, series,
  };
}

/* ---------------- reports ---------------- */

export async function salesByParty(db: SQLiteDatabase, from: string, to: string) {
  return db.getAllAsync<{ party_name: string; n: number; total: number }>(
    `SELECT party_name, COUNT(*) AS n, SUM(total) AS total FROM invoices
     WHERE type='sale' AND date BETWEEN ? AND ? GROUP BY party_name ORDER BY total DESC`,
    from, to,
  );
}

export async function salesByItem(db: SQLiteDatabase, from: string, to: string) {
  return db.getAllAsync<{ name: string; qty: number; amount: number }>(
    `SELECT l.name, SUM(l.qty) AS qty, SUM(l.amount) AS amount FROM invoice_items l
     JOIN invoices i ON i.id = l.invoice_id
     WHERE i.type='sale' AND i.date BETWEEN ? AND ? GROUP BY l.name ORDER BY amount DESC`,
    from, to,
  );
}

export async function gstSummary(db: SQLiteDatabase, from: string, to: string) {
  return db.getAllAsync<{ tax_rate: number; taxable: number; tax: number }>(
    `SELECT l.tax_rate, SUM(l.amount - l.tax) AS taxable, SUM(l.tax) AS tax FROM invoice_items l
     JOIN invoices i ON i.id = l.invoice_id
     WHERE i.type='sale' AND i.date BETWEEN ? AND ? GROUP BY l.tax_rate ORDER BY l.tax_rate`,
    from, to,
  );
}

/* ---------------- danger zone ---------------- */

export async function resetAll(db: SQLiteDatabase) {
  await db.execAsync(`
    DELETE FROM invoice_items; DELETE FROM invoices; DELETE FROM payments;
    DELETE FROM expenses; DELETE FROM items; DELETE FROM parties;
    UPDATE business SET onboarded = 0;
  `);
}

export async function updateInvoiceDesign(db: SQLiteDatabase, id: number, template: string, color: string) {
  await db.runAsync('UPDATE invoices SET template = ?, color = ? WHERE id = ?', template, color, id);
}
