import type { LedgerRow } from '@/db/repo';
import type { Business, PartyWithBalance } from '@/db/types';
import { dateLong, escapeHtml as e, groupIN, todayISO } from '@/lib/format';
import { page } from './shared';
import { docMeta } from '@/lib/docs';

/** Party statement in the Meridian visual language. */
export function statementHtml(biz: Business, party: PartyWithBalance, rows: LedgerRow[]) {
  const c = biz.color && !biz.color.includes('|') ? biz.color : '#1D2D3D';
  const cur = biz.currency || '₹';
  const asc = [...rows].reverse();
  let run = party.opening_balance;
  const body = asc
    .map((r) => {
      let dr = 0;
      let cr = 0;
      let label = '';
      if (r.kind === 'invoice') {
        const inv = r as Extract<LedgerRow, { kind: 'invoice' }>;
        const meta = docMeta(inv.type);
        if (!meta.balance) return '';
        const paid = inv.total - inv.balance;
        if (meta.balance > 0) { dr = inv.total; cr = paid; }
        else { cr = inv.total; dr = paid; }
        label = `${meta.label.replace(' Invoice', '')} ${e(inv.number)}`;
      } else {
        const p = r as Extract<LedgerRow, { kind: 'payment' }>;
        if (p.direction === 'in') { cr = p.amount; label = `Payment received · ${e(p.mode)}`; }
        else { dr = p.amount; label = `Payment made · ${e(p.mode)}`; }
      }
      run += dr - cr;
      return `<tr><td>${dateLong(r.date)}</td><td>${label}</td><td class="c-num">${dr ? groupIN(dr) : ''}</td><td class="c-num">${cr ? groupIN(cr) : ''}</td><td class="c-num"><b>${groupIN(run)}</b></td></tr>`;
    })
    .join('');
  const css = `
    .bar{height:8px;background:${c}} .wrap{padding:36px 42px}
    .top{display:flex;justify-content:space-between;align-items:flex-start}
    .bname{font:600 20px Georgia,serif;color:${c}} .bsub{font-size:9.5px;color:#6b6b70;margin-top:4px}
    h1{margin:0;font:300 24px -apple-system,Helvetica;letter-spacing:.2em;text-transform:uppercase;color:${c};text-align:right}
    .card{margin-top:24px;background:#f3f5f8;border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between}
    .lbl{font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:${c};font-weight:700;margin-bottom:4px}
    table.l{margin-top:22px} table.l th{background:${c};color:#fff;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;padding:8px;text-align:left}
    table.l th.c-num{text-align:right} table.l td{padding:8px;border-bottom:1px solid #ececef;font-size:10.5px}
    .bal{font:800 18px -apple-system;color:${c}}`;
  return page(
    css,
    `<div class="bar"></div><div class="wrap">
      <div class="top"><div><div class="bname">${e(biz.name)}</div><div class="bsub">${[biz.address, biz.phone, biz.gstin && 'GSTIN ' + biz.gstin].filter(Boolean).map((x) => e(String(x))).join(' · ')}</div></div>
      <div><h1>Statement</h1><div style="text-align:right;font-size:10px;color:#6b6b70;margin-top:6px">As of ${dateLong(todayISO())}</div></div></div>
      <div class="card"><div><div class="lbl">Party</div><div style="font-weight:700;font-size:13px">${e(party.name)}</div><div style="font-size:10px;color:#55555a">${[party.phone, party.address].filter(Boolean).map(e).join(' · ')}</div></div>
      <div style="text-align:right"><div class="lbl">${party.balance >= 0 ? 'Balance receivable' : 'Balance payable'}</div><div class="bal">${cur}${groupIN(Math.abs(party.balance))}</div></div></div>
      <table class="l"><thead><tr><th>Date</th><th>Particulars</th><th class="c-num">Debit</th><th class="c-num">Credit</th><th class="c-num">Balance</th></tr></thead>
      <tbody><tr><td></td><td>Opening balance</td><td></td><td></td><td class="c-num"><b>${groupIN(party.opening_balance)}</b></td></tr>${body}</tbody></table>
    </div>`,
  );
}
