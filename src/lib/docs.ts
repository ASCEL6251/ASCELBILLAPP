import type { DocType } from '@/db/types';

/** Everything the app needs to know about one kind of transaction document. */
export interface DocMeta {
  /** Full name used in titles, e.g. "Sale Invoice". */
  label: string;
  /** Short uppercase tag shown on transaction cards. */
  badge: string;
  /** Title printed on the PDF. */
  printTitle: string;
  /** Number prefix (sale uses the business invoice prefix instead). */
  prefix: string;
  /** +1 adds stock, -1 removes it, 0 leaves stock alone. */
  stock: 1 | -1 | 0;
  /** Effect of the unpaid amount on the party balance: +1 they owe you, -1 you owe them. */
  balance: 1 | -1 | 0;
  /** Whether money can be received/paid against this document. */
  pay: boolean;
  /** Which side of the business this belongs to. */
  side: 'sale' | 'purchase';
  /** Party label on the form. */
  partyLabel: string;
}

export const DOCS: Record<DocType, DocMeta> = {
  sale: { label: 'Sale Invoice', badge: 'SALE', printTitle: 'Tax Invoice', prefix: '', stock: -1, balance: 1, pay: true, side: 'sale', partyLabel: 'Customer' },
  sale_return: { label: 'Sale Return', badge: 'CREDIT NOTE', printTitle: 'Credit Note', prefix: 'CN-', stock: 1, balance: -1, pay: true, side: 'sale', partyLabel: 'Customer' },
  estimate: { label: 'Estimate / Quotation', badge: 'ESTIMATE', printTitle: 'Estimate', prefix: 'EST-', stock: 0, balance: 0, pay: false, side: 'sale', partyLabel: 'Customer' },
  sale_order: { label: 'Sale Order', badge: 'SALE ORDER', printTitle: 'Sale Order', prefix: 'SO-', stock: 0, balance: 0, pay: false, side: 'sale', partyLabel: 'Customer' },
  delivery_challan: { label: 'Delivery Challan', badge: 'CHALLAN', printTitle: 'Delivery Challan', prefix: 'DC-', stock: 0, balance: 0, pay: false, side: 'sale', partyLabel: 'Customer' },
  purchase: { label: 'Purchase Bill', badge: 'PURCHASE', printTitle: 'Purchase Bill', prefix: 'PUR-', stock: 1, balance: -1, pay: true, side: 'purchase', partyLabel: 'Supplier' },
  purchase_return: { label: 'Purchase Return', badge: 'DEBIT NOTE', printTitle: 'Debit Note', prefix: 'DN-', stock: -1, balance: 1, pay: true, side: 'purchase', partyLabel: 'Supplier' },
  purchase_order: { label: 'Purchase Order', badge: 'PURCHASE ORDER', printTitle: 'Purchase Order', prefix: 'PO-', stock: 0, balance: 0, pay: false, side: 'purchase', partyLabel: 'Supplier' },
};

export const DOC_TYPES = Object.keys(DOCS) as DocType[];

export const docMeta = (t: string): DocMeta => DOCS[(t as DocType)] ?? DOCS.sale;

/** SQL CASE giving each document's sign on the party balance. */
export const BALANCE_SIGN_SQL = `CASE type ${DOC_TYPES.filter((t) => DOCS[t].balance !== 0)
  .map((t) => `WHEN '${t}' THEN ${DOCS[t].balance}`)
  .join(' ')} ELSE 0 END`;

/** SQL CASE giving each document's effect on cash: money received is +1, money paid out is -1. */
export const CASH_SIGN_SQL = BALANCE_SIGN_SQL;
