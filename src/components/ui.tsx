import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radius, shadow } from '@/lib/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export const tap = () => Haptics.selectionAsync().catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

/* ---------- Typography ---------- */

type Variant = 'display' | 'title' | 'h2' | 'h3' | 'body' | 'small' | 'eyebrow' | 'mono' | 'label';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, color: colors.ink, fontVariant: ['tabular-nums'] },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.6, color: colors.ink },
  h2: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, color: colors.text },
  h3: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17, color: colors.textMuted },
  eyebrow: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17, color: colors.textMuted },
  mono: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, fontVariant: ['tabular-nums'] },
};

export function T({ v = 'body', style, ...p }: TextProps & { v?: Variant }) {
  return <Text {...p} style={[variantStyle[v], style]} />;
}

/* ---------- Brand mark ---------- */

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 6 L66 38 L34 38 Z" fill={colors.tint} />
      <Path d="M32 42 L68 42 L70 46 L80 66 L60 66 L50 46 L40 66 L20 66 L30 46 Z" fill={colors.accent} />
      <Path d="M18 70 L38 70 L26 94 L6 94 Z M82 70 L62 70 L74 94 L94 94 Z" fill={colors.ink} />
    </Svg>
  );
}

/* ---------- Layout ---------- */

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  footer,
  refreshControl,
  scrollEnabled = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  scrollEnabled?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  refreshControl?: any;
}) {
  const insets = useSafeAreaInsets();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && { padding: 16 }, { paddingBottom: footer ? 24 : insets.bottom + 110 }, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      scrollEnabled={scrollEnabled}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && { padding: 16 }, style]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {content}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

export function Card({
  children,
  style,
  onPress,
  dark,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  dark?: boolean;
}) {
  const base = [styles.card, dark && styles.cardDark, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [base, pressed && { transform: [{ scale: 0.985 }], opacity: 0.94 }]}
    >
      {children}
    </Pressable>
  );
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong }, style]} />;
}

export function Section({ title, action, children, style }: { title: string; action?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginTop: 22 }, style]}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 }}>
        <T v="eyebrow">{title}</T>
        {action}
      </Row>
      {children}
    </View>
  );
}

/* ---------- Buttons ---------- */

type BtnKind = 'ink' | 'accent' | 'ghost' | 'danger' | 'soft' | 'tint' | 'dark';

export function Button({
  title,
  onPress,
  kind = 'ink',
  icon,
  style,
  loading,
  disabled,
  small,
}: {
  title: string;
  onPress: () => void;
  kind?: BtnKind;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  const palette: Record<BtnKind, { bg: string; fg: string; border?: string }> = {
    ink: { bg: colors.ink, fg: colors.onInk },
    accent: { bg: colors.accent, fg: '#fff' },
    ghost: { bg: 'rgba(255,255,255,0.7)', fg: colors.ink, border: colors.lineStrong },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    soft: { bg: colors.tintSoft, fg: colors.ink },
    tint: { bg: colors.tint, fg: colors.inkDeep },
    dark: { bg: colors.inkRaised, fg: colors.onInk },
  };
  const p = palette[kind];
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && { height: 40, paddingHorizontal: 14 },
        { backgroundColor: p.bg, borderColor: p.border ?? p.bg },
        kind === 'ink' && shadow.lift,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={p.fg} /> : null}
          <Text style={{ color: p.fg, fontFamily: fonts.semibold, fontSize: small ? 14 : 15.5 }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconBtn({
  name,
  onPress,
  color = colors.ink,
  bg = 'transparent',
  size = 22,
  style,
}: {
  name: IconName;
  onPress: () => void;
  color?: string;
  bg?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: bg }, pressed && { opacity: 0.6 }, style]}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

/* ---------- Inputs ---------- */

export function Field({ label, prefix, hint, containerStyle, style, ...p }: TextInputProps & { label: string; prefix?: string; hint?: string; containerStyle?: StyleProp<ViewStyle> }) {
  {
    const [focus, setFocus] = React.useState(false);
    return (
      <View style={[{ marginBottom: 12 }, containerStyle]}>
        <View style={[styles.field, focus && { borderColor: colors.accent, backgroundColor: '#fff' }]}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Row gap={4}>
            {prefix ? <Text style={[styles.fieldInput, { color: colors.textMuted, flex: 0 }]}>{prefix}</Text> : null}
            <TextInput
              placeholderTextColor={colors.textFaint}
              {...p}
              onFocus={(ev) => {
                setFocus(true);
                p.onFocus?.(ev);
              }}
              onBlur={(ev) => {
                setFocus(false);
                p.onBlur?.(ev);
              }}
              style={[styles.fieldInput, p.multiline && { minHeight: 60, textAlignVertical: 'top' }, style]}
            />
          </Row>
        </View>
        {hint ? <T v="small" style={{ marginTop: 4, marginLeft: 4, fontSize: 12 }}>{hint}</T> : null}
      </View>
    );
  }
}

export function SearchBar({ value, onChangeText, placeholder, right }: { value: string; onChangeText: (s: string) => void; placeholder: string; right?: ReactNode }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.text, paddingVertical: 0 }}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {right}
    </View>
  );
}

