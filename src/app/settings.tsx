import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Field, ListRow, Row, Screen, Section, T, tap, success } from '@/components/ui';
import { getBusiness, listInvoices, updateBusiness } from '@/db/repo';
import type { Business } from '@/db/types';
import { colors, radius } from '@/lib/theme';
import { getTemplate, resolveColor, TEMPLATES } from '@/templates';

export default function Settings() {
  const db = useSQLiteContext();
  const [b, setB] = useState<Business | null>(null);
  const [sampleId, setSampleId] = useState<number | null>(null);

  useEffect(() => {
    getBusiness(db).then(setB);
    listInvoices(db, { type: 'sale', limit: 1 }).then((r) => setSampleId(r[0]?.id ?? null));
  }, [db]);
  if (!b) return <Screen><View /></Screen>;

  const save = async () => {
    await updateBusiness(db, { template: b.template, color: b.color, invoice_prefix: b.invoice_prefix });
    success();
    router.back();
  };

  return (
    <Screen footer={<Button title="Save settings" icon="checkmark" onPress={save} style={{ flex: 1 }} />}>
      <T v="eyebrow" style={{ marginBottom: 10 }}>Default invoice design</T>
      {TEMPLATES.map((t) => {
        const active = b.template === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => {
              tap();
              setB({ ...b, template: t.id, color: resolveColor(t, b.color) });
            }}
            style={[styles.tpl, active && { borderColor: colors.ink, borderWidth: 2 }]}
          >
            <View style={[styles.thumb, { backgroundColor: (active ? b.color : t.palettes[0]).split('|')[0] }]}>
              <View style={styles.thumbPaper}>
                <View style={[styles.tl, { width: '60%' }]} />
                <View style={[styles.tl, { width: '40%' }]} />
                <View style={[styles.tl, { width: '80%', marginTop: 6 }]} />
                <View style={[styles.tl, { width: '70%' }]} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Row gap={6}>
                <T v="h3">{t.name}</T>
                {t.premium ? <Badge label="Premium" tone="warn" /> : null}
                {t.format === 'Thermal' ? <Badge label="80mm" /> : null}
              </Row>
              <T v="small" style={{ fontSize: 12.5 }}>{t.blurb}</T>
              {active && t.palettes.length > 1 ? (
                <Row gap={8} style={{ marginTop: 10 }}>
                  {t.palettes.map((p) => {
                    const [a, c2] = p.split('|');
                    return (
                      <Pressable key={p} onPress={() => { tap(); setB({ ...b, color: p }); }} style={[styles.ring, b.color === p && { borderColor: colors.ink }]}>
                        <View style={[styles.sw, { backgroundColor: a }]}>
                          {c2 ? <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', backgroundColor: c2 }} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </Row>
              ) : null}
            </View>
            {active ? <Ionicons name="checkmark-circle" size={22} color={colors.ink} /> : null}
          </Pressable>
        );
      })}
      {sampleId ? (
        <Button kind="ghost" title={`Preview ${getTemplate(b.template).name} on a real invoice`} icon="eye-outline" onPress={() => router.push(`/invoice/preview?id=${sampleId}`)} style={{ marginTop: 6 }} />
      ) : null}

      <Section title="Numbering">
        <Field label="Sale invoice prefix" value={b.invoice_prefix} onChangeText={(v) => setB({ ...b, invoice_prefix: v })} autoCapitalize="characters" hint={`Next invoices look like ${b.invoice_prefix || ''}12`} />
      </Section>

      <Section title="Profile">
        <Card style={{ padding: 6 }}>
          <ListRow icon="business-outline" title="Business profile" subtitle="Logo, address, GSTIN, bank, signature" onPress={() => router.push('/business')} />
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tpl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: radius.l,
    backgroundColor: colors.paperRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginBottom: 10,
  },
  thumb: { width: 54, height: 70, borderRadius: 10, padding: 6, justifyContent: 'flex-end' },
  thumbPaper: { backgroundColor: '#fff', borderRadius: 4, padding: 5, height: 44 },
  tl: { height: 3, borderRadius: 2, backgroundColor: colors.paperSunk, marginBottom: 3 },
  ring: { padding: 2, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  sw: { width: 20, height: 20, borderRadius: 10, overflow: 'hidden' },
});
