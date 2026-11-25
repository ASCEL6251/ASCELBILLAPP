import type { Business, FullInvoice } from '@/db/types';
import { escapeHtml as e } from '@/lib/format';
import {
  bankHtml, bizLines, buildCtx, itemsTable, logoHtml, m, metaRows, notesText, page, partyLabel,
  partyLines, qrBlock, RenderCtx, rgba, shade, signatureHtml, taxTable, termsText, tint, totalRows,
  isLight, n2, qtyFmt,
} from './shared';
import { docMeta } from '@/lib/docs';

export interface TemplateDef {
  id: string;
  name: string;
  blurb: string;
  premium?: boolean;
  format: 'A4' | 'Thermal';
  palettes: string[];
  render: (ctx: RenderCtx) => string;
}

const BRAND = ['#1D2D3D', '#5980A6', '#2F6F5E', '#6B3F69', '#B5543B', '#A8823A', '#2B2B2E'];
const DUO = ['#1D2D3D|#94BCE3', '#3B1F4A|#D9A441', '#0F3D3E|#E07A5F', '#7A1E2C|#F2C14E', '#1F2937|#60A5FA'];

const footNote = (ctx: RenderCtx) =>
  `<div class="gen">Generated with Ascel Bill · ${e(ctx.inv.number)}</div>`;

const signBlock = (ctx: RenderCtx, color = '#1d1f20') => `
  <div class="sign">
    <div class="sign-for">For ${e(ctx.biz.name)}</div>
    ${signatureHtml(ctx, color)}
    <div class="sign-l">Authorised Signatory</div>
  </div>`;

const totalsTable = (ctx: RenderCtx) =>
  `<table class="totals">${totalRows(ctx)
    .map(
      (r) =>
        `<tr class="${r.strong ? 'strong' : ''}${r.muted ? ' muted' : ''}"><td>${r.label}</td><td class="c-num">${r.value}</td></tr>`,
    )
    .join('')}</table>`;

/* ======================= 1. MERIDIAN — modern clean ======================= */
const meridian: TemplateDef = {
  id: 'meridian',
  name: 'Meridian',
  blurb: 'Modern & airy. Our signature look.',
  format: 'A4',
  palettes: BRAND,
  render: (ctx) => {
    const c = ctx.color;
    const css = `
      .bar { height: 8px; background: ${c}; }
      .wrap { padding: 34px 42px 28px; }
      .top { display:flex; justify-content:space-between; align-items:flex-start; }
      .brand { display:flex; gap:14px; align-items:center; }
      .bname { font: 600 21px/1.15 Georgia, 'Times New Roman', serif; color:${shade(c, 0.1)}; }
      .bsub { font-size: 9.5px; color:#6b6b70; margin-top:4px; max-width: 290px; }
      .doc { text-align:right; }
      .doc h1 { margin:0; font: 300 30px/1 -apple-system, 'Helvetica Neue', Helvetica; letter-spacing:.24em; text-transform:uppercase; color:${c}; }
      .doc .no { margin-top:8px; font-size:10.5px; color:#6b6b70; letter-spacing:.06em; }
      .cards { display:flex; gap:16px; margin-top: 26px; }
      .card { flex:1; background:${tint(c, 0.94)}; border-radius:12px; padding:14px 16px; }
      .lbl { font-size: 8.5px; letter-spacing:.2em; text-transform:uppercase; color:${c}; font-weight:700; margin-bottom:6px; }
      .pname { font-size: 13.5px; font-weight:700; margin-bottom:3px; }
      .meta td { padding: 2.5px 0; font-size:10.5px; } .meta td:first-child { color:#6b6b70; }
      .items { margin-top: 24px; }
      .items th { font-size:8.5px; letter-spacing:.16em; text-transform:uppercase; color:#fff; background:${c}; padding:9px 8px; text-align:left; }
      .items th:first-child { border-radius: 8px 0 0 8px; } .items th:last-child { border-radius: 0 8px 8px 0; }
      .items th.c-num { text-align:right; }
      .items td { padding: 10px 8px; border-bottom: 1px solid #ececef; vertical-align:top; }
      .items .it-name { font-weight:600; }
      .items .tfoot td { font-weight:700; border-bottom:none; color:${shade(c, 0.1)}; }
      .lower { display:flex; gap:28px; margin-top: 18px; }
      .left { flex: 1.2; }
      .right { flex: 1; }
      .totals td { padding: 5px 0; font-size: 11px; }
      .totals tr.muted td { color:#6b6b70; font-size:10.5px; }
      .totals tr.strong td { font-size: 15px; font-weight:800; color:#fff; background:${c}; padding: 10px 12px; }
      .totals tr.strong td:first-child { border-radius: 10px 0 0 10px; } .totals tr.strong td:last-child { border-radius: 0 10px 10px 0; }
      .words { margin-top: 10px; font-size:10px; color:#55555a; font-style: italic; }
      .box { margin-top: 16px; } .box p { margin:0; font-size:10px; color:#45454a; }
      .taxtbl { margin-top: 6px; font-size: 9.5px; } .taxtbl th { text-align:left; color:#6b6b70; font-weight:600; border-bottom:1px solid #e3e3e6; padding:4px 4px 4px 0; } .taxtbl th.c-num{ text-align:right } .taxtbl td { padding: 4px 4px 4px 0; border-bottom:1px solid #f0f0f2; }
      .sign { margin-top: 26px; text-align:right; } .sign-for { font-size:10px; color:#6b6b70; } .sign-l { font-size:9.5px; border-top:1px solid #d6d6da; display:inline-block; padding-top:4px; margin-top:2px; color:#45454a; }
      .gen { position:absolute; bottom: 14px; left: 42px; right:42px; font-size:8px; color:#a0a0a6; letter-spacing:.12em; text-transform:uppercase; border-top:1px solid #efeff2; padding-top:8px; }
      .paid { top: 150px; right: 70px; }`;
    const meta = metaRows(ctx)
      .map(([k, v]) => `<tr><td>${k}</td><td class="c-num"><b>${e(v)}</b></td></tr>`)
      .join('');
    return page(
      css,
      `<div class="bar"></div><div class="wrap">
        ${ctx.showPaid ? '<div class="paid">PAID</div>' : ''}
        <div class="top">
          <div class="brand">${logoHtml(ctx, 58)}<div><div class="bname">${e(ctx.biz.name)}</div><div class="bsub">${bizLines(ctx)}</div></div></div>
          <div class="doc"><h1>${ctx.title}</h1><div class="no"># ${e(ctx.inv.number)}</div></div>
        </div>
        <div class="cards">
          <div class="card"><div class="lbl">${partyLabel(ctx)}</div><div class="pname">${e(ctx.inv.party_name || 'Cash Sale')}</div><div style="font-size:10px;color:#55555a">${partyLines(ctx)}</div></div>
          <div class="card"><div class="lbl">Details</div><table class="meta">${meta}</table></div>
        </div>
        ${itemsTable(ctx)}
        <div class="lower">
          <div class="left">
            <div class="lbl">Amount in words</div><div class="words" style="margin-top:0">${ctx.words}</div>
            ${taxTable(ctx) ? `<div class="box"><div class="lbl">Tax Summary</div>${taxTable(ctx)}</div>` : ''}
            ${bankHtml(ctx) ? `<div class="box" style="display:flex;gap:18px;align-items:center"><div><div class="lbl">Pay To</div><p>${bankHtml(ctx)}</p></div>${qrBlock(ctx)}</div>` : ''}
            ${termsText(ctx) ? `<div class="box"><div class="lbl">Terms & Conditions</div><p>${termsText(ctx)}</p></div>` : ''}
            ${notesText(ctx) ? `<div class="box"><div class="lbl">Notes</div><p>${notesText(ctx)}</p></div>` : ''}
          </div>
          <div class="right">${totalsTable(ctx)}${signBlock(ctx)}</div>
        </div>
      </div>${footNote(ctx)}`,
    );
  },
};

