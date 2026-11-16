import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import type { Business, FullInvoice } from '@/db/types';
import { pageSize, renderInvoiceHtml } from '@/templates';
import { money } from './format';

function opts(biz: Business, inv: FullInvoice, template?: string, color?: string) {
  const tpl = template || inv.template || biz.template;
  const html = renderInvoiceHtml(biz, inv, tpl, color);
  return { html, ...pageSize(tpl, inv.lines.length) };
}

function safeName(s: string) {
  return s.replace(/[^a-z0-9\-_]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

export async function makePdf(biz: Business, inv: FullInvoice, template?: string, color?: string) {
  const { uri } = await Print.printToFileAsync(opts(biz, inv, template, color));
  // Give the file a human name: "Invoice_INV-12_Party.pdf"
  try {
    const kind = inv.type === 'estimate' ? 'Estimate' : inv.type === 'purchase' ? 'Bill' : 'Invoice';
    const name = `${safeName(`${kind}_${inv.number}_${inv.party_name || 'Cash'}`)}.pdf`;
    const target = new File(Paths.cache, name);
    if (target.exists) target.delete();
    await new File(uri).move(target);
    return target.uri;
  } catch {
    return uri;
  }
}

export async function sharePdf(biz: Business, inv: FullInvoice, template?: string, color?: string) {
  const uri = await makePdf(biz, inv, template, color);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Share ${inv.number}`,
    });
  }
  return uri;
}

export async function printInvoice(biz: Business, inv: FullInvoice, template?: string, color?: string) {
  await Print.printAsync(opts(biz, inv, template, color));
}

/** Opens WhatsApp with a ready-made payment message to the party's number. */
export async function whatsappReminder(biz: Business, inv: FullInvoice) {
  const due = Math.max(0, inv.total - inv.received);
  const text =
    inv.type === 'estimate'
      ? `Hello ${inv.party_name}, please find estimate ${inv.number} for ${money(inv.total, biz.currency)} from ${biz.name}.`
      : due > 0
        ? `Hello ${inv.party_name}, this is a gentle reminder from ${biz.name}: ${money(due, biz.currency)} is due on invoice ${inv.number}.${biz.upi ? ` Pay via UPI: ${biz.upi}` : ''} Thank you!`
        : `Hello ${inv.party_name}, thank you for your payment of ${money(inv.total, biz.currency)} against invoice ${inv.number}. — ${biz.name}`;
  const digits = inv.party_phone.replace(/\D/g, '');
  const phone = digits.length === 10 ? `91${digits}` : digits;
  const url = `whatsapp://send?${phone ? `phone=${phone}&` : ''}text=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url).catch(() => false);
  if (can) return Linking.openURL(url);
  return Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
}
