import { Platform, Vibration } from 'react-native';
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import RNCallKeep from 'react-native-callkeep';
import InCallManager from 'react-native-incall-manager';
import { AlertItem } from '../store';

// ─── CallKeep Setup (makes it ring like a real phone call) ─────────────────────

export const setupCallKeep = async () => {
  const options = {
    ios: {
      appName: 'SibrixVision',
      supportsVideo: false,
      maximumCallGroups: '1',
      maximumCallsPerCallGroup: '1',
    },
    android: {
      alertTitle: 'Permissions required',
      alertDescription: 'SibrixVision needs phone permissions to show security alerts as calls.',
      cancelButton: 'Cancel',
      okButton: 'Allow',
      imageName: 'sibrix_logo',
      additionalPermissions: [],
      // Required for Android 11+
      foregroundService: {
        channelId: 'sibrixvision-alerts',
        channelName: 'SibrixVision Security Alerts',
        notificationTitle: 'SibrixVision is running',
        notificationIcon: 'ic_notification',
      },
    },
  };

  try {
    await RNCallKeep.setup(options);
    RNCallKeep.setAvailable(true);
  } catch (err) {
    console.error('CallKeep setup error:', err);
  }
};

// ─── Push Notification Setup ──────────────────────────────────────────────────

export const setupPushNotifications = () => {
  PushNotification.configure({
    onRegister: token => {
      console.log('FCM Token:', token);
      // Save token to Supabase for this user
    },

    onNotification: notification => {
      console.log('Notification received:', notification);
      notification.finish('backgroundFetchResultNoData');
    },

    onAction: notification => {
      if (notification.action === 'VIEW') {
        // Navigate to camera screen
      }
    },

    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  // Create notification channels (Android)
  PushNotification.createChannel({
    channelId: 'sibrix-critical',
    channelName: 'Security Alerts',
    channelDescription: 'Critical security motion and intrusion alerts',
    playSound: true,
    soundName: 'sibrix_alert.mp3',
    importance: 5, // IMPORTANCE_HIGH
    vibrate: true,
  }, created => console.log('Critical channel created:', created));

  PushNotification.createChannel({
    channelId: 'sibrix-info',
    channelName: 'System Notifications',
    channelDescription: 'Biometric access, system status updates',
    playSound: false,
    importance: 3,
    vibrate: false,
  }, () => {});
};

// ─── Firebase Messaging ───────────────────────────────────────────────────────

export const setupFirebaseMessaging = async (onAlertReceived: (alert: AlertItem) => void) => {
  // Request permission (iOS)
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return;

  // Get FCM token and save to Supabase
  const fcmToken = await messaging().getToken();
  console.log('FCM Token:', fcmToken);
  // await UserService.saveFcmToken(userId, fcmToken);

  // Foreground messages
  messaging().onMessage(async remoteMessage => {
    const alert = parseFirebaseAlert(remoteMessage);
    if (alert) onAlertReceived(alert);
  });

  // Background / quit state
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    const alert = parseFirebaseAlert(remoteMessage);
    if (alert) showCallNotification(alert);
  });
};

// ─── Parse Firebase payload into AlertItem ────────────────────────────────────

const parseFirebaseAlert = (msg: any): AlertItem | null => {
  try {
    const d = msg.data;
    return {
      id: d.alert_id || String(Date.now()),
      type: d.type || 'motion_person',
      title: msg.notification?.title || 'Security Alert',
      description: msg.notification?.body || '',
      cameraId: d.camera_id,
      cameraName: d.camera_name,
      timestamp: new Date(),
      level: (d.level || 'critical') as any,
      read: false,
      dismissed: false,
    };
  } catch {
    return null;
  }
};

// ─── Show Call-Style Alert ────────────────────────────────────────────────────
// This makes the phone ring EXACTLY like an incoming phone call

export const showCallNotification = (alert: AlertItem) => {
  const callUUID = String(Math.random()); // unique ID for this "call"

  // Start InCallManager to play ringtone through speaker
  InCallManager.startRingtone('_DEFAULT_');
  InCallManager.setForceSpeakerphoneOn(true);

  // Trigger CallKeep to show native call screen
  RNCallKeep.displayIncomingCall(
    callUUID,
    'SibrixVision',                        // "from" — appears as caller
    `🚨 ${alert.title} — ${alert.cameraName || 'Security System'}`,
    'generic',
    false,                                 // not a video call
  );

  // Vibrate in ring pattern
  const PATTERN = [0, 1000, 500, 1000, 500];
  Vibration.vibrate(PATTERN, true);

  // Set up CallKeep answer handler — user picks up
  RNCallKeep.addEventListener('answerCall', ({ callUUID: id }) => {
    if (id === callUUID) {
      stopCallRing();
      // Navigation is handled by the IncomingAlertOverlay component
    }
  });

  // CallKeep end/decline handler
  RNCallKeep.addEventListener('endCall', ({ callUUID: id }) => {
    if (id === callUUID) {
      stopCallRing();
    }
  });

  // Auto-cancel after 45 seconds if not answered
  setTimeout(() => {
    RNCallKeep.endCall(callUUID);
    stopCallRing();
  }, 45000);
};

export const stopCallRing = () => {
  InCallManager.stopRingtone();
  InCallManager.setForceSpeakerphoneOn(false);
  Vibration.cancel();
};

// ─── Local notification (when already in app) ─────────────────────────────────

export const showLocalAlert = (alert: AlertItem) => {
  PushNotification.localNotification({
    channelId: alert.level === 'critical' ? 'sibrix-critical' : 'sibrix-info',
    title: `🚨 ${alert.title}`,
    message: alert.description,
    soundName: 'sibrix_alert.mp3',
    vibrate: true,
    priority: 'high',
    importance: 'high',
    actions: ['View Camera', 'Dismiss'],
    invokeApp: true,
    userInfo: { alertId: alert.id, cameraId: alert.cameraId },
  });
};
