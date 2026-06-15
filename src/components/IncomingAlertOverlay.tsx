import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
  Vibration, Platform,
} from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../theme';
import { AlertItem } from '../store';
import { stopCallRing } from '../services/alertService';

interface Props {
  alert: AlertItem;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingAlertOverlay: React.FC<Props> = ({ alert, onAccept, onDecline }) => {
  // Animate 3 expanding ring pulses
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  // Shake animation on the shield icon
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered ring pulse loops
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1, duration: 1600, easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0, duration: 0, useNativeDriver: true,
          }),
        ])
      );

    pulse(ring1, 0).start();
    pulse(ring2, 400).start();
    pulse(ring3, 800).start();

    // Shake loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: -4, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 4, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -4, duration: 80, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.delay(500),
      ])
    ).start();

    // Vibrate in ring pattern
    const PATTERN = Platform.OS === 'android'
      ? [0, 1000, 500, 1000, 500, 1000, 500]
      : [0, 1.0, 0.5, 1.0, 0.5];
    Vibration.vibrate(PATTERN, true);

    return () => {
      Vibration.cancel();
      ring1.stopAnimation();
      ring2.stopAnimation();
      ring3.stopAnimation();
      shake.stopAnimation();
    };
  }, []);

  const ringStyle = (anim: Animated.Value, size: number) => ({
    position: 'absolute' as const,
    width: size, height: size,
    borderRadius: size / 2,
    borderWidth: 1.5,
    borderColor: Colors.red,
    top: (88 - size) / 2,
    left: (88 - size) / 2,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
  });

  const handleAccept = () => {
    Vibration.cancel();
    stopCallRing();
    onAccept();
  };

  const handleDecline = () => {
    Vibration.cancel();
    stopCallRing();
    onDecline();
  };

  return (
    <View style={styles.overlay}>
      {/* Camera preview placeholder */}
      <View style={styles.preview}>
        <View style={styles.previewTop}>
          <Text style={styles.previewTopText}>🚨  {alert.title} — {alert.cameraName || 'Security Camera'}</Text>
        </View>
        <View style={styles.previewFeed}>
          {/* In production: replace with VLCPlayer showing the camera's RTSP stream */}
          <View style={styles.previewFeedBg}>
            <View style={styles.motionBox} />
            <Text style={styles.previewCamLabel}>
              {alert.cameraName} · LIVE
            </Text>
          </View>
        </View>
      </View>

      {/* Ring animation */}
      <View style={styles.ringWrap}>
        <Animated.View style={ringStyle(ring1, 112)} />
        <Animated.View style={ringStyle(ring2, 136)} />
        <Animated.View style={ringStyle(ring3, 160)} />
        <Animated.View style={[styles.avatar, { transform: [{ translateX: shake }] }]}>
          <Text style={{ fontSize: 38 }}>🛡</Text>
        </Animated.View>
      </View>

      {/* Text */}
      <Text style={styles.callTitle}>Security Alert</Text>
      <Text style={styles.callSub}>SibrixVision · Sibrix Home</Text>
      <Text style={styles.callLoc}>📍 {alert.cameraName || 'Security System'} · just now</Text>

      {/* Buttons */}
      <View style={styles.buttons}>
        <View style={styles.btnWrap}>
          <TouchableOpacity style={[styles.callBtn, styles.declineBtn]} onPress={handleDecline} activeOpacity={0.85}>
            <Text style={styles.callBtnIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.btnLabel}>Dismiss</Text>
        </View>
        <View style={styles.btnWrap}>
          <TouchableOpacity style={[styles.callBtn, styles.acceptBtn]} onPress={handleAccept} activeOpacity={0.85}>
            <Text style={styles.callBtnIcon}>👁</Text>
          </TouchableOpacity>
          <Text style={styles.btnLabel}>View camera</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,5,10,0.97)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 52,
    zIndex: 1000,
  },
  preview: {
    width: 320, borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,68,85,0.4)',
    marginBottom: 28,
  },
  previewTop: {
    backgroundColor: 'rgba(255,68,85,0.1)',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,68,85,0.2)',
    paddingHorizontal: 12, paddingVertical: 9,
    flexDirection: 'row', alignItems: 'center',
  },
  previewTopText: { fontSize: 11, color: '#FF8090', fontFamily: Typography.display },
  previewFeed: { height: 140, backgroundColor: '#04060C' },
  previewFeedBg: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  motionBox: {
    position: 'absolute',
    left: '35%', top: '18%', width: '25%', height: '58%',
    borderWidth: 1.5, borderColor: Colors.red, borderRadius: 3,
  },
  previewCamLabel: {
    position: 'absolute', bottom: 6, left: 8,
    fontSize: 9, color: 'rgba(240,242,248,0.7)',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    fontFamily: Typography.display,
  },
  ringWrap: {
    width: 88, height: 88,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,68,85,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,68,85,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  callTitle: {
    fontFamily: Typography.display,
    fontSize: 22, color: Colors.text, marginBottom: 4,
  },
  callSub: { fontSize: 13, color: Colors.muted, marginBottom: 4 },
  callLoc: { fontSize: 12, color: Colors.red, marginBottom: 40 },
  buttons: { flexDirection: 'row', gap: 52 },
  btnWrap: { alignItems: 'center' },
  callBtn: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  declineBtn: { backgroundColor: Colors.red },
  acceptBtn: { backgroundColor: Colors.green },
  callBtnIcon: { fontSize: 26 },
  btnLabel: { fontSize: 11, color: Colors.muted, marginTop: 6, fontFamily: Typography.display },
});
