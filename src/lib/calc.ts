import type { InvoiceLine } from '@/db/types';

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Line math: taxable = qty × rate − discount; tax on taxable; amount = taxable + tax. */
export function computeLine(l: InvoiceLine): InvoiceLine {
  const taxable = Math.max(0, l.qty * l.rate - (l.discount || 0));
  const tax = round2((taxable * (l.tax_rate || 0)) / 100);
  return { ...l, tax, amount: round2(taxable + tax) };
}

export function lineTaxable(l: InvoiceLine) {
  return round2(l.amount - l.tax);
}

export interface Totals {
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  roundOff: number;
  total: number;
}

export function computeTotals(
  lines: InvoiceLine[],
  opts: { discount?: number; shipping?: number; roundOff?: boolean } = {},
): Totals {
  const computed = lines.map(computeLine);
  const subtotal = round2(computed.reduce((s, l) => s + lineTaxable(l), 0));
  const tax = round2(computed.reduce((s, l) => s + l.tax, 0));
  const discount = round2(opts.discount ?? 0);
  const shipping = round2(opts.shipping ?? 0);
  const raw = round2(subtotal + tax - discount + shipping);
  const total = opts.roundOff ? Math.round(raw) : raw;
  return { subtotal, tax, discount, shipping, roundOff: round2(total - raw), total };
}

/** Group tax by rate for the GST table. Intra-state → CGST + SGST halves, inter-state → IGST. */
export function taxBreakup(lines: InvoiceLine[]) {
  const map = new Map<number, { rate: number; taxable: number; tax: number }>();
  for (const l of lines) {
    if (!l.tax_rate) continue;
    const row = map.get(l.tax_rate) ?? { rate: l.tax_rate, taxable: 0, tax: 0 };
    row.taxable = round2(row.taxable + lineTaxable(l));
    row.tax = round2(row.tax + l.tax);
    map.set(l.tax_rate, row);
  }
  return [...map.values()].sort((a, b) => a.rate - b.rate);
}

export function isInterState(bizState: string, partyState: string) {
  const a = bizState.trim().toLowerCase();
  const b = partyState.trim().toLowerCase();
  return !!a && !!b && a !== b;
}