/* ======================= 2. NOIR — luxury dark ======================= */
const noir: TemplateDef = {
  id: 'noir',
  name: 'Noir Luxe',
  blurb: 'Deep band header with gilded hairlines.',
  premium: true,
  format: 'A4',
  palettes: ['#141414', '#142130', '#1F2A24', '#2A1622', '#1B1B2F', '#3A2A1A'],
  render: (ctx) => {
    const c = ctx.color;
    const gold = '#C8A45D';
    const css = `
      .head { background:${c}; color:#f4efe6; padding: 40px 46px 34px; position:relative; }
      .head:after { content:''; position:absolute; left:46px; right:46px; bottom:16px; height:1px; background:${gold}; opacity:.6; }
      .row { display:flex; justify-content:space-between; align-items:flex-end; }
      .bname { font: 400 28px/1.1 Didot, 'Bodoni 72', Georgia, serif; letter-spacing:.04em; }
      .bsub { font-size:9.5px; color: rgba(244,239,230,.7); margin-top:8px; max-width: 320px; }
      .doc { text-align:right; }
      .doc h1 { margin:0; font: 400 12px/1 -apple-system, Helvetica; letter-spacing:.42em; text-transform:uppercase; color:${gold}; }
      .doc .no { font: 400 26px/1.1 Didot, 'Bodoni 72', Georgia, serif; margin-top:8px; }
      .body { padding: 30px 46px 40px; }
      .grid { display:flex; gap: 30px; }
      .lbl { font-size:8.5px; letter-spacing:.32em; text-transform:uppercase; color:${gold}; font-weight:600; margin-bottom:8px; }
      .pname { font: 400 17px/1.2 Didot, Georgia, serif; margin-bottom:4px; }
      .meta td { padding: 3px 0; font-size:10.5px; } .meta td:first-child { color:#77736b; padding-right:18px; }
      .items { margin-top: 26px; }
      .items th { font-size:8.5px; letter-spacing:.22em; text-transform:uppercase; color:#77736b; padding:10px 6px; border-top:1px solid ${c}; border-bottom:1px solid ${c}; text-align:left; font-weight:600; }
      .items th.c-num { text-align:right; }
      .items td { padding: 11px 6px; border-bottom: 1px solid #ebe7df; }
      .items .it-name { font: 400 12.5px/1.3 Georgia, serif; }
      .items .tfoot td { border-bottom: 1px solid ${c}; font-weight:700; }
      .lower { display:flex; gap: 34px; margin-top: 22px; }
      .totals td { padding: 5px 0; } .totals tr.muted td { color:#77736b; }
      .totals tr.strong td { padding-top: 12px; border-top: 1px solid ${gold}; font: 400 20px/1.2 Didot, Georgia, serif; color:${c}; }
      .words { font: italic 11px/1.4 Georgia, serif; color:#5b574f; }
      p { margin:0; font-size:10px; color:#4a463f; }
      .box { margin-top: 16px; }
      .taxtbl { font-size:9.5px; } .taxtbl th { text-align:left; color:#77736b; font-weight:500; border-bottom:1px solid #e6e1d7; padding:4px 0; } .taxtbl th.c-num{text-align:right} .taxtbl td { padding:4px 0; }
      .sign { margin-top: 30px; text-align:right; } .sign-for { font: italic 10.5px Georgia, serif; color:#77736b; } .sign-l { font-size:8.5px; letter-spacing:.24em; text-transform:uppercase; border-top:1px solid ${gold}; display:inline-block; padding-top:5px; color:#4a463f; }
      .foot { position:absolute; left:0; right:0; bottom:0; height: 26px; background:${c}; display:flex; align-items:center; justify-content:center; }
      .foot span { color:${gold}; font-size:8px; letter-spacing:.4em; text-transform:uppercase; }
      .paid { top: 190px; right: 60px; }`;
    const meta = metaRows(ctx).map(([k, v]) => `<tr><td>${k}</td><td><b>${e(v)}</b></td></tr>`).join('');
    return page(
      css,
      `<div class="head"><div class="row">
          <div style="display:flex;gap:16px;align-items:center">${logoHtml(ctx, 56, { round: true, bg: gold, fg: c })}<div><div class="bname">${e(ctx.biz.name)}</div><div class="bsub">${bizLines(ctx, ' &nbsp;·&nbsp; ')}</div></div></div>
          <div class="doc"><h1>${ctx.title}</h1><div class="no">№ ${e(ctx.inv.number)}</div></div>
        </div></div>
        ${ctx.showPaid ? '<div class="paid">PAID</div>' : ''}
        <div class="body">
          <div class="grid">
            <div style="flex:1.3"><div class="lbl">${partyLabel(ctx)}</div><div class="pname">${e(ctx.inv.party_name || 'Cash Sale')}</div><p>${partyLines(ctx)}</p></div>
            <div style="flex:1"><div class="lbl">Particulars</div><table class="meta">${meta}</table></div>
          </div>
          ${itemsTable(ctx)}
          <div class="lower">
            <div style="flex:1.2">
              <div class="lbl">In words</div><div class="words">${ctx.words}</div>
              ${taxTable(ctx) ? `<div class="box"><div class="lbl">Tax</div>${taxTable(ctx)}</div>` : ''}
              ${bankHtml(ctx) ? `<div class="box" style="display:flex;gap:18px;align-items:center"><div><div class="lbl">Remit To</div><p>${bankHtml(ctx)}</p></div>${qrBlock(ctx)}</div>` : ''}
              ${termsText(ctx) ? `<div class="box"><div class="lbl">Terms</div><p>${termsText(ctx)}</p></div>` : ''}
              ${notesText(ctx) ? `<div class="box"><div class="lbl">Notes</div><p>${notesText(ctx)}</p></div>` : ''}
            </div>
            <div style="flex:1">${totalsTable(ctx)}${signBlock(ctx, c)}</div>
          </div>
        </div>
        <div class="foot"><span>Thank you for your patronage</span></div>`,
    );
  },
};

