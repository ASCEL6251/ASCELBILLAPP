import type { SQLiteDatabase } from 'expo-sqlite';
import { addDays, todayISO } from '@/lib/format';
import { computeTotals } from '@/lib/calc';
import { saveInvoice, saveItem, saveParty, updateBusiness, addPayment, addExpense } from './repo';
import type { DocType, InvoiceLine } from './types';

/** A believable demo workspace so the app looks alive on first launch. */
export async function seedDemo(db: SQLiteDatabase) {
  await updateBusiness(db, {
    name: 'Chowdhury & Co.',
    tagline: 'Fine jewellery · Est. 1998',
    phone: '6294713465',
    email: 'hello@chowdhuryandco.in',
    address: 'Panthapara, Ranaghat, Nadia',
    state: 'West Bengal',
    pincode: '741201',
    gstin: '19CHAPC1394Q1ZD',
    bank_name: 'State Bank of India',
    account_name: 'Chowdhury & Co.',
    account_no: '44681055117',
    ifsc: 'SBIN0000146',
    upi: 'chowdhuryco@sbi',
    signature:
      'M30 90 C 50 30, 70 30, 80 80 S 110 120, 130 60 S 160 20, 175 70 C 185 100, 200 95, 215 60 M 200 85 L 290 55',
    onboarded: 1,
  });

  const parties = [
    { name: 'Sujoy Moulick', phone: '8942841651', state: 'West Bengal', address: 'Ranaghat, Nadia' },
    { name: 'Subrata Paul', phone: '9735918122', state: 'West Bengal', address: 'Krishnanagar' },
    { name: 'Mita Chowdhury', phone: '9735918123', state: 'West Bengal', address: 'Kalyani' },
    { name: 'Anusree Sarkar', phone: '9123456780', state: 'West Bengal', address: 'Barasat' },
    { name: 'Kalyani Dey', phone: '9007001122', state: 'Odisha', address: 'Bhubaneswar', gstin: '21AAKCD1234F1Z2' },
    { name: 'Gold Line Traders', phone: '9830098300', state: 'West Bengal', address: 'Bowbazar, Kolkata', kind: 'supplier' as const },
  ];
  const pids: number[] = [];
  for (const p of parties) pids.push(await saveParty(db, p));

  const items = [
    { name: 'Silver Bracelet', hsn: '7113', sale_price: 1450, purchase_price: 980, tax_rate: 3, stock: 14, min_stock: 4, category: 'Bracelets' },
    { name: 'Dhan Yog Bracelet', hsn: '7117', sale_price: 550, purchase_price: 320, tax_rate: 3, stock: 8, min_stock: 8, category: 'Stone Bracelets' },
    { name: 'Gold Plated Earrings', hsn: '7117', sale_price: 899, purchase_price: 410, tax_rate: 3, stock: 22, min_stock: 6, category: 'Earrings' },
    { name: 'Winter Ear Muff', hsn: '6505', sale_price: 300, purchase_price: 140, tax_rate: 12, stock: 2, min_stock: 5, category: 'Accessories' },
    { name: 'Jewellery Polishing', hsn: '9987', sale_price: 250, purchase_price: 0, tax_rate: 18, stock: 0, min_stock: 0, category: 'Services', is_service: 1, unit: 'job' },
  ];
  const iids: number[] = [];
  for (const it of items) iids.push(await saveItem(db, it));

  const line = (idx: number, qty: number): InvoiceLine => ({
    item_id: iids[idx],
    name: items[idx].name,
    hsn: items[idx].hsn,
    unit: items[idx].unit ?? 'pcs',
    qty,
    rate: items[idx].sale_price,
    discount: 0,
    tax_rate: items[idx].tax_rate,
    tax: 0,
    amount: 0,
  });

  const t = todayISO();
  const docs: { type: DocType; p: number; lines: InvoiceLine[]; date: string; paid: 'full' | 'part' | 'none'; template: string; color: string }[] = [
    { type: 'sale', p: 0, lines: [line(0, 1), line(4, 1)], date: t, paid: 'none', template: 'meridian', color: '#1D2D3D' },
    { type: 'sale', p: 1, lines: [line(2, 2)], date: addDays(t, -3), paid: 'part', template: 'noir', color: '#142130' },
    { type: 'sale', p: 2, lines: [line(1, 1), line(3, 1)], date: addDays(t, -9), paid: 'full', template: 'atelier', color: '#6B3F69' },
    { type: 'sale', p: 4, lines: [line(0, 2), line(2, 1)], date: addDays(t, -21), paid: 'part', template: 'ledger', color: '#1D2D3D' },
    { type: 'sale', p: 3, lines: [line(2, 1)], date: addDays(t, -38), paid: 'full', template: 'wave', color: '#1D2D3D|#94BCE3' },
    { type: 'sale', p: 0, lines: [line(0, 3)], date: addDays(t, -70), paid: 'full', template: 'meridian', color: '#5980A6' },
    { type: 'sale', p: 1, lines: [line(1, 4)], date: addDays(t, -100), paid: 'full', template: 'meridian', color: '#5980A6' },
    { type: 'estimate', p: 3, lines: [line(0, 5), line(2, 5)], date: addDays(t, -1), paid: 'none', template: 'split', color: '#2F6F5E' },
    { type: 'purchase', p: 5, lines: [{ ...line(0, 10), rate: 980 }], date: addDays(t, -15), paid: 'part', template: 'ledger', color: '#1D1F20' },
  ];

  const n: Record<string, number> = { sale: 0, estimate: 0, purchase: 0 };
  for (const d of [...docs].reverse()) {
    n[d.type]++;
    const tot = computeTotals(d.lines, { roundOff: true });
    const party = parties[d.p];
    const received = d.paid === 'full' ? tot.total : d.paid === 'part' ? Math.round(tot.total * 0.4) : 0;
    await saveInvoice(db, {
      type: d.type,
      number: d.type === 'sale' ? `INV-${n.sale}` : d.type === 'estimate' ? `EST-${n.estimate}` : `PUR-${n.purchase}`,
      party_id: pids[d.p],
      party_name: party.name,
      party_phone: party.phone,
      party_address: party.address,
      party_gstin: (party as any).gstin ?? '',
      party_state: party.state,
      date: d.date,
      due_date: d.type === 'estimate' ? addDays(d.date, 15) : addDays(d.date, 7),
      subtotal: tot.subtotal,
      discount: 0,
      tax: tot.tax,
      shipping: 0,
      round_off: tot.roundOff,
      total: tot.total,
      received: d.type === 'estimate' ? 0 : received,
      payment_mode: 'UPI',
      notes: '',
      terms: 'Goods once sold will not be taken back.\nThank you for doing business with us.',
      template: d.template,
      color: d.color,
      lines: d.lines,
    });
  }

  await addPayment(db, { party_id: pids[1], direction: 'in', amount: 500, date: addDays(t, -1), mode: 'UPI', reference: '', note: 'Part payment' });
  await addExpense(db, { category: 'Shop Rent', amount: 6000, date: addDays(t, -5), note: '' });
  await addExpense(db, { category: 'Electricity', amount: 1240, date: addDays(t, -2), note: '' });
}