/* ---------- Chips / segmented ---------- */

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.chip, active && { backgroundColor: colors.ink, borderColor: colors.ink }]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? colors.onInk : colors.ink} /> : null}
      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: active ? colors.onInk : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segItem, active && styles.segActive]}
          >
            <Text style={{ fontFamily: active ? fonts.semibold : fonts.medium, fontSize: 13.5, color: active ? colors.ink : colors.textMuted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'danger' | 'warn' | 'accent' }) {
  const map = {
    neutral: [colors.paperSunk, colors.textMuted],
    success: [colors.successSoft, colors.success],
    danger: [colors.dangerSoft, colors.danger],
    warn: [colors.warnSoft, colors.warn],
    accent: [colors.tintSoft, colors.accent],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 11.5, color: fg }}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, size = 40, dark }: { name: string; size?: number; dark?: boolean }) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.6,
        backgroundColor: dark ? colors.inkRaised : colors.tintSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.semibold, color: dark ? colors.tint : colors.ink, fontSize: size * 0.36 }}>{letters || '·'}</Text>
    </View>
  );
}

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 76, height: 76, borderRadius: 26, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Ionicons name={icon} size={32} color={colors.accent} />
      </View>
      <T v="h2" style={{ textAlign: 'center' }}>{title}</T>
      <T v="small" style={{ textAlign: 'center', marginTop: 6, maxWidth: 280 }}>{body}</T>
      {action ? <View style={{ marginTop: 18 }}>{action}</View> : null}
    </View>
  );
}

/* ---------- Bottom sheet ---------- */

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <T v="title" style={{ fontSize: 22 }}>{title}</T>
            <IconBtn name="close" onPress={onClose} bg={colors.paperSunk} size={18} />
          </Row>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ---------- Header helpers ---------- */

export function BackButton() {
  return <IconBtn name="chevron-back" onPress={() => router.back()} />;
}

export function KV({ k, v, strong, color }: { k: string; v: string; strong?: boolean; color?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 5 }}>
      <T v="small" style={strong && { color: colors.text, fontFamily: fonts.semibold }}>{k}</T>
      <T v="body" style={[{ fontFamily: strong ? fonts.bold : fonts.medium, fontSize: strong ? 16 : 14.5 }, color ? { color } : null]}>{v}</T>
    </Row>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        if (!onPress) return;
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.listRow, pressed && onPress && { backgroundColor: colors.paperSunk }]}
    >
      <View style={[styles.listIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={19} color={danger ? colors.danger : colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <T v="h3" style={danger && { color: colors.danger }}>{title}</T>
        {subtitle ? <T v="small" style={{ fontSize: 12.5 }}>{subtitle}</T> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textFaint} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.l,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  cardDark: { backgroundColor: colors.ink, borderColor: colors.ink },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(242,242,243,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    height: 52,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  field: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 9,
  },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.textMuted, marginBottom: 2 },
  fieldInput: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.text, paddingVertical: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.paperRaised,
  },
  seg: { flexDirection: 'row', backgroundColor: colors.paperSunk, borderRadius: radius.pill, padding: 4 },
  segItem: { flex: 1, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: '#fff', ...shadow.card },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,33,48,0.45)' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '88%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, marginBottom: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.m },
  listIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' },
});