/* ======================= 3. ATELIER — boutique centred ======================= */
const atelier: TemplateDef = {
  id: 'atelier',
  name: 'Atelier',
  blurb: 'Boutique monogram, centred and graceful.',
  premium: true,
  format: 'A4',
  palettes: ['#2B2B2E', '#6B3F69', '#2F6F5E', '#8A5A44', '#1D2D3D', '#A8823A'],
  render: (ctx) => {
    const c = ctx.color;
    const css = `
      .wrap { padding: 40px 54px 40px; }
      .crest { text-align:center; }
      .crest .mono { display:inline-block; }
      .bname { font: 400 32px/1.1 Didot, 'Bodoni 72', Georgia, serif; margin-top: 12px; color:${c}; letter-spacing:.02em; }
      .tag { font-size:9px; letter-spacing:.42em; text-transform:uppercase; color:#8a8a90; margin-top:6px; }
      .bsub { font-size:9.5px; color:#6b6b70; margin-top: 10px; }
      .orn { display:flex; align-items:center; gap: 12px; margin: 20px 0 6px; }
      .orn i { flex:1; height:1px; background:${c}; opacity:.35; }
      .orn b { font: 400 11px/1 -apple-system, Helvetica; letter-spacing:.5em; text-transform:uppercase; color:${c}; }
      .meta { display:flex; justify-content:space-between; font-size:10px; color:#55555a; margin: 10px 0 18px; }
      .lbl { font-size:8.5px; letter-spacing:.3em; text-transform:uppercase; color:#8a8a90; margin-bottom:5px; }
      .pname { font: 400 16px/1.2 Georgia, serif; color:${c}; }
      .items th { font: 600 8.5px/1 -apple-system, Helvetica; letter-spacing:.2em; text-transform:uppercase; color:${c}; padding:10px 6px; border-bottom: 1.5px solid ${c}; text-align:left; }
      .items th.c-num { text-align:right; }
      .items td { padding: 10px 6px; border-bottom: 1px dashed #dcdce0; }
      .items .it-name { font: 400 12px Georgia, serif; }
      .items .tfoot td { border-bottom: none; font-weight:700; }
      .lower { display:flex; gap:30px; margin-top: 16px; }
      .totals td { padding: 4px 0; } .totals tr.muted td { color:#8a8a90; }
      .totals tr.strong td { font: 400 19px Georgia, serif; color:${c}; border-top: 1.5px solid ${c}; border-bottom:1.5px solid ${c}; padding: 9px 0; }
      p { margin:0; font-size:10px; color:#55555a; }
      .box { margin-top: 14px; }
      .words { font: italic 11px Georgia, serif; color:#55555a; }
      .taxtbl { font-size:9.5px; } .taxtbl th { text-align:left; font-weight:500; color:#8a8a90; padding:3px 0; } .taxtbl th.c-num{text-align:right} .taxtbl td{ padding:3px 0; }
      .sign { margin-top: 26px; text-align:center; } .sign svg { margin: 4px auto 2px !important; } .sign-for { font: italic 10.5px Georgia, serif; color:#8a8a90; } .sign-l { font-size:8.5px; letter-spacing:.24em; text-transform:uppercase; color:#55555a; }
      .thanks { text-align:center; margin-top: 26px; font: italic 15px Georgia, serif; color:${c}; }
      .paid { top: 60px; right: 50px; }`;
    const meta = metaRows(ctx).map(([k, v]) => `<span>${k}: <b>${e(v)}</b></span>`).join('');
    return page(
      css,
      `<div class="wrap">
        ${ctx.showPaid ? '<div class="paid">PAID</div>' : ''}
        <div class="crest"><div class="mono">${logoHtml(ctx, 74, { round: true, bg: c })}</div>
          <div class="bname">${e(ctx.biz.name)}</div>
          ${ctx.biz.tagline ? `<div class="tag">${e(ctx.biz.tagline)}</div>` : ''}
          <div class="bsub">${bizLines(ctx, ' &nbsp;·&nbsp; ')}</div>
        </div>
        <div class="orn"><i></i><b>${ctx.title}</b><i></i></div>
        <div class="meta">${meta}</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:16px">
          <div><div class="lbl">${partyLabel(ctx)}</div><div class="pname">${e(ctx.inv.party_name || 'Cash Sale')}</div><p>${partyLines(ctx)}</p></div>
        </div>
        ${itemsTable(ctx)}
        <div class="lower">
          <div style="flex:1.2">
            <div class="lbl">Amount in words</div><div class="words">${ctx.words}</div>
            ${taxTable(ctx) ? `<div class="box"><div class="lbl">Tax Summary</div>${taxTable(ctx)}</div>` : ''}
            ${bankHtml(ctx) ? `<div class="box" style="display:flex;gap:18px;align-items:center"><div><div class="lbl">Payment</div><p>${bankHtml(ctx)}</p></div>${qrBlock(ctx)}</div>` : ''}
            ${termsText(ctx) ? `<div class="box"><div class="lbl">Terms</div><p>${termsText(ctx)}</p></div>` : ''}
            ${notesText(ctx) ? `<div class="box"><div class="lbl">Notes</div><p>${notesText(ctx)}</p></div>` : ''}
          </div>
          <div style="flex:1">${totalsTable(ctx)}${signBlock(ctx, c)}</div>
        </div>
        <div class="thanks">— with gratitude —</div>
      </div>`,
    );
  },
};

