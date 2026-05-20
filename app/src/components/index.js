import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView,
} from 'react-native';
import { colors, spacing, radius, fonts } from '../theme';

// ── Button ────────────────────────────────────────────────
export function Button({ title, onPress, variant = 'default', disabled, loading, style }) {
  const variantStyle = {
    default: { bg: colors.surface2, border: colors.border2, text: colors.cream2 },
    gold:    { bg: colors.gold,     border: 'transparent',  text: '#1a1200', shadow: true },
    green:   { bg: colors.green,    border: 'transparent',  text: '#fff' },
    red:     { bg: colors.red,      border: 'transparent',  text: '#fff' },
    ghost:   { bg: 'transparent',   border: colors.border2, text: colors.cream2 },
  }[variant] || { bg: colors.surface2, border: colors.border2, text: colors.cream2 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        btnStyles.base,
        { backgroundColor: variantStyle.bg, borderColor: variantStyle.border },
        (disabled || loading) && btnStyles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={variantStyle.text} />
        : <Text style={[btnStyles.text, { color: variantStyle.text }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  base: {
    paddingVertical: 11, paddingHorizontal: 18,
    borderRadius: radius.md, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});

// ── Card ─────────────────────────────────────────────────
export function Card({ children, style, gold }) {
  return (
    <View style={[cardStyles.card, gold && cardStyles.gold, style]}>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  gold: {
    borderColor: colors.goldBorder,
    backgroundColor: '#0f0c06',
  },
});

// ── Badge ─────────────────────────────────────────────────
export function Badge({ label, variant = 'default' }) {
  const v = {
    default:    { bg: colors.surface3,  text: colors.muted },
    gold:       { bg: colors.goldDim,   text: colors.gold  },
    green:      { bg: colors.greenBg,   text: colors.greenText },
    red:        { bg: colors.redBg,     text: colors.redText },
    amber:      { bg: colors.amberBg,   text: colors.amberText },
    blue:       { bg: colors.blueBg,    text: colors.blueText },
    purple:     { bg: colors.purpleBg,  text: colors.purpleText },
  }[variant] || { bg: colors.surface3, text: colors.muted };

  return (
    <View style={[badgeStyles.base, { backgroundColor: v.bg }]}>
      <Text style={[badgeStyles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  base: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});

// ── StatusBadge ───────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    pendente:   { label: '● Pendente',   variant: 'amber' },
    autorizado: { label: '✓ Autorizado', variant: 'green' },
    recusado:   { label: '✕ Recusado',   variant: 'red'   },
    expirado:   { label: '— Expirado',   variant: 'default' },
  };
  const { label, variant } = map[status] || map.expirado;
  return <Badge label={label} variant={variant} />;
}

// ── SectionTitle ──────────────────────────────────────────
export function SectionTitle({ children, style }) {
  return (
    <Text style={[secStyles.title, style]}>{children?.toUpperCase()}</Text>
  );
}
const secStyles = StyleSheet.create({
  title: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    letterSpacing: 1.2, marginBottom: 8,
  },
});

// ── Separator ─────────────────────────────────────────────
export function Separator() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 2 }} />;
}

// ── Loading ───────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.gold} />
    </View>
  );
}

// ── Empty ─────────────────────────────────────────────────
export function EmptyState({ icon = '—', title, sub }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      <Text style={{ fontSize: 32, marginBottom: 8 }}>{icon}</Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.cream2 }}>{title}</Text>
      {sub && <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' }}>{sub}</Text>}
    </View>
  );
}

// ── ProgressBar ───────────────────────────────────────────
export function ProgressBar({ value, max = 100 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={progStyles.track}>
      <View style={[progStyles.fill, { width: `${pct}%` }]} />
    </View>
  );
}
const progStyles = StyleSheet.create({
  track: { height: 6, backgroundColor: colors.surface3, borderRadius: 99, overflow: 'hidden', marginVertical: 6 },
  fill:  { height: '100%', backgroundColor: colors.gold, borderRadius: 99 },
});

// ── Input ─────────────────────────────────────────────────
export function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={inputStyles.label}>{label?.toUpperCase()}</Text>}
      <View style={inputStyles.inp}>
        {/* TextInput importado onde for usado */}
      </View>
    </View>
  );
}
const inputStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', color: colors.muted, letterSpacing: 1, marginBottom: 5 },
  inp: { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border2 },
});
