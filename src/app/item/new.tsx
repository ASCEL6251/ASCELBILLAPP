import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Chip, Field, Row, Screen, Segmented, T, success } from '@/components/ui';
import { getItem, saveItem } from '@/db/repo';
import { num } from '@/lib/format';

const UNITS = ['pcs', 'box', 'kg', 'g', 'ltr', 'm', 'pair', 'set', 'hr', 'job'];
const TAX = [0, 3, 5, 12, 18, 28];

export default function ItemForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useSQLiteContext();
  const [kind, setKind] = useState<'goods' | 'service'>('goods');
  const [name, setName] = useState('');
  const [hsn, setHsn] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [sale, setSale] = useState('');
  const [purchase, setPurchase] = useState('');
  const [tax, setTax] = useState(0);
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getItem(db, Number(id)).then((i) => {
      if (!i) return;
      setKind(i.is_service ? 'service' : 'goods');
      setName(i.name);
      setHsn(i.hsn);
      setCategory(i.category);
      setUnit(i.unit);
      setSale(String(i.sale_price || ''));
      setPurchase(String(i.purchase_price || ''));
      setTax(i.tax_rate);
      setStock(String(i.stock || ''));
      setMinStock(String(i.min_stock || ''));
    });
  }, [id, db]);

  const save = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Enter the item name.');
    setSaving(true);
    const iid = await saveItem(db, {
      id: id ? Number(id) : undefined,
      name: name.trim(),
      hsn: hsn.trim(),
      category: category.trim(),
      unit,
      sale_price: num(sale),
      purchase_price: num(purchase),
      tax_rate: tax,
      stock: kind === 'service' ? 0 : num(stock),
      min_stock: kind === 'service' ? 0 : num(minStock),
      is_service: kind === 'service' ? 1 : 0,
    });
    success();
    if (id) router.back();
    else router.replace(`/item/${iid}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: id ? 'Edit item' : 'New item' }} />
      <Screen footer={<Button title={id ? 'Save changes' : 'Add item'} icon="checkmark" onPress={save} loading={saving} style={{ flex: 1 }} />}>
        <Segmented value={kind} onChange={setKind} options={[{ value: 'goods', label: 'Product' }, { value: 'service', label: 'Service' }]} />
        <View style={{ height: 16 }} />
        <Field label="Item name" value={name} onChangeText={setName} autoFocus={!id} />
        <Row gap={10}>
          <Field label="HSN / SAC" value={hsn} onChangeText={setHsn} containerStyle={{ flex: 1 }} />
          <Field label="Category" value={category} onChangeText={setCategory} containerStyle={{ flex: 1 }} />
        </Row>
        <Row gap={10}>
          <Field label="Sale price" prefix="₹" value={sale} onChangeText={setSale} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
          <Field label="Purchase price" prefix="₹" value={purchase} onChangeText={setPurchase} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
        </Row>
        <T v="label" style={{ marginBottom: 8 }}>GST rate</T>
        <Row style={{ flexWrap: 'wrap', marginBottom: 14 }}>
          {TAX.map((t) => <Chip key={t} label={t ? `${t}%` : 'None'} active={tax === t} onPress={() => setTax(t)} />)}
        </Row>
        <T v="label" style={{ marginBottom: 8 }}>Unit</T>
        <Row style={{ flexWrap: 'wrap', marginBottom: 14 }}>
          {UNITS.map((u) => <Chip key={u} label={u} active={unit === u} onPress={() => setUnit(u)} />)}
        </Row>
        {kind === 'goods' ? (
          <Row gap={10}>
            <Field label={id ? 'Current stock' : 'Opening stock'} value={stock} onChangeText={setStock} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            <Field label="Low stock alert at" value={minStock} onChangeText={setMinStock} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
          </Row>
        ) : null}
      </Screen>
    </>
  );
}
