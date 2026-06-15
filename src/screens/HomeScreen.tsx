import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { Colors, Typography, Spacing, Radius } from '../theme';
import {
  StatCard, Card, CardHeader, SectionLabel, Badge,
} from '../components';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { isArmed, toggleArmed, cameras, alerts, users, sensors, setIncomingAlert } = useStore();

  const onlineCameras = cameras.filter(c => c.status !== 'offline').length;
  const unreadAlerts = alerts.filter(a => !a.read && !a.dismissed).length;
  const activeUsers = users.filter(u => u.isOnline).length;
  const sensorsOk = sensors.filter(s => s.status === 'normal').length;

  const recentAlerts = alerts.filter(a => !a.dismissed).slice(0, 3);
  const liveCameras = cameras.slice(0, 4);

  const triggerTestAlert = () => {
    const testAlert = {
      id: 'test-' + Date.now(),
      type: 'motion_person' as const,
      title: 'Person detected',
      description: 'Front Door · AI WizSense · high confidence',
      cameraId: 'cam1',
      cameraName: 'Front Door',
      timestamp: new Date(),
      level: 'critical' as const,
      read: false,
      dismissed: false,
    };
    setIncomingAlert(testAlert);
  };

  const alertLevelColor = (level: string) => {
    if (level === 'critical') return Colors.red;
    if (level === 'warning') return Colors.amber;
    if (level === 'info') return Colors.blue;
    return Colors.muted;
  };

  const alertIcon = (type: string) => {
    const icons: Record<string, string> = {
      motion_person: '🏃', motion_vehicle: '🚗', door_open: '🚪',
      biometric: '🖐', armed: '🛡', lpr: '🚗', smoke: '🔥', offline: '📡',
    };
    return icons[type] || '🔔';
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Brand Bar */}
      <View style={styles.brandBar}>
        <View style={styles.brandLogo}><Text style={{ fontSize: 16 }}>🛡</Text></View>
        <View>
          <Text style={styles.brandName}>SibrixVision</Text>
          <Text style={styles.brandSub}>sibrixgroup.co.za</Text>
        </View>
        <TouchableOpacity
          style={[styles.armedPill, !isArmed && styles.disarmedPill]}
          onPress={toggleArmed}
          activeOpacity={0.8}
        >
          <View style={[styles.armedDot, { backgroundColor: isArmed ? Colors.green : Colors.amber }]} />
          <Text style={[styles.armedText, { color: isArmed ? Colors.green : Colors.amber }]}>
            {isArmed ? 'Armed' : 'Disarmed'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="📷" value={onlineCameras} label="Cameras online" color={Colors.green} />
          <StatCard icon="🔔" value={unreadAlerts} label="Alerts today" color={Colors.amber} />
          <StatCard icon="👥" value={activeUsers} label="Active users" color={Colors.blue} />
          <StatCard icon="📡" value={sensorsOk} label="Sensors OK" color={Colors.cyan} />
        </View>

        {/* Live Camera Grid */}
        <Card>
          <CardHeader title="Live cameras" right onRight={() => navigation.navigate('Cameras')} />
          <View style={styles.camGrid}>
            {liveCameras.map(cam => (
              <TouchableOpacity
                key={cam.id}
                style={[styles.camThumb, cam.status === 'motion' && styles.camMotionActive]}
                onPress={() => navigation.navigate('CameraDetail', { camera: cam })}
                activeOpacity={0.8}
              >
                {cam.status === 'offline' ? (
                  <View style={styles.offlineCell}>
                    <Text style={{ fontSize: 18, color: Colors.dim }}>📡</Text>
                    <Text style={styles.offlineText}>Offline</Text>
                  </View>
                ) : (
                  <>
                    {/* In production: replace with VLCPlayer rtspUrl={cam.rtspUrl} */}
                    <View style={[styles.camFeedBg, cam.status === 'motion' && { backgroundColor: '#110505' }]} />
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                    {cam.status === 'motion' && (
                      <View style={styles.motionBadge}><Text style={styles.motionText}>MOTION</Text></View>
                    )}
                  </>
                )}
                <Text style={styles.camName} numberOfLines={1}>{cam.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Recent Alerts */}
        <SectionLabel label="Recent alerts" />
        <Card>
          {recentAlerts.map((alert, i) => (
            <View key={alert.id} style={[styles.alertRow, i === recentAlerts.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.alertIcon, { backgroundColor: alertLevelColor(alert.level) + '20' }]}>
                <Text style={{ fontSize: 17 }}>{alertIcon(alert.type)}</Text>
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.description}</Text>
                <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
                {alert.level === 'critical' && (
                  <View style={styles.alertActions}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => alert.cameraId && navigation.navigate('CameraDetail', {
                        camera: cameras.find(c => c.id === alert.cameraId),
                      })}
                    >
                      <Text style={styles.viewBtnText}>View clip</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Badge
                label={alert.level === 'critical' ? 'New' : alert.level === 'warning' ? 'Check' : alert.level === 'info' ? 'OK' : 'Log'}
                variant={alert.level === 'critical' ? 'red' : alert.level === 'warning' ? 'amber' : alert.level === 'info' ? 'green' : 'dim'}
              />
            </View>
          ))}
        </Card>

        {/* Test Alert Button */}
        <TouchableOpacity style={styles.testAlertBtn} onPress={triggerTestAlert} activeOpacity={0.8}>
          <Text style={styles.testAlertText}>🔔  Simulate Incoming Alert Call</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const formatTime = (date: Date): string => {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  brandBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  brandLogo: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontFamily: Typography.display, fontSize: 17, color: Colors.text },
  brandSub: { fontSize: 10, color: Colors.muted },
  armedPill: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,230,138,0.1)',
    borderWidth: 0.5, borderColor: 'rgba(16,230,138,0.25)',
    borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5,
  },
  disarmedPill: {
    backgroundColor: Colors.amberDim,
    borderColor: 'rgba(255,170,0,0.3)',
  },
  armedDot: { width: 6, height: 6, borderRadius: 3 },
  armedText: { fontFamily: Typography.display, fontSize: 10 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.sm + 2, paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  camGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10 },
  camThumb: {
    width: '48%', aspectRatio: 16 / 10,
    backgroundColor: '#04060C', borderRadius: 10,
    overflow: 'hidden', borderWidth: 0.5, borderColor: Colors.border,
  },
  camMotionActive: { borderColor: Colors.red },
  camFeedBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#04060C' },
  offlineCell: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  offlineText: { fontSize: 9, color: Colors.dim, fontFamily: Typography.display },
  liveBadge: {
    position: 'absolute', top: 5, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.green },
  liveText: { fontSize: 8, color: Colors.green, fontFamily: Typography.display, letterSpacing: 0.6 },
  motionBadge: {
    position: 'absolute', top: 5, right: 6,
    backgroundColor: 'rgba(255,68,85,0.85)', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  motionText: { fontSize: 8, color: '#fff', fontFamily: Typography.display, letterSpacing: 0.4 },
  camName: {
    position: 'absolute', bottom: 5, left: 6, right: 6,
    fontSize: 9, color: 'rgba(240,242,248,0.8)',
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    fontFamily: Typography.display,
  },
  alertRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  alertIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 13, fontFamily: Typography.bodyMed, color: Colors.text },
  alertDesc: { fontSize: 11, color: Colors.muted, marginTop: 1, lineHeight: 16 },
  alertTime: { fontSize: 10, color: Colors.dim, marginTop: 3 },
  alertActions: { flexDirection: 'row', gap: 6, marginTop: 6 },
  viewBtn: {
    backgroundColor: Colors.blueDim, borderWidth: 0.5,
    borderColor: Colors.blueGlow, borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  viewBtnText: { fontSize: 11, color: Colors.blue, fontFamily: Typography.display },
  testAlertBtn: {
    backgroundColor: Colors.redDim,
    borderWidth: 0.5, borderColor: 'rgba(255,68,85,0.3)',
    borderRadius: Radius.lg, paddingVertical: 13,
    alignItems: 'center',
  },
  testAlertText: { color: Colors.red, fontFamily: Typography.display, fontSize: 13, letterSpacing: 0.3 },
});