/* ======================= 4. LEDGER — classic GST grid ======================= */
const ledger: TemplateDef = {
  id: 'ledger',
  name: 'Ledger GST',
  blurb: 'Bordered statutory format. Every field, in its box.',
  format: 'A4',
  palettes: ['#1D1F20', '#1D2D3D', '#5980A6', '#2F6F5E', '#7A1E2C', '#4B5563'],
  render: (ctx) => {
    const c = ctx.color;
    const B = `1px solid ${c}`;
    const css = `
      .wrap { padding: 26px; }
      .frame { border: ${B}; }
      .title { text-align:center; font: 700 13px/1 -apple-system, Helvetica; letter-spacing:.2em; text-transform:uppercase; padding: 8px; border-bottom:${B}; background:${tint(c, 0.92)}; color:${c}; }
      .hdr { display:flex; border-bottom:${B}; }
      .hdr > div { padding: 10px 12px; }
      .bname { font-size: 17px; font-weight:800; color:${c}; }
      .bsub { font-size:9.5px; color:#3d3d40; margin-top:3px; }
      .two { display:flex; border-bottom:${B}; }
      .two > div { flex:1; padding: 9px 12px; }
      .two > div + div { border-left:${B}; }
      .lbl { font-size:8.5px; font-weight:700; text-transform:uppercase; color:${c}; letter-spacing:.08em; margin-bottom:4px; }
      .pname { font-size: 12.5px; font-weight:700; }
      .meta td { padding: 2px 0; font-size: 10px; } .meta td:first-child { color:#55555a; width: 100px; }
      .items th { background:${tint(c, 0.92)}; color:${c}; font-size:9px; text-transform:uppercase; padding: 7px 6px; border-bottom:${B}; text-align:left; }
      .items th + th, .items td + td { border-left:${B}; }
      .items th.c-num { text-align:right; }
      .items td { padding: 7px 6px; vertical-align:top; }
      .items tbody tr:not(.tfoot) td { border-bottom: 1px solid ${rgba(c, 0.15)}; }
      .items .tfoot td { border-top:${B}; border-bottom:${B}; font-weight:800; background:${tint(c, 0.95)}; }
      .lower { display:flex; }
      .lower > div { padding: 10px 12px; }
      .lower > div + div { border-left:${B}; }
      .totals td { padding: 3px 0; font-size:10.5px; }
      .totals tr.strong td { font-size: 13px; font-weight:800; border-top:${B}; border-bottom:${B}; padding:6px 0; color:${c}; }
      .taxtbl { font-size: 9.5px; margin-top:4px; } .taxtbl th, .taxtbl td { border: 1px solid ${rgba(c, 0.35)}; padding: 3px 5px; text-align:left; } .taxtbl .c-num { text-align:right; }
      p { margin: 0; font-size: 10px; }
      .sec + .sec { margin-top: 10px; }
      .sign { text-align:right; margin-top: 12px; } .sign-for { font-size:10px; font-weight:700; } .sign-l { font-size:9.5px; }
      .gen { text-align:center; font-size:8px; color:#8a8a90; margin-top:8px; }
      .paid { top: 110px; right: 70px; }`;
    const meta = metaRows(ctx).map(([k, v]) => `<tr><td>${k}</td><td><b>${e(v)}</b></td></tr>`).join('');
    return page(
      css,
      `<div class="wrap"><div class="frame">
        ${ctx.showPaid ? '<div class="paid">PAID</div>' : ''}
        <div class="title">${ctx.title}</div>
        <div class="hdr"><div>${logoHtml(ctx, 54)}</div><div style="flex:1"><div class="bname">${e(ctx.biz.name)}</div><div class="bsub">${bizLines(ctx)}</div></div></div>
        <div class="two">
          <div><div class="lbl">${partyLabel(ctx)}</div><div class="pname">${e(ctx.inv.party_name || 'Cash Sale')}</div><p>${partyLines(ctx)}</p></div>
          <div><div class="lbl">Invoice Details</div><table class="meta">${meta}</table></div>
        </div>
        ${itemsTable(ctx, { showHsn: true })}
        <div class="lower">
          <div style="flex:1.25">
            <div class="sec"><div class="lbl">Invoice Amount in Words</div><p>${ctx.words}</p></div>
            ${taxTable(ctx) ? `<div class="sec"><div class="lbl">Tax Breakup</div>${taxTable(ctx)}</div>` : ''}
            ${bankHtml(ctx) ? `<div class="sec" style="display:flex;gap:14px;align-items:center"><div><div class="lbl">Bank Details</div><p>${bankHtml(ctx)}</p></div>${qrBlock(ctx)}</div>` : ''}
            ${termsText(ctx) ? `<div class="sec"><div class="lbl">Terms & Conditions</div><p>${termsText(ctx)}</p></div>` : ''}
            ${notesText(ctx) ? `<div class="sec"><div class="lbl">Notes</div><p>${notesText(ctx)}</p></div>` : ''}
          </div>
          <div style="flex:1">${totalsTable(ctx)}${signBlock(ctx)}</div>
        </div>
      </div><div class="gen">This is a computer generated invoice · Ascel Bill</div></div>`,
    );
  },
};

