import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Chip, Divider, Empty, KV, Row, Screen, Segmented, T } from '@/components/ui';
import { dashboardStats, getBusiness, gstSummary, salesByItem, salesByParty } from '@/db/repo';
import { money, toISO, todayISO } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

type Range = 'month' | 'last' | 'quarter' | 'year';
type Tab = 'overview' | 'party' | 'item' | 'gst';

function rangeOf(r: Range): [string, string] {
  const d = new Date();
  if (r === 'month') return [toISO(new Date(d.getFullYear(), d.getMonth(), 1)), todayISO()];
  if (r === 'last') return [toISO(new Date(d.getFullYear(), d.getMonth() - 1, 1)), toISO(new Date(d.getFullYear(), d.getMonth(), 0))];
  if (r === 'quarter') return [toISO(new Date(d.getFullYear(), d.getMonth() - 2, 1)), todayISO()];
  // Indian financial year: April → March
  const fyStart = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return [toISO(new Date(fyStart, 3, 1)), todayISO()];
}

export default function Reports() {
  const [range, setRange] = useState<Range>('month');
  const [tab, setTab] = useState<Tab>('overview');
  const [from, to] = rangeOf(range);
  const { data } = useData(
    async (db) => {
      const sales = await db.getFirstAsync<{ v: number; n: number }>(`SELECT COALESCE(SUM(total),0) AS v, COUNT(*) AS n FROM invoices WHERE type='sale' AND date BETWEEN ? AND ?`, from, to);
      const received = await db.getFirstAsync<{ v: number }>(`SELECT COALESCE(SUM(received),0) AS v FROM invoices WHERE type='sale' AND date BETWEEN ? AND ?`, from, to);
      const purchases = await db.getFirstAsync<{ v: number }>(`SELECT COALESCE(SUM(total),0) AS v FROM invoices WHERE type='purchase' AND date BETWEEN ? AND ?`, from, to);
      const expenses = await db.getFirstAsync<{ v: number }>(`SELECT COALESCE(SUM(amount),0) AS v FROM expenses WHERE date BETWEEN ? AND ?`, from, to);
      const cogs = await db.getFirstAsync<{ v: number }>(
        `SELECT COALESCE(SUM(l.qty * COALESCE(it.purchase_price,0)),0) AS v FROM invoice_items l
         JOIN invoices i ON i.id = l.invoice_id LEFT JOIN items it ON it.id = l.item_id
         WHERE i.type='sale' AND i.date BETWEEN ? AND ?`, from, to);
      const tax = await db.getFirstAsync<{ v: number }>(`SELECT COALESCE(SUM(tax),0) AS v FROM invoices WHERE type='sale' AND date BETWEEN ? AND ?`, from, to);
      return {
        biz: await getBusiness(db),
        stats: await dashboardStats(db),
        sales: sales?.v ?? 0,
        count: sales?.n ?? 0,
        received: received?.v ?? 0,
        purchases: purchases?.v ?? 0,
        expenses: expenses?.v ?? 0,
        cogs: cogs?.v ?? 0,
        tax: tax?.v ?? 0,
        byParty: await salesByParty(db, from, to),
        byItem: await salesByItem(db, from, to),
        gst: await gstSummary(db, from, to),
      };
    },
    [from, to],
  );
  const cur = data?.biz.currency ?? '₹';
  const grossProfit = data ? data.sales - data.tax - data.cogs : 0;
  const net = data ? grossProfit - data.expenses : 0;

  return (
    <Screen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <Chip label="This month" active={range === 'month'} onPress={() => setRange('month')} />
        <Chip label="Last month" active={range === 'last'} onPress={() => setRange('last')} />
        <Chip label="3 months" active={range === 'quarter'} onPress={() => setRange('quarter')} />
        <Chip label="This FY" active={range === 'year'} onPress={() => setRange('year')} />
      </ScrollView>
      <View style={{ marginTop: 14 }}>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'overview', label: 'Overview' }, { value: 'party', label: 'Parties' }, { value: 'item', label: 'Items' }, { value: 'gst', label: 'GST' }]} />
      </View>

      {data && tab === 'overview' ? (
        <>
          <Card dark style={{ marginTop: 16 }}>
            <T v="eyebrow" style={{ color: colors.tint }}>Net profit (est.)</T>
            <T v="display" style={{ color: net >= 0 ? colors.onInk : '#F0A39B', marginTop: 6 }}>{money(net, cur)}</T>
            <T v="small" style={{ color: colors.onInkMuted, fontSize: 12 }}>Sales − GST − cost of goods − expenses</T>
          </Card>
          <Card style={{ marginTop: 12 }}>
            <KV k={`Sales (${data.count} invoices)`} v={money(data.sales, cur)} />
            <KV k="Collected" v={money(data.received, cur)} color={colors.success} />
            <KV k="Outstanding" v={money(data.sales - data.received, cur)} color={colors.danger} />
            <Divider style={{ marginVertical: 8 }} />
            <KV k="GST collected" v={money(data.tax, cur)} />
            <KV k="Cost of goods sold" v={money(data.cogs, cur)} />
            <KV k="Gross profit" v={money(grossProfit, cur)} strong />
            <Divider style={{ marginVertical: 8 }} />
            <KV k="Purchases" v={money(data.purchases, cur)} />
            <KV k="Expenses" v={money(data.expenses, cur)} />
          </Card>
          <Card style={{ marginTop: 12 }}>
            <T v="eyebrow" style={{ marginBottom: 6 }}>Right now</T>
            <KV k="Receivable" v={money(data.stats.receivable, cur)} />
            <KV k="Payable" v={money(data.stats.payable, cur)} />
            <KV k="Stock value" v={money(data.stats.stockValue, cur)} />
            <KV k="Cash & bank (est.)" v={money(data.stats.cashIn, cur)} />
          </Card>
        </>
      ) : null}

      {data && tab === 'party' ? (
        data.byParty.length ? (
          <Card style={{ marginTop: 16 }}>
            {data.byParty.map((p, i) => (
              <View key={i}>
                {i ? <Divider /> : null}
                <Row style={{ justifyContent: 'space-between', paddingVertical: 10 }}>
                  <View style={{ flex: 1 }}>
                    <T v="h3">{p.party_name || 'Cash sale'}</T>
                    <T v="small" style={{ fontSize: 12 }}>{p.n} invoice{p.n > 1 ? 's' : ''}</T>
                  </View>
                  <T v="h3" style={{ fontFamily: fonts.bold }}>{money(p.total, cur)}</T>
                </Row>
              </View>
            ))}
          </Card>
        ) : <Empty icon="people-outline" title="No sales in this period" body="Pick another range." />
      ) : null}

      {data && tab === 'item' ? (
        data.byItem.length ? (
          <Card style={{ marginTop: 16 }}>
            {data.byItem.map((it, i) => {
              const max = data.byItem[0].amount || 1;
              return (
                <View key={i} style={{ paddingVertical: 9 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T v="h3" style={{ flex: 1 }} numberOfLines={1}>{it.name}</T>
                    <T v="h3">{money(it.amount, cur)}</T>
                  </Row>
                  <Row style={{ marginTop: 6 }}>
                    <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.paperSunk }}>
                      <View style={{ width: `${(it.amount / max) * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
                    </View>
                    <T v="small" style={{ fontSize: 11.5, width: 60, textAlign: 'right' }}>{it.qty} sold</T>
                  </Row>
                </View>
              );
            })}
          </Card>
        ) : <Empty icon="cube-outline" title="No items sold" body="Pick another range." />
      ) : null}

      {data && tab === 'gst' ? (
        data.gst.length ? (
          <Card style={{ marginTop: 16 }}>
            <Row style={{ paddingBottom: 8 }}>
              <T v="label" style={{ flex: 0.7 }}>Rate</T>
              <T v="label" style={{ flex: 1, textAlign: 'right' }}>Taxable</T>
              <T v="label" style={{ flex: 1, textAlign: 'right' }}>GST</T>
            </Row>
            <Divider />
            {data.gst.map((g) => (
              <Row key={g.tax_rate} style={{ paddingVertical: 10 }}>
                <T v="h3" style={{ flex: 0.7 }}>{g.tax_rate}%</T>
                <T v="body" style={{ flex: 1, textAlign: 'right' }}>{money(g.taxable, cur)}</T>
                <T v="h3" style={{ flex: 1, textAlign: 'right' }}>{money(g.tax, cur)}</T>
              </Row>
            ))}
            <Divider />
            <KV k="Total GST" v={money(data.gst.reduce((s, g) => s + g.tax, 0), cur)} strong />
          </Card>
        ) : <Empty icon="receipt-outline" title="No GST in this period" body="Taxed sales will be summarised here by rate." />
      ) : null}
    </Screen>
  );
}
