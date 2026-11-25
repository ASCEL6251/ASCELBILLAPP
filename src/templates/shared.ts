import qrGenerator from 'qrcode-generator';
import type { Business, FullInvoice } from '@/db/types';
import { isInterState, lineTaxable, taxBreakup } from '@/lib/calc';
import { amountInWords, dateLong, escapeHtml as e, groupIN } from '@/lib/format';
import { docMeta } from '@/lib/docs';

export interface RenderCtx {
  biz: Business;
  inv: FullInvoice;
  color: string;
  title: string;
  cur: string;
  inter: boolean;
  breakup: ReturnType<typeof taxBreakup>;
  words: string;
  balance: number;
  showPaid: boolean;
  qr: string; // inline svg or ''
}

export function docTitle(inv: FullInvoice, biz: Business) {
  if (inv.type !== 'sale') return docMeta(inv.type).printTitle;
  return biz.gstin ? 'Tax Invoice' : 'Invoice';
}

export function buildCtx(biz: Business, inv: FullInvoice, color: string): RenderCtx {
  const balance = Math.max(0, inv.total - inv.received);
  let qr = '';
  if (biz.upi && inv.type === 'sale' && balance > 0) {
    try {
      const url = `upi://pay?pa=${encodeURIComponent(biz.upi)}&pn=${encodeURIComponent(biz.name)}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(inv.number)}`;
      const q = qrGenerator(0, 'M');
      q.addData(url);
      q.make();
      qr = q.createSvgTag({ cellSize: 3, margin: 0, scalable: true } as any);
    } catch {
      qr = '';
    }
  }
  return {
    biz,
    inv,
    color,
    title: docTitle(inv, biz),
    cur: biz.currency || '₹',
    inter: isInterState(biz.state, inv.party_state),
    breakup: taxBreakup(inv.lines),
    words: amountInWords(inv.total),
    balance,
    showPaid: inv.type === 'sale' && inv.total > 0 && balance <= 0.004,
    qr,
  };
}

/* ---------- color helpers ---------- */