/* ======================= 5. SPLIT — sidebar ======================= */
const split: TemplateDef = {
  id: 'split',
  name: 'Slate Split',
  blurb: 'Bold colour column for your brand story.',
  premium: true,
  format: 'A4',
  palettes: BRAND,
  render: (ctx) => {
    const c = ctx.color;
    const css = `
      .layout { display:flex; min-height: 297mm; }
      .side { width: 66mm; background:${c}; color:#fff; padding: 36px 24px; position:relative; }
      .side .bname { font: 400 22px/1.15 Georgia, serif; margin-top: 16px; }
      .side .bsub { font-size:9.5px; color: rgba(255,255,255,.75); margin-top: 10px; line-height:1.6; }
      .side .lbl { color: rgba(255,255,255,.6); }
      .side p { color: rgba(255,255,255,.9) !important; }
      .side .sec { margin-top: 26px; }
      .side .qr-svg { background:#fff; padding: 6px; border-radius: 8px; }
      .side .qr-l { color:#fff; }
      .main { flex:1; padding: 40px 34px 30px; position:relative; }
      .lbl { font-size:8.5px; letter-spacing:.24em; text-transform:uppercase; font-weight:700; color:${c}; margin-bottom:6px; }
      h1 { margin:0; font: 800 34px/1 -apple-system, Helvetica; letter-spacing:-.01em; color:${c}; }
      .no { color:#6b6b70; margin-top:6px; font-size:11px; }
      .meta { display:flex; gap: 22px; margin-top: 18px; padding: 12px 0; border-top: 1px solid #ececef; border-bottom:1px solid #ececef; }
      .meta div b { display:block; font-size: 11px; margin-top: 2px; }
      .meta div span { font-size: 8.5px; letter-spacing:.16em; text-transform:uppercase; color:#8a8a90; }
      .pname { font-size:15px; font-weight:700; }
      p { margin:0; font-size:10px; color:#55555a; }
      .items { margin-top: 20px; }
      .items th { font-size:8.5px; letter-spacing:.14em; text-transform:uppercase; color:#8a8a90; padding: 8px 5px; border-bottom: 2px solid ${c}; text-align:left; }
      .items th.c-num { text-align:right; }
      .items td { padding: 9px 5px; border-bottom: 1px solid #efeff2; }
      .items .it-name { font-weight:600; }
      .items .tfoot td { font-weight:800; border-bottom: none; }
      .totals { margin-top: 10px; width: 62%; margin-left: auto; }
      .totals td { padding: 4px 0; } .totals tr.muted td { color:#8a8a90; }
      .totals tr.strong td { font-size: 16px; font-weight:800; color:${c}; border-top: 2px solid ${c}; padding-top: 9px; }
      .words { font-size:10px; color:#55555a; font-style:italic; margin-top: 10px; text-align:right; }
      .taxtbl { font-size:9.5px; margin-top: 14px; } .taxtbl th { text-align:left; color:#8a8a90; font-weight:600; padding: 3px 0; border-bottom:1px solid #ececef } .taxtbl th.c-num{text-align:right} .taxtbl td{ padding:3px 0; }
      .sign { text-align:right; margin-top: 22px; } .sign-for { font-size:10px; color:#8a8a90; } .sign-l { font-size:9.5px; border-top: 1px solid #d6d6da; display:inline-block; padding-top: 4px; }
      .paid { top: 40px; right: 40px; }`;
    const meta = metaRows(ctx).map(([k, v]) => `<div><span>${k}</span><b>${e(v)}</b></div>`).join('');
    return page(
      css,
      `<div class="layout">
        <div class="side">
          ${logoHtml(ctx, 60, { bg: '#ffffff', fg: c })}
          <div class="bname">${e(ctx.biz.name)}</div>
          <div class="bsub">${bizLines(ctx)}</div>
          ${bankHtml(ctx) ? `<div class="sec"><div class="lbl">Payment Info</div><p style="font-size:10px;line-height:1.6">${bankHtml(ctx)}</p></div>` : ''}
          ${ctx.qr ? `<div class="sec">${qrBlock(ctx)}</div>` : ''}
          ${termsText(ctx) ? `<div class="sec"><div class="lbl">Terms</div><p style="font-size:9.5px">${termsText(ctx)}</p></div>` : ''}
        </div>
        <div class="main">
          ${ctx.showPaid ? '<div class="paid">PAID</div>' : ''}
          <h1>${ctx.title}</h1><div class="no"># ${e(ctx.inv.number)}</div>
          <div class="meta">${meta}</div>
          <div style="margin-top:18px"><div class="lbl">${partyLabel(ctx)}</div><div class="pname">${e(ctx.inv.party_name || 'Cash Sale')}</div><p>${partyLines(ctx)}</p></div>
          ${itemsTable(ctx)}
          ${totalsTable(ctx)}
          <div class="words">${ctx.words}</div>
          ${taxTable(ctx)}
          ${notesText(ctx) ? `<div style="margin-top:14px"><div class="lbl">Notes</div><p>${notesText(ctx)}</p></div>` : ''}
          ${signBlock(ctx)}
        </div>
      </div>`,
    );
  },
};

