import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Button, IconBtn, Row, T, tap, success } from '@/components/ui';
import { getBusiness, getInvoice, updateBusiness, updateInvoiceDesign } from '@/db/repo';
import type { Business, FullInvoice } from '@/db/types';
import { money } from '@/lib/format';
import { printInvoice, sharePdf, whatsappReminder } from '@/lib/pdf';
import { colors, fonts, radius, shadow } from '@/lib/theme';
import { getTemplate, renderInvoiceHtml, resolveColor, TEMPLATES } from '@/templates';

export default function Preview() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
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

  const frameW = width - 48;
  const frameH = Math.min(frameW * 1.414, height - insets.top - insets.bottom - 330);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      <StatusBar style="light" />
      {/* top bar */}
      <Row style={{ paddingTop: insets.top + 6, paddingHorizontal: 12, paddingBottom: 8, justifyContent: 'space-between' }}>
        <IconBtn name="close" color={colors.onInk} onPress={done} bg={colors.inkRaised} />
        <View style={{ alignItems: 'center' }}>
          <T v="eyebrow" style={{ color: colors.tint }}>{inv?.number ?? ''}</T>
          <T v="h3" style={{ color: colors.onInk }}>{fresh ? 'Saved — pick a design' : 'Invoice design'}</T>
        </View>
        <IconBtn name="print-outline" color={colors.onInk} onPress={print} bg={colors.inkRaised} />
      </Row>

      {/* template chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }} style={{ flexGrow: 0 }}>
        {TEMPLATES.map((t) => {
          const active = t.id === tplId;
          return (
            <Pressable key={t.id} onPress={() => pick(t.id)} style={[styles.tchip, active && styles.tchipActive]}>
              {t.premium ? <Ionicons name="diamond" size={11} color={active ? colors.ink : '#D7B46A'} /> : null}
              <T v="label" style={{ color: active ? colors.ink : colors.onInk, fontFamily: active ? fonts.semibold : fonts.medium }}>{t.name}</T>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* palette */}
      <Row style={{ paddingHorizontal: 16, paddingVertical: 6, justifyContent: 'space-between' }}>
        <T v="small" style={{ color: colors.onInkMuted, fontSize: 12, flex: 1 }} numberOfLines={1}>{tpl.blurb}</T>
        <Row gap={8}>
          {tpl.palettes.length > 1
            ? tpl.palettes.map((p) => {
                const [a, b] = p.split('|');
                const active = p === color;
                return (
                  <Pressable key={p} onPress={() => { tap(); setColor(p); }} style={[styles.swatchRing, active && { borderColor: colors.tint }]}>
                    <View style={[styles.swatch, { backgroundColor: a, overflow: 'hidden' }]}>
                      {b ? <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', backgroundColor: b }} /> : null}
                    </View>
                  </Pressable>
                );
              })
            : null}
        </Row>
      </Row>

      {/* page */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <View style={[styles.frame, { width: frameW, height: frameH }]}>
          {html ? (
            <WebView
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
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* actions */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <T v="small" style={{ color: colors.onInkMuted, fontSize: 11.5 }}>{inv?.party_name || 'Cash sale'}</T>
            <T v="h2" style={{ color: colors.onInk }}>{inv && biz ? money(inv.total, biz.currency) : ''}</T>
          </View>
          <Row gap={8}>
            <T v="small" style={{ color: colors.onInkMuted, fontSize: 12 }}>Make default</T>
            <Switch value={asDefault} onValueChange={setAsDefault} trackColor={{ true: colors.accent, false: colors.inkRaised }} />
          </Row>
        </Row>
        <Row gap={10}>
          <Button
            kind="dark"
            title="WhatsApp"
            icon="logo-whatsapp"
            onPress={() => biz && inv && whatsappReminder(biz, inv)}
            style={{ flex: 1 }}
          />
          <Button
            title="Share PDF"
            icon="share-outline"
            onPress={share}
            loading={busy === 'share'}
            kind="tint"
            style={{ flex: 1.4 }}
          />
        </Row>
        <Pressable onPress={done} style={{ alignItems: 'center', paddingTop: 12 }}>
          <T v="label" style={{ color: colors.onInk }}>{fresh ? 'Save & view invoice' : 'Save design'}</T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tchip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.inkRaised,
  },
  tchipActive: { backgroundColor: colors.paper },
  swatchRing: { padding: 2, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  swatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  frame: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(148,188,227,0.28)', ...shadow.lift },
  bottom: { paddingHorizontal: 16, paddingTop: 14, backgroundColor: colors.inkDeep, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
});
