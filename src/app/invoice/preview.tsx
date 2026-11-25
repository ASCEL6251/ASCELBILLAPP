import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Glyph } from '@/components/Glyph';
import { TemplateThumb } from '@/components/TemplateThumb';
import { success, tap } from '@/components/ui';
import { getBusiness, getInvoice, updateBusiness, updateInvoiceDesign } from '@/db/repo';
import type { Business, FullInvoice } from '@/db/types';
import { money } from '@/lib/format';
import { printInvoice, sharePdf, whatsappReminder } from '@/lib/pdf';
import { colors, fonts, shadow } from '@/lib/theme';
import { getTemplate, renderInvoiceHtml, resolveColor, TEMPLATES } from '@/templates';

export default function Preview() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [biz, setBiz] = useState<Business | null>(null);
  const [inv, setInv] = useState<FullInvoice | null>(null);
  const [tplId, setTplId] = useState('meridian');
  const [color, setColor] = useState('');
  const [asDefault, setAsDefault] = useState(false);
  const [busy, setBusy] = useState<'share' | 'print' | null>(null);

  useEffect(() => {
    (async () => {
      const b = await getBusiness(db);
      const i = await getInvoice(db, Number(id));
      setBiz(b);
      setInv(i);
      const t = getTemplate(i?.template || b.template);
      setTplId(t.id);
      setColor(resolveColor(t, i?.color || b.color));
    })();
  }, [db, id]);

  const tpl = getTemplate(tplId);
  const html = useMemo(() => {
    if (!biz || !inv) return '';
    const raw = renderInvoiceHtml(biz, inv, tplId, color);
    // Fit the A4 (794px) or thermal (302px) page to the preview frame.
    const vw = tpl.format === 'Thermal' ? 420 : 794;
    return raw.replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
      `<meta name="viewport" content="width=${vw}, user-scalable=yes"/><style>html{background:#fff} body{${tpl.format === 'Thermal' ? 'display:flex;justify-content:center;background:#f4f4f5' : ''}}</style>`,
    );
  }, [biz, inv, tplId, color, tpl.format]);

  const pick = (tid: string) => {
    tap();
    const t = getTemplate(tid);
    setTplId(t.id);
    setColor(resolveColor(t, color));
  };

  const persist = async () => {
    if (!inv) return;
    await updateInvoiceDesign(db, inv.id, tplId, color);
    if (asDefault) await updateBusiness(db, { template: tplId, color });
  };

  const done = async () => {
    await persist();
    success();
    if (fresh) router.replace(`/invoice/${id}`);
    else router.back();
  };

  const share = async () => {
    if (!biz || !inv) return;
    setBusy('share');
    try {
      await persist();
      await sharePdf(biz, inv, tplId, color);
    } catch (e: any) {
      Alert.alert('Could not create PDF', String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  };

  const print = async () => {
    if (!biz || !inv) return;
    setBusy('print');
    try {
      await printInvoice(biz, inv, tplId, color);
    } catch {
      /* user cancelled */
    } finally {
      setBusy(null);
    }
  };

  const idx = TEMPLATES.findIndex((t) => t.id === tplId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style="dark" />
      {/* top bar */}
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <Pressable hitSlop={8} onPress={() => (fresh ? router.replace(`/invoice/${id}`) : router.back())} style={styles.roundBtn}>
          <Ionicons name="close" size={20} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.title}>Choose a design</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {inv ? `#${inv.number} · ${inv.party_name || 'Cash sale'} · ${biz ? money(inv.total, biz.currency) : ''}` : ' '}
          </Text>
        </View>
        <Pressable onPress={done} style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>

      {/* live page */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 4 }}>
        <View style={styles.frame}>
          {html ? (
            <WebView
              key={tpl.format}
              originWhitelist={['*']}
              source={{ html }}
              style={{ flex: 1, backgroundColor: '#fff' }}
              scalesPageToFit
              showsVerticalScrollIndicator={false}
              startInLoadingState
              renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.accent} />}
            />
          ) : (
            <ActivityIndicator style={{ flex: 1 }} color={colors.accent} />
          )}
          <View style={styles.badges} pointerEvents="none">
            <View style={styles.badge}><Text style={styles.badgeText}>{tpl.format === 'Thermal' ? '80 mm roll' : 'A4 page'}</Text></View>
            {tpl.premium ? (
              <View style={[styles.badge, { backgroundColor: colors.goldSoft }]}>
                <Ionicons name="diamond" size={10} color={colors.warn} />
                <Text style={[styles.badgeText, { color: colors.warn }]}>Premium</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* design picker */}
      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitle}>{tpl.name}</Text>
          <Text style={styles.count}>{`${idx + 1} of ${TEMPLATES.length}`}</Text>
        </View>
        <Text style={styles.blurb} numberOfLines={1}>{tpl.blurb}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {TEMPLATES.map((t) => {
            const on = t.id === tplId;
            return (
              <Pressable key={t.id} onPress={() => pick(t.id)} style={styles.thumbCell}>
                <View style={[styles.thumb, on && styles.thumbOn]}>
                  <TemplateThumb id={t.id} color={resolveColor(t, color)} />
                  {on ? (
                    <View style={styles.thumbCheck}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                  ) : t.premium ? (
                    <View style={styles.thumbPro}><Ionicons name="diamond" size={8} color={colors.warn} /></View>
                  ) : null}
                </View>
                <Text style={[styles.thumbName, on && { color: colors.ink, fontFamily: fonts.semibold }]} numberOfLines={1}>{t.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {tpl.palettes.length > 1 ? (
          <View style={styles.colorRow}>
            <Text style={styles.rowLabel}>Colour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
              {tpl.palettes.map((p) => {
                const [a, b] = p.split('|');
                const active = p === color;
                return (
                  <Pressable key={p} hitSlop={4} onPress={() => { tap(); setColor(p); }} style={[styles.swatchRing, active && { borderColor: colors.ink }]}>
                    <View style={[styles.swatch, { backgroundColor: a }]}>
                      {b ? <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', backgroundColor: b }} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.colorRow}>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Use this design for all new bills</Text>
          <Switch value={asDefault} onValueChange={(v) => { tap(); setAsDefault(v); }} trackColor={{ true: colors.accent, false: colors.paperSunk }} />
        </View>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]} onPress={() => biz && inv && whatsappReminder(biz, inv)}>
            <Glyph name="whatsapp" size={22} accent={colors.success} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]} onPress={print} disabled={busy === 'print'}>
            {busy === 'print' ? <ActivityIndicator color={colors.accent} /> : <Glyph name="print" size={22} />}
          </Pressable>
          <Pressable style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]} onPress={() => router.push('/settings')}>
            <Glyph name="sliders" size={22} accent={colors.warn} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.primary, pressed && { opacity: 0.9 }]} onPress={share} disabled={busy === 'share'}>
            {busy === 'share' ? <ActivityIndicator color="#fff" /> : <Glyph name="share" size={20} color="#fff" accent="rgba(255,255,255,0.35)" />}
            <Text style={styles.primaryText}>Share PDF</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  roundBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, letterSpacing: -0.2 },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  doneBtn: { height: 40, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontFamily: fonts.semibold, fontSize: 14, color: '#fff' },
  frame: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, ...shadow.card },
  badges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(29,45,61,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.ink },
  panel: { backgroundColor: colors.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: 12, paddingTop: 16, ...shadow.card },
  panelHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20 },
  panelTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  count: { fontFamily: fonts.medium, fontSize: 12, color: colors.textFaint },
  blurb: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textMuted, paddingHorizontal: 20, marginTop: 2 },
  thumbs: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  thumbCell: { alignItems: 'center', width: 72 },
  thumb: { width: 72, height: 94, borderRadius: 12, padding: 2, borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbOn: { borderColor: colors.accent, backgroundColor: colors.tintSoft },
  thumbCheck: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  thumbPro: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  thumbName: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, marginTop: 6 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowLabel: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.text },
  swatchRing: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 26, height: 26, borderRadius: 13, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  iconAction: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  primary: { flex: 1, height: 50, borderRadius: 16, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontFamily: fonts.semibold, fontSize: 15, color: '#fff' },
});