/* ======================= 6. WAVE — dual tone curves ======================= */
const wave: TemplateDef = {
  id: 'wave',
  name: 'Tidal',
  blurb: 'Two-tone flowing header and footer.',
  premium: true,
  format: 'A4',
  palettes: DUO,
  render: (ctx) => {
    const [c, c2] = ctx.color.includes('|') ? ctx.color.split('|') : [ctx.color, tint(ctx.color, 0.55)];
    const css = `
      .hdr { position:relative; height: 178px; }
      .hdr svg { position:absolute; inset:0; width:100%; height:100%; }
      .hdr .in { position:relative; display:flex; justify-content:space-between; padding: 30px 40px; color:#fff; }
      .bname { font: 700 21px/1.1 -apple-system, Helvetica; }
      .bsub { font-size:9.5px; opacity:.85; margin-top: 5px; max-width: 360px; }
      .doc { text-align:right; }
      .doc h1 { margin:0; font: 800 26px/1 -apple-system, Helvetica; letter-spacing:.06em; text-transform:uppercase; }
      .doc .no { font-size: 11px; opacity:.9; margin-top: 6px; }
      .wrap { padding: 10px 40px 80px; }
      .lbl { font-size:8.5px; letter-spacing:.2em; text-transform:uppercase; font-weight:800; color:${c}; margin-bottom:5px; }
      .pname { font-size: 14px; font-weight:700; }
      p { margin:0; font-size:10px; color:#55555a; }
      .meta td { padding:2px 0; font-size:10.5px; } .meta td:first-child { color:#8a8a90; padding-right: 14px; }
      .items { margin-top: 20px; }
      .items th { background:${c}; color:#fff; font-size:9px; text-transform:uppercase; letter-spacing:.1em; padding: 9px 7px; text-align:left; }
      .items th.c-num { text-align:right; }
      .items td { padding: 9px 7px; }
      .items tbody tr:nth-child(even):not(.tfoot) td { background:${tint(c2, 0.82)}; }
      .items .it-name { font-weight:600; }
      .items .tfoot td { background:${c2}; color:${isLight(c2) ? '#1d1f20' : '#fff'}; font-weight:800; }
      .lower { display:flex; gap: 26px; margin-top: 18px; }
      .totals td { padding: 4px 8px; } .totals tr.muted td { color:#8a8a90; }
      .totals tr.strong td { background:${c}; color:#fff; font-size: 15px; font-weight:800; padding: 9px 8px; }
      .words { font-size: 10px; color:#55555a; font-style: italic; }
      .box { margin-top: 14px; }
      .taxtbl { font-size: 9.5px; } .taxtbl th { text-align:left; color:#8a8a90; padding: 3px 0; border-bottom: 1px solid #e5e5e8; } .taxtbl th.c-num{text-align:right} .taxtbl td{ padding: 3px 0; }
      .sign { text-align:right; margin-top: 24px; } .sign-for { font-size: 10px; color:#8a8a90; } .sign-l { font-size: 9.5px; font-weight:700; color:${c}; }
      .ftr { position:absolute; left:0; right:0; bottom:0; height: 60px; }
      .ftr svg { width:100%; height:100%; display:block; }
      .paid { top: 196px; right: 60px; }`;
    const meta = metaRows(ctx).map(([k, v]) => `<tr><td>${k}</td><td><b>${e(v)}</b></td></tr>`).join('');
    return page(
      css,
      `<div class="hdr">
        <svg viewBox="0 0 800 178" preserveAspectRatio="none"><path d="M0,0 H800 V128 C620,178 430,100 250,145 C150,170 60,155 0,138 Z" fill="${c2}"/><path d="M0,0 H800 V112 C600,160 420,84 240,128 C140,152 60,140 0,124 Z" fill="${c}"/></svg>
        <div class="in"><div style="display:flex;gap:14px;align-items:center">${logoHtml(ctx, 52, { bg: '#fff', fg: c })}<div><div class="bname">${e(ctx.biz.name)}</div><div class="bsub">${bizLines(ctx, ' · ')}</div></div></div>
        <div class="doc"><h1>${ctx.title}</h1><div class="no"># ${e(ctx.inv.number)}</div></div></div>
      </div>
      ${ctx.showPaid ? '<div class="paid">PAID</div>' : ''}
      <div class="wrap">
        <div style="display:flex;justify-content:space-between;gap:20px">
          <div style="flex:1.3"><div class="lbl">${partyLabel(ctx)}</div><div class="pname">${e(ctx.inv.party_name || 'Cash Sale')}</div><p>${partyLines(ctx)}</p></div>
          <div><div class="lbl">Details</div><table class="meta">${meta}</table></div>
        </div>
        ${itemsTable(ctx)}
        <div class="lower">
          <div style="flex:1.2">
            <div class="lbl">Amount in words</div><div class="words">${ctx.words}</div>
            ${taxTable(ctx) ? `<div class="box"><div class="lbl">Tax Summary</div>${taxTable(ctx)}</div>` : ''}
            ${bankHtml(ctx) ? `<div class="box" style="display:flex;gap:16px;align-items:center"><div><div class="lbl">Bank Details</div><p>${bankHtml(ctx)}</p></div>${qrBlock(ctx)}</div>` : ''}
            ${termsText(ctx) ? `<div class="box"><div class="lbl">Terms</div><p>${termsText(ctx)}</p></div>` : ''}
            ${notesText(ctx) ? `<div class="box"><div class="lbl">Notes</div><p>${notesText(ctx)}</p></div>` : ''}
          </div>
          <div style="flex:1">${totalsTable(ctx)}${signBlock(ctx)}</div>
        </div>
      </div>
      <div class="ftr"><svg viewBox="0 0 800 60" preserveAspectRatio="none"><path d="M0,30 C200,0 420,60 800,18 V60 H0 Z" fill="${c2}"/><path d="M0,44 C240,18 480,64 800,34 V60 H0 Z" fill="${c}"/></svg></div>`,
    );
  },
};

