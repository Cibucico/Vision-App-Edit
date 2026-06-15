import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Switch, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

// ─── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'dim';

const BADGE_COLORS: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  green:  { bg: 'rgba(16,230,138,0.12)',   text: '#10E68A', border: 'rgba(16,230,138,0.25)' },
  red:    { bg: 'rgba(255,68,85,0.12)',    text: '#FF6B77', border: 'rgba(255,68,85,0.25)' },
  amber:  { bg: 'rgba(255,170,0,0.12)',    text: '#FFAA00', border: 'rgba(255,170,0,0.25)' },
  blue:   { bg: 'rgba(59,110,248,0.12)',   text: '#7BA4FB', border: 'rgba(59,110,248,0.25)' },
  purple: { bg: 'rgba(155,127,255,0.12)',  text: '#B49FFF', border: 'rgba(155,127,255,0.25)' },
  dim:    { bg: Colors.surface2,           text: Colors.muted, border: Colors.border },
};

export const Badge = ({ label, variant = 'dim' }: { label: string; variant?: BadgeVariant }) => {
  const c = BADGE_COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

// ─── Card ──────────────────────────────────────────────────────────────────────

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const CardHeader = ({
  title, right, onRight, rightLabel = 'View all →',
}: { title: string; right?: boolean; onRight?: () => void; rightLabel?: string }) => (
  <View style={styles.cardHeader}>
    <Text style={styles.cardTitle}>{title}</Text>
    {right && (
      <TouchableOpacity onPress={onRight}>
        <Text style={styles.seeAll}>{rightLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────

export const StatCard = ({
  icon, value, label, color,
}: { icon: string; value: string | number; label: string; color: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statVal, { color }]}>{value}</Text>
    <Text style={styles.statLbl}>{label}</Text>
  </View>
);

// ─── Section Label ─────────────────────────────────────────────────────────────

export const SectionLabel = ({ label }: { label: string }) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// ─── Toggle Row ────────────────────────────────────────────────────────────────

export const ToggleRow = ({
  label, subtitle, value, onChange,
}: { label: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void }) => (
  <View style={styles.toggleRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.toggleLabel}>{label}</Text>
      {subtitle && <Text style={styles.toggleSub}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: Colors.dim, true: Colors.blue }}
      thumbColor="#fff"
      ios_backgroundColor={Colors.dim}
    />
  </View>
);

// ─── Device Row ────────────────────────────────────────────────────────────────

export const DeviceRow = ({
  icon, iconBg, name, subtitle, right, onPress,
}: {
  icon: string; iconBg: string; name: string; subtitle: string;
  right?: React.ReactNode; onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.deviceRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.deviceIcon, { backgroundColor: iconBg }]}>
      <Text style={{ fontSize: 17 }}>{icon}</Text>
    </View>
    <View style={styles.deviceInfo}>
      <Text style={styles.deviceName}>{name}</Text>
      <Text style={styles.deviceSub}>{subtitle}</Text>
    </View>
    {right && <View style={styles.deviceRight}>{right}</View>}
  </TouchableOpacity>
);

// ─── Back Button ───────────────────────────────────────────────────────────────

export const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.backBtn} onPress={onPress} activeOpacity={0.7}>
    <Text style={{ color: Colors.text, fontSize: 18 }}>←</Text>
  </TouchableOpacity>
);

// ─── Primary Button ────────────────────────────────────────────────────────────

export const PrimaryButton = ({
  label, onPress, loading, style,
}: { label: string; onPress: () => void; loading?: boolean; style?: ViewStyle }) => (
  <TouchableOpacity
    style={[styles.primaryBtn, style]}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={loading}
  >
    {loading
      ? <ActivityIndicator color="#fff" size="small" />
      : <Text style={styles.primaryBtnText}>{label}</Text>
    }
  </TouchableOpacity>
);

// ─── Chip Filter ───────────────────────────────────────────────────────────────

export const ChipGroup = ({
  options, selected, onSelect,
}: { options: string[]; selected: string; onSelect: (v: string) => void }) => (
  <View style={styles.chipRow}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt}
        style={[styles.chip, selected === opt && styles.chipActive]}
        onPress={() => onSelect(opt)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>{opt}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Info Banner ──────────────────────────────────────────────────────────────

export const InfoBanner = ({ text }: { text: string }) => (
  <View style={styles.infoBanner}>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: Radius.pill, borderWidth: 0.5,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.display,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  cardTitle: {
    fontFamily: Typography.display,
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  seeAll: {
    fontSize: Typography.sizes.sm, color: Colors.blue,
  },
  statCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: 12, flex: 1,
  },
  statIcon: { fontSize: 18, marginBottom: 6 },
  statVal: {
    fontFamily: Typography.display,
    fontSize: Typography.sizes.xxl,
    lineHeight: 28,
  },
  statLbl: { fontSize: Typography.sizes.sm, color: Colors.muted, marginTop: 4 },
  sectionLabel: {
    fontFamily: Typography.display,
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  toggleLabel: { fontSize: Typography.sizes.base, color: Colors.text, fontFamily: Typography.bodyMed },
  toggleSub: { fontSize: Typography.sizes.sm, color: Colors.muted, marginTop: 1 },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  deviceIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: Typography.sizes.base, color: Colors.text, fontFamily: Typography.bodyMed },
  deviceSub: { fontSize: Typography.sizes.sm, color: Colors.muted, marginTop: 1 },
  deviceRight: { alignItems: 'flex-end', gap: 3 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.surface2,
    borderWidth: 0.5, borderColor: Colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: Typography.display,
    fontSize: 14, color: '#fff', letterSpacing: 0.2,
  },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface2,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.blueDim,
    borderColor: Colors.blueGlow,
  },
  chipText: { fontSize: Typography.sizes.sm, color: Colors.muted, fontFamily: Typography.display },
  chipTextActive: { color: Colors.blue },
  infoBanner: {
    backgroundColor: Colors.blueDim,
    borderWidth: 0.5, borderColor: Colors.blueGlow,
    borderRadius: Radius.lg, padding: 12,
  },
  infoText: { fontSize: 12, color: '#93B5FC', lineHeight: 18 },
});
