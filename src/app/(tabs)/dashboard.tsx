import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { ChartKind, Donut, Series, Sparkline, TrendChart } from '@/components/Charts';
import { Glyph, GlyphName } from '@/components/Glyph';
import { AppHeader, BalanceCard, IconTile, Panel } from '@/components/kit';
import { tap } from '@/components/ui';
import { dashboardStats, expensesByCategory, getBusiness, monthlySeries } from '@/db/repo';
import { money, moneyShort, todayISO } from '@/lib/format';
import { useData } from '@/lib/hooks';
import { colors, fonts } from '@/lib/theme';

const monthShort = (ym: string) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1).toLocaleString('en-IN', { month: 'short' });

type Metric = 'sales' | 'purchases' | 'expenses' | 'all';
const PERIODS = [3, 6, 12] as const;
const METRIC_COLOR: Record<Exclude<Metric, 'all'>, string> = { sales: colors.accent, purchases: colors.warn, expenses: colors.danger };
const DONUT = ['#5980A6', '#94BCE3', '#2F8F6B', '#D7A93F', '#C2483D', '#8D7FE0', '#1D2D3D'];

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(6);
  const [kind, setKind] = useState<ChartKind>('area');
  const [metric, setMetric] = useState<Metric>('sales');
  const [compare, setCompare] = useState(true);

  const { data } = useData(async (db) => ({
    biz: await getBusiness(db),
    s: await dashboardStats(db),
    m: await monthlySeries(db, 12),
    exp: await expensesByCategory(db, todayISO().slice(0, 7)),
  }));
  const cur = data?.biz.currency ?? '₹';
  const s = data?.s;

  const view = useMemo(() => {
    if (!data) return null;
    const cut = <T,>(a: T[]) => a.slice(a.length - period);
    const m = {
      months: cut(data.m.months),
      sales: cut(data.m.sales),
      salesLastYear: cut(data.m.salesLastYear),
      purchases: cut(data.m.purchases),
      expenses: cut(data.m.expenses),
    };
    const sales = sum(m.sales);
    const lastYear = sum(m.salesLastYear);
    const purchases = sum(m.purchases);
    const expenses = sum(m.expenses);
    return {
      ...m,
      labels: m.months.map(monthShort),
      total: { sales, purchases, expenses, profit: sales - purchases - expenses },
      growth: lastYear > 0 ? ((sales - lastYear) / lastYear) * 100 : sales > 0 ? null : 0,
    };
  }, [data, period]);

  const series: Series[] = useMemo(() => {
    if (!view) return [];
    const of = (k: Exclude<Metric, 'all'>): Series => ({
      key: k,
      label: k === 'sales' ? 'Sales' : k === 'purchases' ? 'Purchases' : 'Expenses',
      color: METRIC_COLOR[k],
      values: k === 'sales' ? view.sales : k === 'purchases' ? view.purchases : view.expenses,
    });
    if (metric === 'all') return [of('sales'), of('purchases'), of('expenses')];
    const out = [of(metric)];
    if (metric === 'sales' && compare) out.push({ key: 'ly', label: 'Same months last year', color: colors.tint, values: view.salesLastYear, dashed: true });
    return out;
  }, [view, metric, compare]);

  const chartW = width - 32 - 32;
  const expTotal = sum((data?.exp ?? []).map((e) => e.total));

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <AppHeader biz={data?.biz} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* period selector */}
        <View style={styles.periodRow}>
          <Text style={styles.h1}>Business insights</Text>
          <View style={styles.seg}>
            {PERIODS.map((p) => (
              <Pressable key={p} onPress={() => { tap(); setPeriod(p); }} style={[styles.segItem, period === p && styles.segOn]}>
                <Text style={[styles.segText, period === p && styles.segTextOn]}>{p}M</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <BalanceCard
          get={s?.receivable ?? 0}
          give={s?.payable ?? 0}
          currency={cur}
          onGet={() => router.push('/report?tab=party')}
          onGive={() => router.push('/report?tab=party')}
          style={{ marginTop: 10 }}
        />

        {/* KPI grid */}
        <View style={styles.kpiGrid}>
          <Kpi icon="receipt" tone={colors.accent} label="Sales" value={view?.total.sales ?? 0} cur={cur} spark={view?.sales} delta={view?.growth} onPress={() => router.push('/report?tab=sale')} />
          <Kpi icon="cart" tone={colors.warn} label="Purchases" value={view?.total.purchases ?? 0} cur={cur} spark={view?.purchases} onPress={() => router.push('/report?tab=overview')} />
          <Kpi icon="wallet" tone={colors.danger} label="Expenses" value={view?.total.expenses ?? 0} cur={cur} spark={view?.expenses} onPress={() => router.push('/expenses')} />
          <Kpi icon="trend" tone={colors.success} label="Est. profit" value={view?.total.profit ?? 0} cur={cur} hint="Sales − purchases − expenses" onPress={() => router.push('/report?tab=overview')} />
        </View>

        {/* trend chart */}
        <Panel
          title="Trend"
          subtitle={`Last ${period} months`}
          right={
            <View style={styles.kindRow}>
              {(['area', 'line', 'bar'] as ChartKind[]).map((k) => (
                <Pressable key={k} onPress={() => { tap(); setKind(k); }} style={[styles.kindBtn, kind === k && styles.kindOn]} hitSlop={4}>
                  <KindIcon kind={k} on={kind === k} />
                </Pressable>
              ))}
            </View>
          }
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
            {(['sales', 'purchases', 'expenses', 'all'] as Metric[]).map((m) => (
              <Pressable key={m} onPress={() => { tap(); setMetric(m); }} style={[styles.chip, metric === m && styles.chipOn]}>
                {m !== 'all' ? <View style={[styles.chipDot, { backgroundColor: METRIC_COLOR[m] }]} /> : null}
                <Text style={[styles.chipText, metric === m && styles.chipTextOn]}>
                  {m === 'sales' ? 'Sales' : m === 'purchases' ? 'Purchases' : m === 'expenses' ? 'Expenses' : 'Compare all'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {view ? <TrendChart width={chartW} labels={view.labels} series={series} kind={kind} currency={cur} /> : <View style={{ height: 230 }} />}
          {metric === 'sales' ? (
            <View style={styles.compareRow}>
              <Text style={styles.compareText}>Compare with last year</Text>
              <Switch value={compare} onValueChange={(v) => { tap(); setCompare(v); }} trackColor={{ true: colors.accent, false: colors.paperSunk }} />
            </View>
          ) : null}
        </Panel>

        {/* cash & bank */}
        <Panel title="Cash & Bank" subtitle="Money available right now">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <MoneyTile icon="cash" tone={colors.success} label="Cash in hand" value={money(s?.cashIn ?? 0, cur, 0)} onPress={() => router.push('/cash')} />
            <MoneyTile icon="bank" tone={colors.accent} label="Bank balance" value={money(0, cur, 0)} onPress={() => router.push('/feature?key=bank')} />
          </View>
        </Panel>

        {/* expense breakdown */}
        <Panel title="Where money went" subtitle={`Expenses in ${monthShort(todayISO().slice(0, 7))}`} onPress={() => router.push('/expenses')}>
          {data?.exp.length ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Donut
                segments={data.exp.slice(0, 7).map((e, i) => ({ value: e.total, color: DONUT[i % DONUT.length] }))}
                center={moneyShort(expTotal, cur)}
                sub="total"
              />
              <View style={{ flex: 1, gap: 8 }}>
                {data.exp.slice(0, 5).map((e, i) => (
                  <View key={e.category} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.legendDot, { backgroundColor: DONUT[i % DONUT.length] }]} />
                    <Text style={styles.legendName} numberOfLines={1}>{e.category}</Text>
                    <Text style={styles.legendPct}>{expTotal ? Math.round((e.total / expTotal) * 100) : 0}%</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <EmptyLine text="No expenses recorded this month" />
          )}
        </Panel>

        {/* inventory */}
        <Panel title="Inventory" subtitle={`${s?.itemCount ?? 0} items · ${money(s?.stockValue ?? 0, cur, 0)} in stock`} onPress={() => router.push('/stock-summary')}>
          {s?.lowStock.length ? (
            <>
              <Text style={styles.lowHead}>Running low</Text>
              {s.lowStock.map((i) => {
                const pct = i.min_stock > 0 ? Math.max(0, Math.min(1, i.stock / i.min_stock)) : 0;
                return (
                  <View key={i.id} style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.lowName} numberOfLines={1}>{i.name}</Text>
                      <Text style={[styles.lowQty, i.stock <= 0 && { color: colors.danger }]}>
                        {i.stock % 1 ? i.stock.toFixed(1) : i.stock} / {i.min_stock}
                      </Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${Math.max(4, pct * 100)}%`, backgroundColor: pct < 0.34 ? colors.danger : colors.warn }]} />
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <EmptyLine text="All items are above their minimum stock" ok />
          )}
        </Panel>

        {/* reports */}
        <Pressable onPress={() => { tap(); router.push('/reports'); }} style={({ pressed }) => [styles.reports, pressed && { opacity: 0.9 }]}>
          <IconTile name="report" tone={colors.tint} size={46} solid />
          <View style={{ flex: 1 }}>
            <Text style={styles.reportsTitle}>All reports</Text>
            <Text style={styles.reportsSub}>Sale, purchase, party, GST, stock and more</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Kpi({
  icon,
  tone,
  label,
  value,
  cur,
  spark,
  delta,
  hint,
  onPress,
}: {
  icon: GlyphName;
  tone: string;
  label: string;
  value: number;
  cur: string;
  spark?: number[];
  delta?: number | null;
  hint?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={() => { tap(); onPress?.(); }} style={({ pressed }) => [styles.kpi, pressed && { opacity: 0.9 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconTile name={icon} tone={tone} size={34} />
        {spark && spark.some((v) => v > 0) ? <Sparkline values={spark} color={tone} width={64} height={26} /> : null}
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiVal, value < 0 && { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
        {moneyShort(value, cur)}
      </Text>
      {delta !== undefined ? (
        delta === null ? (
          <Text style={styles.kpiHint}>New this year</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <View style={[styles.delta, { backgroundColor: delta >= 0 ? colors.successSoft : colors.dangerSoft }]}>
              <Ionicons name={delta >= 0 ? 'trending-up' : 'trending-down'} size={11} color={delta >= 0 ? colors.success : colors.danger} />
              <Text style={[styles.deltaText, { color: delta >= 0 ? colors.success : colors.danger }]}>{Math.abs(delta).toFixed(0)}%</Text>
            </View>
            <Text style={styles.kpiHint}>vs last year</Text>
          </View>
        )
      ) : hint ? (
        <Text style={styles.kpiHint} numberOfLines={1}>{hint}</Text>
      ) : null}
    </Pressable>
  );
}

function MoneyTile({ icon, tone, label, value, onPress }: { icon: GlyphName; tone: string; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [styles.moneyTile, pressed && { opacity: 0.85 }]}>
      <Glyph name={icon} size={22} accent={tone} />
      <Text style={styles.moneyLabel}>{label}</Text>
      <Text style={[styles.moneyVal, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </Pressable>
  );
}

function KindIcon({ kind, on }: { kind: ChartKind; on: boolean }) {
  const c = on ? '#fff' : colors.textMuted;
  if (kind === 'bar') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 }}>
        {[7, 13, 10].map((h, i) => <View key={i} style={{ width: 3.5, height: h, borderRadius: 1.5, backgroundColor: c }} />)}
      </View>
    );
  }
  return <Ionicons name={kind === 'line' ? 'pulse' : 'analytics'} size={16} color={c} />;
}

function EmptyLine({ text, ok }: { text: string; ok?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
      <Ionicons name={ok ? 'checkmark-circle' : 'information-circle-outline'} size={18} color={ok ? colors.success : colors.textFaint} />
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 2 },
  h1: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink, letterSpacing: -0.4 },
  seg: { flexDirection: 'row', backgroundColor: '#DCE5F0', borderRadius: 12, padding: 3 },
  segItem: { paddingHorizontal: 12, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.card, shadowColor: '#1D2D3D', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  segText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textMuted },
  segTextOn: { fontFamily: fonts.semibold, color: colors.ink },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16, marginTop: 10 },
  kpi: { width: '48.4%', flexGrow: 1, flexBasis: '45%', backgroundColor: colors.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.line },
  kpiLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textMuted, marginTop: 10 },
  kpiVal: { fontFamily: fonts.bold, fontSize: 21, color: colors.ink, marginTop: 2, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  kpiHint: { fontFamily: fonts.body, fontSize: 11, color: colors.textFaint, marginTop: 4 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  deltaText: { fontFamily: fonts.semibold, fontSize: 11 },
  kindRow: { flexDirection: 'row', backgroundColor: colors.canvas, borderRadius: 10, padding: 3, gap: 2 },
  kindBtn: { width: 34, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  kindOn: { backgroundColor: colors.ink },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.canvas },
  chipOn: { backgroundColor: colors.tintSoft, borderWidth: 1, borderColor: colors.accent },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textMuted },
  chipTextOn: { color: colors.ink, fontFamily: fonts.semibold },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  compareText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  moneyTile: { flex: 1, backgroundColor: colors.canvas, borderRadius: 14, padding: 12 },
  moneyLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 8 },
  moneyVal: { fontFamily: fonts.bold, fontSize: 18, marginTop: 2, fontVariant: ['tabular-nums'] },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendName: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.text },
  legendPct: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  lowHead: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
  lowName: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, color: colors.text, marginRight: 8 },
  lowQty: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  track: { height: 6, backgroundColor: colors.canvas, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  reports: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 10, padding: 16, borderRadius: 20, backgroundColor: colors.ink },
  reportsTitle: { fontFamily: fonts.semibold, fontSize: 15, color: '#fff' },
  reportsSub: { fontFamily: fonts.body, fontSize: 12, color: colors.onInkMuted, marginTop: 2 },
});