/* ======================= 7. SWISS — minimal grid ======================= */
const swiss: TemplateDef = {
  id: 'swiss',
  name: 'Swiss Mono',
  blurb: 'Minimal grid, oversized total, mono numerals.',
  format: 'A4',
  palettes: ['#1D1F20', '#E2412E', '#1D4ED8', '#0F766E', '#5980A6', '#7C3AED'],
  render: (ctx) => {
    const c = ctx.color;
    const mono = `Menlo, 'SF Mono', Courier, monospace`;
    const css = `
      .wrap { padding: 44px 48px; }
      .top { display:flex; justify-content:space-between; align-items:flex-start; }
      .bname { font: 800 15px/1.2 -apple-system, Helvetica; text-transform:uppercase; letter-spacing:.06em; }
      .bsub { font-size:9.5px; color:#6b6b70; margin-top:6px; }
      .big { margin-top: 40px; display:flex; justify-content:space-between; align-items:flex-end; border-bottom: 3px solid ${c}; padding-bottom: 14px; }
      .big h1 { margin:0; font: 800 56px/0.9 -apple-system, Helvetica; letter-spacing:-.03em; }
      .big .amt { text-align:right; }
      .big .amt span { font: 600 9px/1 -apple-system; letter-spacing:.24em; text-transform:uppercase; color:#8a8a90; }
      .big .amt b { display:block; font: 700 26px/1.1 ${mono}; color:${c}; margin-top: 6px; }
      .grid { display:flex; margin-top: 18px; }
      .grid > div { flex:1; }
      .lbl { font: 700 8.5px/1 -apple-system; letter-spacing:.22em; text-transform:uppercase; color:#8a8a90; margin-bottom: 7px; }
      .pname { font-weight:700; font-size:13px; }
      p { margin:0; font-size:10px; color:#45454a; }
      .meta td { padding: 2px 0; font: 10px ${mono}; } .meta td:first-child { color:#8a8a90; font-family: -apple-system, Helvetica; padding-right: 14px; }
      .items { margin-top: 26px; }
      .items th { font: 700 8.5px/1 -apple-system; letter-spacing:.2em; text-transform:uppercase; color:#8a8a90; padding: 8px 4px; text-align:left; border-bottom:1px solid #1d1f20; }
      .items th.c-num { text-align:right; }
      .items td { padding: 10px 4px; border-bottom:1px solid #e9e9ec; }
      .items td.c-num { font-family: ${mono}; font-size: 10px; }
      .items .it-name { font-weight:600; }
      .items .tfoot td { font-weight:800; border-bottom: none; }
      .lower { display:flex; gap: 30px; margin-top: 20px; }
      .totals td { padding: 4px 0; } .totals td.c-num { font-family:${mono}; }
      .totals tr.muted td { color:#8a8a90; }
      .totals tr.strong td { border-top: 1px solid #1d1f20; font-weight:800; font-size: 13px; padding-top: 8px; color:${c}; }
      .box { margin-top: 16px; }
      .taxtbl { font-size:9.5px; } .taxtbl th { text-align:left; color:#8a8a90; font-weight:600; padding:3px 0; } .taxtbl th.c-num{text-align:right} .taxtbl td { padding:3px 0; font-family:${mono}; }
      .sign { margin-top: 24px; } .sign svg { margin: 4px 0 2px 0 !important; } .sign-for { font-size:10px; color:#8a8a90; } .sign-l { font-size:9.5px; font-weight:700; }
      .gen { position:absolute; bottom: 20px; left: 48px; font: 8px ${mono}; color:#a0a0a6; }
      .paid { top: 120px; right: 60px; }`;
    const meta = metaRows(ctx).map(([k, v]) => `<tr><td>${k}</td><td>${e(v)}</td></tr>`).join('');
    return page(
      css,
      `<div class="wrap">
        ${ctx.showPaid ? '<div class="paid">PAID</div>' : ''}
        <div class="top"><div style="display:flex;gap:12px;align-items:center">${logoHtml(ctx, 40, { bg: c })}<div><div class="bname">${e(ctx.biz.name)}</div><div class="bsub">${bizLines(ctx, ' / ')}</div></div></div></div>
        <div class="big"><h1>${ctx.title.replace(' ', '<br/>')}</h1><div class="amt"><span>${docMeta(ctx.inv.type).pay ? 'Amount due' : 'Total'}</span><b>${m(ctx, docMeta(ctx.inv.type).pay ? ctx.balance : ctx.inv.total)}</b></div></div>
        <div class="grid">
          <div><div class="lbl">${partyLabel(ctx)}</div><div class="pname">${e(ctx.inv.party_name || 'Cash Sale')}</div><p>${partyLines(ctx)}</p></div>
          <div><div class="lbl">Reference</div><table class="meta">${meta}</table></div>
        </div>
        ${itemsTable(ctx)}
        <div class="lower">
          <div style="flex:1.2">
            <div class="lbl">In words</div><p>${ctx.words}</p>
            ${taxTable(ctx) ? `<div class="box"><div class="lbl">Tax</div>${taxTable(ctx)}</div>` : ''}
            ${bankHtml(ctx) ? `<div class="box" style="display:flex;gap:16px;align-items:center"><div><div class="lbl">Bank</div><p>${bankHtml(ctx)}</p></div>${qrBlock(ctx)}</div>` : ''}
            ${termsText(ctx) ? `<div class="box"><div class="lbl">Terms</div><p>${termsText(ctx)}</p></div>` : ''}
            ${notesText(ctx) ? `<div class="box"><div class="lbl">Notes</div><p>${notesText(ctx)}</p></div>` : ''}
          </div>
          <div style="flex:1">${totalsTable(ctx)}${signBlock(ctx)}</div>
        </div>
      </div><div class="gen">${e(ctx.inv.number)} — ascel bill</div>`,
    );
  },
};

