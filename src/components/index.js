import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { C, R, S, T } from "../theme";
const BTN_VARIANTS = {
  gold: { bg: C.gold, border: "transparent", text: "#1a0800", weight: "700" },
  green: { bg: C.green, border: "transparent", text: "#fff", weight: "600" },
  red: { bg: C.red, border: "transparent", text: "#fff", weight: "600" },
  amber: { bg: C.amber, border: "transparent", text: "#fff", weight: "600" },
  ghost: {
    bg: "transparent",
    border: C.border2,
    text: C.cream2,
    weight: "500",
  },
  default: { bg: C.surface2, border: C.border2, text: C.cream2, weight: "500" },
};
const BADGE_VARIANTS = {
  gold: { bg: C.goldDim, text: C.gold, border: C.goldBorder },
  green: { bg: C.greenBg, text: C.greenText, border: "transparent" },
  red: { bg: C.redBg, text: C.redText, border: "transparent" },
  amber: { bg: C.amberBg, text: C.amberText, border: "transparent" },
  blue: { bg: C.blueBg, text: C.blueText, border: "transparent" },
  purple: { bg: C.purpleBg, text: C.purpleText, border: "transparent" },
  default: { bg: C.surface3, text: C.muted, border: "transparent" },
};
const STATUS_BADGES = {
  pendente: { label: "Pendente", variant: "amber" },
  autorizado: { label: "Autorizado", variant: "green" },
  recusado: { label: "Recusado", variant: "red" },
  expirado: { label: "Expirado", variant: "default" },
};
const PLANO_BADGES = {
  completo: { label: "Completo", variant: "gold" },
  sem_barba: { label: "Sem Barba", variant: "blue" },
  so_barba: { label: "So Barba", variant: "amber" },
};
const CAT_BADGES = {
  corte: { label: "Corte", variant: "gold" },
  barba: { label: "Barba", variant: "gold" },
  bebida: { label: "Bebida", variant: "blue" },
  produto: { label: "Produto", variant: "default" },
};
export function Button({
  title,
  onPress,
  variant = "default",
  disabled = false,
  loading = false,
  style,
  small = false,
}) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.default;
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        btn.base,
        small && btn.small,
        { backgroundColor: v.bg, borderColor: v.border },
        isDisabled && btn.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text
          style={[
            btn.txt,
            { color: v.text, fontWeight: v.weight },
            small && btn.smallTxt,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
export function Card({ children, style, gold, amber, green }) {
  return (
    <View
      style={[
        card.base,
        gold && card.gold,
        amber && card.amber,
        green && card.green,
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Input({ label, error, style, inputStyle, ...props }) {
  return (
    <View style={[inp.wrapper, style]}>
      {label ? <Text style={inp.lbl}>{label}</Text> : null}
      <TextInput
        style={[inp.inp, error && inp.err, inputStyle]}
        placeholderTextColor={C.muted}
        {...props}
      />
      {error ? <Text style={inp.errTxt}>{error}</Text> : null}
    </View>
  );
}
export function Badge({ label, variant = "default" }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;
  return (
    <View style={[bdg.base, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[bdg.txt, { color: v.text }]}>{label}</Text>
    </View>
  );
}
export function StatusBadge({ status }) {
  const info = STATUS_BADGES[status] || STATUS_BADGES.expirado;
  return <Badge label={info.label} variant={info.variant} />;
}
export function PlanoBadge({ tipo }) {
  const info = PLANO_BADGES[tipo] || PLANO_BADGES.completo;
  return <Badge label={info.label} variant={info.variant} />;
}
export function CatBadge({ cat }) {
  const info = CAT_BADGES[cat] || { label: cat, variant: "default" };
  return <Badge label={info.label} variant={info.variant} />;
}
export function Avatar({ nome, tipo, size = 36 }) {
  const bg = tipo === "mensalista" ? C.purpleBg : C.goldDim;
  const border = tipo === "mensalista" ? "rgba(144,96,208,.3)" : C.goldBorder;
  const text = tipo === "mensalista" ? C.purpleText : C.gold;
  const initials = (nome || "??")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View
      style={[
        avatar.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: border,
        },
      ]}
    >
      <Text style={{ color: text, fontSize: size * 0.33, fontWeight: "700" }}>
        {initials || "??"}
      </Text>
    </View>
  );
}
export function ProgressBar({ value, max = 100 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={progress.track}>
      <View style={[progress.fill, { width: `${pct}%` }]} />
    </View>
  );
}
export function SectionTitle({ children, style }) {
  return <Text style={[T.label, section.title, style]}>{children}</Text>;
}
export function Sep() {
  return <View style={sep.line} />;
}
export function Loading() {
  return (
    <View style={loadingStyles.root}>
      <ActivityIndicator size="large" color={C.gold} />
    </View>
  );
}
export function Empty({ title, sub }) {
  return (
    <View style={empty.root}>
      <Text style={empty.icon}>*</Text>
      <Text style={[T.h3, empty.title]}>{title}</Text>
      {sub ? <Text style={[T.small, empty.sub]}>{sub}</Text> : null}
    </View>
  );
}
export function Alert({ msg, tipo = "info" }) {
  if (!msg) return null;
  const styles = {
    ok: { bg: C.greenBg, text: C.greenText, border: "rgba(45,143,82,.35)" },
    err: { bg: C.redBg, text: C.redText, border: "rgba(196,64,64,.35)" },
    warn: { bg: C.amberBg, text: C.amberText, border: "rgba(196,128,58,.35)" },
    info: { bg: C.blueBg, text: C.blueText, border: "rgba(58,112,196,.35)" },
  };
  const s = styles[tipo] || styles.info;
  return (
    <View
      style={[alertBox.root, { backgroundColor: s.bg, borderColor: s.border }]}
    >
      <Text style={[alertBox.text, { color: s.text }]}>{msg}</Text>
    </View>
  );
}
export function TopBar({ title, sub, right, onBack }) {
  return (
    <View style={topBar.bar}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={topBar.back}>
          <Text style={topBar.backText}>{"<"}</Text>
        </TouchableOpacity>
      ) : null}
      <View style={topBar.titleWrap}>
        <Text style={[T.h3, topBar.title]}>{title}</Text>
        {sub ? <Text style={T.tiny}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}
export function TabBar({ tabs, active, onChange }) {
  return (
    <View style={tab.bar}>
      {tabs.map((tabLabel, index) => (
        <TouchableOpacity
          key={tabLabel}
          onPress={() => onChange(index)}
          style={[tab.item, active === index && tab.active]}
        >
          <Text
            style={[tab.txt, active === index && tab.activeTxt]}
            numberOfLines={1}
          >
            {tabLabel}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const btn = StyleSheet.create({
  base: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: R.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  small: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: R.sm },
  txt: { fontSize: 14 },
  smallTxt: { fontSize: 12 },
  disabled: { opacity: 0.4 },
});
const card = StyleSheet.create({
  base: {
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.lg,
  },
  gold: { borderColor: C.goldBorder, backgroundColor: "#0f0c06" },
  amber: { borderColor: "rgba(196,128,58,.4)", backgroundColor: C.amberBg },
  green: { borderColor: "rgba(45,143,82,.3)", backgroundColor: C.greenBg },
});
const inp = StyleSheet.create({
  wrapper: { marginBottom: S.md },
  lbl: { ...T.label, marginBottom: 5 },
  inp: {
    backgroundColor: C.surface2,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border2,
    color: C.cream,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  err: { borderColor: C.red },
  errTxt: { color: C.redText, fontSize: 12, marginTop: 4 },
});
const bdg = StyleSheet.create({
  base: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: R.full,
    borderWidth: 1,
  },
  txt: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});
const avatar = StyleSheet.create({
  base: { borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
const progress = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: C.surface3,
    borderRadius: R.full,
    overflow: "hidden",
    marginVertical: 6,
  },
  fill: { height: "100%", backgroundColor: C.gold, borderRadius: R.full },
});
const section = StyleSheet.create({
  title: { marginBottom: S.sm },
});
const sep = StyleSheet.create({
  line: { height: 1, backgroundColor: C.border },
});
const loadingStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
});
const empty = StyleSheet.create({
  root: { alignItems: "center", paddingVertical: 40 },
  icon: { fontSize: 32, marginBottom: 10, opacity: 0.4, color: C.gold },
  title: { marginBottom: 4 },
  sub: { textAlign: "center" },
});
const alertBox = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: R.md, padding: 10, marginBottom: S.md },
  text: { fontSize: 13 },
});
const topBar = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  back: { marginRight: S.sm },
  backText: { color: C.gold, fontSize: 22 },
  titleWrap: { flex: 1 },
  title: { color: C.gold, letterSpacing: 0.4 },
});
const tab = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  active: { borderBottomColor: C.gold },
  txt: { fontSize: 11, fontWeight: "500", color: C.muted },
  activeTxt: { color: C.gold, fontWeight: "700" },
});
