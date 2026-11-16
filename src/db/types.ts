export type DocType = 'sale' | 'estimate' | 'purchase';

export interface Business {
  id: number;
  name: string;
  tagline: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  state: string;
  pincode: string;
  gstin: string;
  logo: string;
  signature: string;
  bank_name: string;
  account_name: string;
  account_no: string;
  ifsc: string;
  upi: string;
  terms: string;
  invoice_prefix: string;
  template: string;
  color: string;
  currency: string;
  onboarded: number;
}

export interface Party {
  id: number;
  name: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  state: string;
  kind: 'customer' | 'supplier';
  opening_balance: number;
  created_at: string;
}

export interface PartyWithBalance extends Party {
  balance: number; // > 0: you'll get, < 0: you'll give
  last_date: string | null;
}

export interface Item {
  id: number;
  name: string;
  hsn: string;
  unit: string;
  category: string;
  sale_price: number;
  purchase_price: number;
  tax_rate: number;
  stock: number;
  min_stock: number;
  is_service: number;
  created_at: string;
}

export interface Invoice {
  id: number;
  type: DocType;
  number: string;
  party_id: number | null;
  party_name: string;
  party_phone: string;
  party_address: string;
  party_gstin: string;
  party_state: string;
  date: string;
  due_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  round_off: number;
  total: number;
  received: number;
  payment_mode: string;
  notes: string;
  terms: string;
  template: string;
  color: string;
  created_at: string;
}

export interface InvoiceLine {
  id?: number;
  invoice_id?: number;
  item_id: number | null;
  name: string;
  hsn: string;
  unit: string;
  qty: number;
  rate: number;
  discount: number;
  tax_rate: number;
  tax: number;
  amount: number;
}

export interface Payment {
  id: number;
  party_id: number;
  direction: 'in' | 'out';
  amount: number;
  date: string;
  mode: string;
  reference: string;
  note: string;
  created_at: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  note: string;
}

export interface FullInvoice extends Invoice {
  lines: InvoiceLine[];
}
