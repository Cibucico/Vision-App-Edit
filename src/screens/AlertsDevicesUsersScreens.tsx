// ─────────────────────────────────────────────────────────────────────────────
//  AlertsScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, AlertItem } from '../store';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Badge, Card, ChipGroup, ToggleRow, SectionLabel } from '../components';

export const AlertsScreen = () => {
  const navigation = useNavigation<any>();
  const { alerts, cameras, dismissAlert, markAlertRead, notificationSettings, updateNotificationSettings } = useStore();
  const [filter, setFilter] = useState('All');

  const FILTERS = ['All', 'Motion', 'Access', 'Sensors'];

  const filterAlert = (a: AlertItem) => {
    if (a.dismissed) return false;
    if (filter === 'Motion') return a.type === 'motion_person' || a.type === 'motion_vehicle' || a.type === 'lpr';
    if (filter === 'Access') return a.type === 'biometric' || a.type === 'armed';
    if (filter === 'Sensors') return a.type === 'door_open' || a.type === 'smoke';
    return true;
  };

  const visible = alerts.filter(filterAlert);

  const alertIcon = (type: string) => ({
    motion_person: '🏃', motion_vehicle: '🚗', door_open: '🚪',
    biometric: '🖐', armed: '🛡', lpr: '🚗', smoke: '🔥', offline: '📡',
  }[type] || '🔔');

  const badgeVariant = (level: string): any => ({
    critical: 'red', warning: 'amber', info: 'green', log: 'dim',
  }[level] || 'dim');

  const badgeLabel = (level: string) => ({
    critical: 'New', warning: 'Check', info: 'OK', log: 'Log',
  }[level] || 'Info');

  const formatTime = (d: Date) => {
    const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    return `${Math.floor(m / 60)} hr ago`;
  };

  return (
    <SafeAreaView style={al.safe}>
      <View style={al.topbar}>
        <View>
          <Text style={al.title}>Alerts</Text>
          <Text style={al.sub}>Today · {alerts.filter(a => !a.read && !a.dismissed).length} unread</Text>
        </View>
      </View>

      <ScrollView style={al.scroll} contentContainerStyle={al.content} showsVerticalScrollIndicator={false}>
        <ChipGroup options={FILTERS} selected={filter} onSelect={setFilter} />

        <Card>
          {visible.map((alert, i) => (
            <View key={alert.id} style={[al.alertRow, i === visible.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[al.alertIcon, { backgroundColor: Colors.red + '20' }]}>
                <Text style={{ fontSize: 17 }}>{alertIcon(alert.type)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={al.alertTitle}>{alert.title}</Text>
                <Text style={al.alertDesc}>{alert.description}</Text>
                <Text style={al.alertTime}>{formatTime(alert.timestamp)}</Text>
                {alert.level === 'critical' && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <TouchableOpacity
                      style={al.viewBtn}
                      onPress={() => {
                        markAlertRead(alert.id);
                        const cam = cameras.find(c => c.id === alert.cameraId);
                        if (cam) navigation.navigate('CameraDetail', { camera: cam });
                      }}
                    >
                      <Text style={al.viewBtnText}>View clip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={al.dismissBtn} onPress={() => dismissAlert(alert.id)}>
                      <Text style={al.dismissBtnText}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Badge label={badgeLabel(alert.level)} variant={badgeVariant(alert.level)} />
            </View>
          ))}
          {visible.length === 0 && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: Colors.muted, fontSize: 13 }}>No alerts in this category</Text>
            </View>
          )}
        </Card>

        <SectionLabel label="Notification settings" />
        <Card>
          <ToggleRow label="📞 Call-style alerts" subtitle="Ring like a phone call on motion" value={notificationSettings.callStyleAlerts} onChange={v => updateNotificationSettings({ callStyleAlerts: v })} />
          <ToggleRow label="🧠 AI persons only" subtitle="Skip animals & false triggers" value={notificationSettings.aiPersonOnly} onChange={v => updateNotificationSettings({ aiPersonOnly: v })} />
          <ToggleRow label="🌙 Silent hours" subtitle="22:00 – 06:00 · push only" value={notificationSettings.silentHoursEnabled} onChange={v => updateNotificationSettings({ silentHoursEnabled: v })} />
          <ToggleRow label="💬 WhatsApp alerts" subtitle="Send snapshot to +27 82 ···" value={notificationSettings.whatsappAlerts} onChange={v => updateNotificationSettings({ whatsappAlerts: v })} />
          <ToggleRow label="🚗 Licence plate alerts" subtitle="Unknown vehicle detected" value={notificationSettings.lprAlerts} onChange={v => updateNotificationSettings({ lprAlerts: v })} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const al = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topbar: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontFamily: Typography.display, fontSize: 18, color: Colors.text },
  sub: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: 10, paddingBottom: 32 },
  alertRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  alertIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontFamily: Typography.bodyMed, color: Colors.text },
  alertDesc: { fontSize: 11, color: Colors.muted, marginTop: 1, lineHeight: 16 },
  alertTime: { fontSize: 10, color: Colors.dim, marginTop: 3 },
  viewBtn: { backgroundColor: Colors.blueDim, borderWidth: 0.5, borderColor: Colors.blueGlow, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  viewBtnText: { fontSize: 11, color: Colors.blue, fontFamily: Typography.display },
  dismissBtn: { backgroundColor: Colors.surface2, borderWidth: 0.5, borderColor: Colors.border, borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  dismissBtnText: { fontSize: 11, color: Colors.muted, fontFamily: Typography.display },
});


