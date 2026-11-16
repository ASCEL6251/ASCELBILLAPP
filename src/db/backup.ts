import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Local backup: every table dumped to one JSON file the user can save anywhere
 * (Drive, WhatsApp to self, Files). Restore replaces all data in one transaction.
 * The cloud backup planned for Pro will upload this same snapshot, encrypted.
 */

const APP = 'ascel-bill';
const FORMAT = 1;
// Parents before children, so inserts satisfy foreign keys.
const TABLES = ['business', 'parties', 'items', 'invoices', 'invoice_items', 'payments', 'expenses'] as const;

type Row = Record<string, unknown>;
export type Backup = {
  app: typeof APP;
  format: number;
  schema: number;
  exportedAt: string;
  tables: Record<string, Row[]>;
};

export async function createBackup(db: SQLiteDatabase): Promise<Backup> {
  const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const tables: Record<string, Row[]> = {};
  for (const t of TABLES) tables[t] = await db.getAllAsync<Row>(`SELECT * FROM ${t}`);
  return { app: APP, format: FORMAT, schema: v?.user_version ?? 0, exportedAt: new Date().toISOString(), tables };
}

/** Writes the backup to a dated file and opens the share sheet. */
export async function exportBackup(db: SQLiteDatabase, businessName: string) {
  const data = await createBackup(db);
  const slug = (businessName || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
  const d = new Date(data.exportedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  const file = new File(Paths.cache, `ascel-bill-${slug}-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(data));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save your backup' });
  return countRows(data);
}

/** Lets the user pick a backup file. Returns null if they cancel. Throws on a bad file. */
export async function pickBackup(): Promise<Backup | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const text = await new File(res.assets[0].uri).text();
  let data: Backup;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not an Ascel Bill backup.');
  }
  if (data?.app !== APP || typeof data.tables !== 'object' || !Array.isArray(data.tables.business)) {
    throw new Error('This file is not an Ascel Bill backup.');
  }
  if (data.format > FORMAT) throw new Error('This backup was made by a newer version of Ascel Bill. Update the app, then try again.');
  return data;
}

export function countRows(data: Backup) {
  const n = (t: string) => data.tables[t]?.length ?? 0;
  return { parties: n('parties'), items: n('items'), invoices: n('invoices'), payments: n('payments'), expenses: n('expenses') };
}

/** Replaces all local data with the backup. Unknown columns are skipped so older backups still restore. */
export async function restoreBackup(db: SQLiteDatabase, data: Backup) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    for (const t of [...TABLES].reverse()) await tx.runAsync(`DELETE FROM ${t}`);
    for (const t of TABLES) {
      const rows = data.tables[t] ?? [];
      if (!rows.length) continue;
      const info = await tx.getAllAsync<{ name: string }>(`PRAGMA table_info(${t})`);
      const known = new Set(info.map((c) => c.name));
      for (const row of rows) {
        const cols = Object.keys(row).filter((c) => known.has(c));
        if (!cols.length) continue;
        const sql = `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
        await tx.runAsync(sql, cols.map((c) => row[c] as string | number | null));
      }
    }
  });
}