/* ======================= 8. THERMAL — 80mm receipt ======================= */
const thermal: TemplateDef = {
  id: 'thermal',
  name: 'Thermal 80mm',
  blurb: 'Receipt roll for counter printers.',
  format: 'Thermal',
  palettes: ['#000000'],
  render: (ctx) => {
    const mono = `Menlo, 'SF Mono', Courier, monospace`;
    const css = `
      body { font: 10px/1.4 ${mono}; color:#000; }
      .wrap { padding: 14px 12px 20px; }
      .c { text-align:center; }
      .bname { font: 700 15px/1.2 Georgia, serif; margin-top: 6px; }
      .dash { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display:flex; justify-content:space-between; gap: 6px; }
      .t { font-weight:700; letter-spacing:.2em; text-transform:uppercase; }
      .it { margin: 4px 0; }
      .it .n { font-weight:700; }
      .tot { font-weight:700; font-size: 13px; }
      .qr-svg svg { width: 110px; height: 110px; }
      .qr { flex-direction: column; text-align:center; }`;
    const lines = ctx.inv.lines
      .map(
        (l) => `<div class="it"><div class="n">${e(l.name)}</div><div class="row"><span>${qtyFmt(l.qty)} x ${n2(l.rate)}${l.tax_rate ? ` +${l.tax_rate}%` : ''}</span><span>${n2(l.amount)}</span></div></div>`,
      )
      .join('');
    const tots = totalRows(ctx)
      .map((r) => `<div class="row ${r.strong ? 'tot' : ''}"><span>${r.label}</span><span>${r.value}</span></div>`)
      .join('');
    return page(
      css,
      `<div class="wrap">
        <div class="c">${logoHtml(ctx, 46, { round: true, bg: '#000' })}<div class="bname">${e(ctx.biz.name)}</div><div>${bizLines(ctx)}</div></div>
        <div class="dash"></div>
        <div class="c t">${ctx.title}</div>
        <div class="row"><span>No: ${e(ctx.inv.number)}</span><span>${e(ctx.inv.date)}</span></div>
        ${ctx.inv.party_name ? `<div>To: ${e(ctx.inv.party_name)}${ctx.inv.party_phone ? ` (${e(ctx.inv.party_phone)})` : ''}</div>` : ''}
        <div class="dash"></div>
        ${lines}
        <div class="dash"></div>
        ${tots}
        <div class="dash"></div>
        <div style="font-size:9px">${ctx.words}</div>
        ${ctx.qr ? `<div class="dash"></div><div class="c" style="display:flex;justify-content:center">${qrBlock(ctx)}</div>` : ''}
        ${termsText(ctx) ? `<div class="dash"></div><div class="c" style="font-size:9px">${termsText(ctx)}</div>` : ''}
        <div class="dash"></div><div class="c" style="font-size:8.5px">Powered by Ascel Bill</div>
      </div>`,
      { width: '80mm', minHeight: 'auto' },
    );
  },
};

export const TEMPLATES: TemplateDef[] = [meridian, noir, atelier, ledger, split, wave, swiss, thermal];

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id) ?? meridian;
}

/** Choose a valid colour for the template (keeps the user's choice when it belongs to that palette family). */
export function resolveColor(t: TemplateDef, color: string) {
  return color && t.palettes.includes(color) ? color : t.palettes[0];
}

export function renderInvoiceHtml(biz: Business, inv: FullInvoice, templateId?: string, color?: string) {
  const t = getTemplate(templateId || inv.template || biz.template);
  const col = resolveColor(t, color || inv.color || biz.color);
  return t.render(buildCtx(biz, inv, col));
}

/** Points for expo-print. Thermal is 80mm wide (≈227pt), height grows with lines. */
export function pageSize(templateId: string, lineCount: number) {
  if (getTemplate(templateId).format === 'Thermal') {
    return { width: 227, height: Math.max(420, 380 + lineCount * 34) };
  }
  return { width: 595, height: 842 };
}