// ─────────────────────────────────────────────────────────────────────────────
//  DevicesScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Card, SectionLabel, DeviceRow, Badge, InfoBanner, PrimaryButton } from '../components';

export const DevicesScreen = () => {
  const navigation = useNavigation<any>();
  const { cameras, sensors, biometrics, dvr } = useStore();

  const cameraIcon = (brand: string) => ({ dahua: '📷', hikvision: '📷', reolink: '📷', axis: '📷', onvif: '📡', rtsp: '📡' }[brand] || '📷');
  const sensorIcon = (type: string) => ({ door: '🚪', pir: '〰', smoke: '🔥', temperature: '🌡', glass_break: '🪟' }[type] || '📡');
  const cameraStatusVariant = (status: string): any => ({ online: 'green', offline: 'red', motion: 'red' }[status] || 'dim');
  const sensorStatusVariant = (status: string): any => ({ normal: 'green', active: 'amber', open: 'amber', triggered: 'red' }[status] || 'dim');
  const sensorStatusLabel = (status: string) => ({ normal: 'Normal', active: 'Active', open: 'Open', triggered: 'Triggered' }[status] || status);

  return (
    <SafeAreaView style={dv.safe}>
      <View style={dv.topbar}>
        <View>
          <Text style={dv.title}>Devices</Text>
          <Text style={dv.sub}>All connected hardware</Text>
        </View>
        <TouchableOpacity style={dv.addBtn} onPress={() => navigation.navigate('AddCamera')}>
          <Text style={dv.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={dv.content} showsVerticalScrollIndicator={false}>
        <SectionLabel label={`Cameras (${cameras.length})`} />
        <Card>
          {cameras.map((cam, i) => (
            <View key={cam.id} style={i === cameras.length - 1 ? { borderBottomWidth: 0 } : {}}>
              <DeviceRow
                icon={cameraIcon(cam.brand)}
                iconBg="rgba(59,110,248,0.12)"
                name={cam.name}
                subtitle={`${cam.model} · ${cam.type === 'outdoor' ? 'Outdoor · ' + (cam.ipRating || '') : 'Indoor'}`}
                onPress={() => navigation.navigate('CameraDetail', { camera: cam })}
                right={
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Badge label={cam.status === 'motion' ? 'Motion' : cam.status === 'online' ? 'Online' : 'Offline'} variant={cameraStatusVariant(cam.status)} />
                    <Text style={{ fontSize: 10, color: Colors.muted }}>{cam.brand}</Text>
                  </View>
                }
              />
            </View>
          ))}
        </Card>

        <SectionLabel label={`Sensors (${sensors.length})`} />
        <Card>
          {sensors.map((sen, i) => (
            <View key={sen.id} style={i === sensors.length - 1 ? { borderBottomWidth: 0 } : {}}>
              <DeviceRow
                icon={sensorIcon(sen.type)}
                iconBg={sen.status === 'normal' ? 'rgba(16,230,138,0.08)' : Colors.amberDim}
                name={sen.name}
                subtitle={`${sen.type.replace('_', ' ')} · Zone ${sen.zone}`}
                right={<Badge label={sensorStatusLabel(sen.status)} variant={sensorStatusVariant(sen.status)} />}
              />
            </View>
          ))}
        </Card>

        <SectionLabel label={`Biometric scanners (${biometrics.length})`} />
        <Card>
          {biometrics.map((bio, i) => (
            <View key={bio.id} style={i === biometrics.length - 1 ? { borderBottomWidth: 0 } : {}}>
              <DeviceRow
                icon={bio.type.includes('fingerprint') ? '🖐' : '🪪'}
                iconBg="rgba(155,127,255,0.12)"
                name={bio.name}
                subtitle={`${bio.type.join(' + ')} · ${bio.enrolledCount} enrolled · ${bio.brand}`}
                right={<Badge label={bio.status === 'online' ? 'Online' : 'Offline'} variant={bio.status === 'online' ? 'green' : 'red'} />}
              />
            </View>
          ))}
        </Card>

        {dvr && (
          <>
            <SectionLabel label="DVR / NVR" />
            <Card>
              <DeviceRow
                icon="🖥"
                iconBg="rgba(59,110,248,0.1)"
                name={dvr.name}
                subtitle={`${dvr.model} · ${dvr.hddSizeGB / 1000}TB · H.265+ · WizSense AI`}
                right={
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Badge label={dvr.status === 'online' ? 'Online' : 'Offline'} variant={dvr.status === 'online' ? 'green' : 'red'} />
                    <Text style={{ fontSize: 10, color: Colors.muted }}>HDD {dvr.hddUsedPercent}%</Text>
                  </View>
                }
              />
            </Card>
          </>
        )}

        <SectionLabel label="Compatible brands" />
        <Card style={{ padding: 14 }}>
          <InfoBanner text="Connect any camera with RTSP or ONVIF — Dahua, Hikvision, Reolink, Axis, Bosch, and more. No vendor lock-in." />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const dv = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontFamily: Typography.display, fontSize: 18, color: Colors.text },
  sub: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  addBtn: { backgroundColor: Colors.blue, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { fontFamily: Typography.display, fontSize: 12, color: '#fff' },
  content: { padding: Spacing.lg, gap: 10, paddingBottom: 32 },
});


// ─────────────────────────────────────────────────────────────────────────────
//  UsersScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useStore } from '../store';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Card, Badge, SectionLabel, InfoBanner } from '../components';

export const UsersScreen = () => {
  const { users, currentUser } = useStore();

  const roleColor = (role: string): any => ({ owner: 'blue', family: 'green', staff: 'dim', installer: 'amber' }[role] || 'dim');
  const roleLabel = (role: string) => ({ owner: 'Owner', family: 'Family', staff: 'Staff', installer: 'Installer' }[role] || role);

  const PERM_ROLES = [
    { icon: '👑', name: 'Owner', desc: 'Full control — all cameras, users, and settings' },
    { icon: '🏠', name: 'Family', desc: 'Live view on selected cameras, receive alerts' },
    { icon: '🪪', name: 'Staff', desc: 'Business cameras only, owner-defined scope' },
    { icon: '🔧', name: 'Installer', desc: 'Setup & maintenance only — no footage access' },
  ];

  return (
    <SafeAreaView style={us.safe}>
      <View style={us.topbar}>
        <View>
          <Text style={us.title}>Users & Access</Text>
          <Text style={us.sub}>1 account · {users.length} users</Text>
        </View>
        <TouchableOpacity style={us.inviteBtn}>
          <Text style={us.inviteBtnText}>+ Invite</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={us.content} showsVerticalScrollIndicator={false}>
        <InfoBanner text="All users share one SibrixVision account. Each has individual permissions, a unique PIN, and optional biometric enrolment. Perfect for households and small businesses." />

        <SectionLabel label={`Account users (${users.length})`} />
        <Card>
          {users.map((user, i) => (
            <View key={user.id} style={[us.userRow, i === users.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[us.avatar, { backgroundColor: user.avatarColor }]}>
                <Text style={[us.avatarText, { color: Colors.text }]}>{user.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={us.userName}>{user.name}</Text>
                <Text style={us.userSub}>{roleLabel(user.role)} · {user.permissions.cameras[0] === '*' ? 'All locations' : `${user.permissions.cameras.length} cameras`}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <Badge label={roleLabel(user.role)} variant={roleColor(user.role)} />
                {user.isOnline && <Text style={{ fontSize: 10, color: Colors.green }}>● Online</Text>}
              </View>
            </View>
          ))}
        </Card>

        <SectionLabel label="Permission roles" />
        <Card>
          {PERM_ROLES.map((r, i) => (
            <View key={r.name} style={[us.permRow, i === PERM_ROLES.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 18 }}>{r.icon}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={us.permName}>{r.name}</Text>
                <Text style={us.permDesc}>{r.desc}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const us = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontFamily: Typography.display, fontSize: 18, color: Colors.text },
  sub: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  inviteBtn: { backgroundColor: Colors.blue, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  inviteBtnText: { fontFamily: Typography.display, fontSize: 12, color: '#fff' },
  content: { padding: Spacing.lg, gap: 10, paddingBottom: 32 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Typography.display, fontSize: 12 },
  userName: { fontSize: 13, fontFamily: Typography.bodyMed, color: Colors.text },
  userSub: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  permName: { fontSize: 13, fontFamily: Typography.bodyMed, color: Colors.text },
  permDesc: { fontSize: 11, color: Colors.muted, marginTop: 1 },
});
