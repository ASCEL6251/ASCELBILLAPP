import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Item } from '@/db/types';

export const ITEM_COLUMNS = ['name', 'hsn', 'unit', 'category', 'sale_price', 'purchase_price', 'tax_rate', 'stock', 'min_stock'] as const;

const cell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Writes items to a CSV file and opens the share sheet. */
export async function exportItemsCsv(items: Item[]) {
  const csv = [ITEM_COLUMNS.join(','), ...items.map((i) => ITEM_COLUMNS.map((c) => cell(i[c])).join(','))].join('\n');
  const file = new File(Paths.cache, `ascel-bill-items-${new Date().toISOString().slice(0, 10)}.csv`);
  if (file.exists) file.delete();
  file.create();
  await file.write(csv);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'Export items' });
}

function parseLine(line: string) {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export type ImportedItem = Partial<Item> & { name: string };

/** Lets the user pick a CSV with a header row (name required). Returns null if cancelled. */
export async function pickItemsCsv(): Promise<ImportedItem[] | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const text = await new File(res.assets[0].uri).text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('The file has no item rows.');
  const head = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const idx = (k: string) => head.indexOf(k);
  if (idx('name') < 0) throw new Error('The first row must have a "name" column.');
  const numAt = (row: string[], k: string) => {
    const i = idx(k);
    const n = i >= 0 ? parseFloat(row[i]) : NaN;
    return Number.isFinite(n) ? n : 0;
  };
  return lines.slice(1).map(parseLine).filter((r) => r[idx('name')]).map((r) => ({
    name: r[idx('name')],
    hsn: idx('hsn') >= 0 ? r[idx('hsn')] : '',
    unit: idx('unit') >= 0 && r[idx('unit')] ? r[idx('unit')] : 'pcs',
    category: idx('category') >= 0 ? r[idx('category')] : '',
    sale_price: numAt(r, 'sale_price'),
    purchase_price: numAt(r, 'purchase_price'),
    tax_rate: numAt(r, 'tax_rate'),
    stock: numAt(r, 'stock'),
    min_stock: numAt(r, 'min_stock'),
  }));
}