export function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgba(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Mix the colour toward white (amt 0..1). */
export function tint(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

/** Mix the colour toward black (amt 0..1). */
export function shade(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  const m = (c: number) => Math.round(c * (1 - amt));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

export function isLight(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 165;
}

/* ---------- formatting ---------- */

export const n2 = (n: number) => groupIN(n, 2);
export const qtyFmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
export const m = (ctx: RenderCtx, n: number) => `${ctx.cur}${groupIN(n, 2)}`;

/* ---------- reusable fragments ---------- */

export function logoHtml(ctx: RenderCtx, size = 56, opts: { round?: boolean; bg?: string; fg?: string } = {}) {
  const { biz } = ctx;
  const r = opts.round ? '50%' : '12px';
  if (biz.logo) {
    return `<img src="${biz.logo}" style="width:${size}px;height:${size}px;object-fit:contain;border-radius:${r}" />`;
  }
  const letters = (biz.name || 'A')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return `<div style="width:${size}px;height:${size}px;border-radius:${r};background:${opts.bg ?? ctx.color};color:${opts.fg ?? '#fff'};display:flex;align-items:center;justify-content:center;font:600 ${Math.round(size * 0.38)}px/1 Georgia,'Times New Roman',serif;letter-spacing:.02em">${e(letters)}</div>`;
}

export function signatureHtml(ctx: RenderCtx, color = '#1d1f20') {
  const sig = ctx.biz.signature;
  if (!sig) return '<div style="height:52px"></div>';
  return `<svg viewBox="0 0 320 120" style="width:150px;height:56px" xmlns="http://www.w3.org/2000/svg"><path d="${e(sig)}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function bizLines(ctx: RenderCtx, sep = '<br/>') {
  const b = ctx.biz;
  const out: string[] = [];
  if (b.address) out.push(e(b.address) + (b.pincode && !b.address.includes(b.pincode) ? ` - ${e(b.pincode)}` : ''));
  const contact = [b.phone && `Ph: ${e(b.phone)}`, b.email && e(b.email)].filter(Boolean).join(' · ');
  if (contact) out.push(contact);
  if (b.gstin) out.push(`GSTIN: ${e(b.gstin)}`);
  if (b.state) out.push(`State: ${e(b.state)}`);
  return out.join(sep);
}

export function partyLines(ctx: RenderCtx, sep = '<br/>') {
  const i = ctx.inv;
  const out: string[] = [];
  if (i.party_address) out.push(e(i.party_address));
  if (i.party_phone) out.push(`Ph: ${e(i.party_phone)}`);
  if (i.party_gstin) out.push(`GSTIN: ${e(i.party_gstin)}`);
  if (i.party_state) out.push(`State: ${e(i.party_state)}`);
  return out.join(sep);
}

export function partyLabel(ctx: RenderCtx) {
  return docMeta(ctx.inv.type).side === 'purchase' ? 'Bill From' : 'Bill To';
}

export function metaRows(ctx: RenderCtx) {
  const i = ctx.inv;
  const rows: [string, string][] = [
    [ctx.inv.type === 'sale' ? 'Invoice No.' : `${docMeta(ctx.inv.type).printTitle} No.`, i.number],
    ['Date', dateLong(i.date)],
  ];
  if (i.due_date) rows.push([docMeta(i.type).pay ? 'Due Date' : 'Valid Till', dateLong(i.due_date)]);
  if (i.party_state || ctx.biz.state) rows.push(['Place of Supply', i.party_state || ctx.biz.state]);
  return rows;
}

export interface TotalRow {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}

export function totalRows(ctx: RenderCtx): TotalRow[] {
  const i = ctx.inv;
  const rows: TotalRow[] = [{ label: 'Sub Total', value: m(ctx, i.subtotal) }];
  if (i.tax > 0) {
    if (ctx.inter) rows.push({ label: 'IGST', value: m(ctx, i.tax) });
    else {
      rows.push({ label: 'CGST', value: m(ctx, i.tax / 2) });
      rows.push({ label: 'SGST', value: m(ctx, i.tax / 2) });
    }
  }
  if (i.discount > 0) rows.push({ label: 'Discount', value: `- ${m(ctx, i.discount)}` });
  if (i.shipping > 0) rows.push({ label: 'Shipping', value: m(ctx, i.shipping) });
  if (Math.abs(i.round_off) > 0.004) rows.push({ label: 'Round Off', value: `${i.round_off > 0 ? '+' : '-'} ${m(ctx, Math.abs(i.round_off))}` });
  rows.push({ label: 'Total', value: m(ctx, i.total), strong: true });
  if (docMeta(i.type).pay) {
    rows.push({ label: docMeta(i.type).balance < 0 ? 'Paid' : 'Received', value: m(ctx, i.received), muted: true });
    rows.push({ label: 'Balance Due', value: m(ctx, ctx.balance), muted: true });
  }
  return rows;
}

/** Standard items table — templates style it with their own CSS via class names. */
export function itemsTable(ctx: RenderCtx, opts: { cls?: string; showHsn?: boolean } = {}) {
  const showHsn = opts.showHsn ?? ctx.inv.lines.some((l) => l.hsn);
  const showTax = ctx.inv.lines.some((l) => l.tax_rate > 0);
  const showDisc = ctx.inv.lines.some((l) => l.discount > 0);
  const head = [
    '<th class="c-n">#</th>',
    '<th class="c-item">Item</th>',
    showHsn ? '<th class="c-hsn">HSN/SAC</th>' : '',
    '<th class="c-num">Qty</th>',
    '<th class="c-num">Rate</th>',
    showDisc ? '<th class="c-num">Disc.</th>' : '',
    showTax ? '<th class="c-num">Tax</th>' : '',
    '<th class="c-num c-amt">Amount</th>',
  ].join('');
  const body = ctx.inv.lines
    .map(
      (l, idx) => `<tr>
        <td class="c-n">${idx + 1}</td>
        <td class="c-item"><div class="it-name">${e(l.name)}</div></td>
        ${showHsn ? `<td class="c-hsn">${e(l.hsn)}</td>` : ''}
        <td class="c-num">${qtyFmt(l.qty)} ${e(l.unit)}</td>
        <td class="c-num">${n2(l.rate)}</td>
        ${showDisc ? `<td class="c-num">${l.discount ? n2(l.discount) : '–'}</td>` : ''}
        ${showTax ? `<td class="c-num">${l.tax_rate ? `${n2(l.tax)}<div class="sub">${l.tax_rate}%</div>` : '–'}</td>` : ''}
        <td class="c-num c-amt">${n2(l.amount)}</td>
      </tr>`,
    )
    .join('');
  const qtyTotal = ctx.inv.lines.reduce((s, l) => s + l.qty, 0);
  const foot = `<tr class="tfoot">
      <td></td><td class="c-item">Total</td>${showHsn ? '<td></td>' : ''}
      <td class="c-num">${qtyFmt(qtyTotal)}</td><td></td>${showDisc ? '<td></td>' : ''}
      ${showTax ? `<td class="c-num">${n2(ctx.inv.tax)}</td>` : ''}
      <td class="c-num c-amt">${n2(ctx.inv.lines.reduce((s, l) => s + l.amount, 0))}</td></tr>`;
  return `<table class="items ${opts.cls ?? ''}"><thead><tr>${head}</tr></thead><tbody>${body}${foot}</tbody></table>`;
}

export function taxTable(ctx: RenderCtx, cls = 'taxtbl') {
  if (!ctx.breakup.length) return '';
  const head = ctx.inter
    ? '<th>Rate</th><th class="c-num">Taxable</th><th class="c-num">IGST</th><th class="c-num">Total Tax</th>'
    : '<th>Rate</th><th class="c-num">Taxable</th><th class="c-num">CGST</th><th class="c-num">SGST</th><th class="c-num">Total Tax</th>';
  const rows = ctx.breakup
    .map((r) =>
      ctx.inter
        ? `<tr><td>${r.rate}%</td><td class="c-num">${n2(r.taxable)}</td><td class="c-num">${n2(r.tax)}</td><td class="c-num">${n2(r.tax)}</td></tr>`
        : `<tr><td>${r.rate}%</td><td class="c-num">${n2(r.taxable)}</td><td class="c-num">${n2(r.tax / 2)}</td><td class="c-num">${n2(r.tax / 2)}</td><td class="c-num">${n2(r.tax)}</td></tr>`,
    )
    .join('');
  return `<table class="${cls}"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function bankHtml(ctx: RenderCtx) {
  const b = ctx.biz;
  if (!b.bank_name && !b.account_no && !b.upi) return '';
  const rows = [
    b.bank_name && `Bank: <b>${e(b.bank_name)}</b>`,
    b.account_name && `A/c Name: ${e(b.account_name)}`,
    b.account_no && `A/c No: <b>${e(b.account_no)}</b>`,
    b.ifsc && `IFSC: ${e(b.ifsc)}`,
    b.upi && `UPI: ${e(b.upi)}`,
  ].filter(Boolean);
  return rows.join('<br/>');
}

export function qrBlock(ctx: RenderCtx, label = 'Scan to pay') {
  if (!ctx.qr) return '';
  return `<div class="qr"><div class="qr-svg">${ctx.qr}</div><div class="qr-l">${label}<br/><b>${m(ctx, ctx.balance)}</b></div></div>`;
}

export function termsText(ctx: RenderCtx) {
  return e(ctx.inv.terms || ctx.biz.terms || '').replace(/\n/g, '<br/>');
}

export function notesText(ctx: RenderCtx) {
  return e(ctx.inv.notes || '').replace(/\n/g, '<br/>');
}

export const lineTaxableOf = lineTaxable;

/** Base document wrapper. Page sized in mm so the PDF fits A4 exactly. */
export function page(css: string, body: string, opts: { width?: string; minHeight?: string } = {}) {
  const width = opts.width ?? '210mm';
  const minH = opts.minHeight ?? '297mm';
  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
@page { size: ${width} ${opts.minHeight === 'auto' ? 'auto' : minH}; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; background: #fff; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1d1f20; font-size: 11px; line-height: 1.45; }
.page { width: ${width}; min-height: ${minH === 'auto' ? '0' : minH}; position: relative; overflow: hidden; background:#fff; }
table { border-collapse: collapse; width: 100%; }
.c-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.c-n { width: 22px; }
.sub { font-size: 8.5px; opacity: .65; }
.qr { display:flex; align-items:center; gap:10px; }
.qr-svg svg { width: 74px; height: 74px; display:block; }
.qr-l { font-size: 9.5px; line-height: 1.4; }
.sign svg { display:block; margin: 4px 0 2px auto; }
.paid { position:absolute; transform: rotate(-14deg); border: 3px solid #2f8f6b; color:#2f8f6b; font: 800 26px/1 -apple-system, Helvetica, Arial; letter-spacing:.18em; padding:6px 14px; border-radius: 8px; opacity:.55; }
${css}
</style></head><body><div class="page">${body}</div></body></html>`;
}
