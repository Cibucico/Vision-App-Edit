// ─────────────────────────────────────────────────────────────────────────────
//  navigation/index.tsx — Stack + Bottom Tab Navigation
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors, Typography } from '../theme';

import { HomeScreen } from '../screens/HomeScreen';
import { CameraDetailScreen } from '../screens/CameraDetailScreen';
import {
  AlertsScreen, DevicesScreen, UsersScreen,
} from '../screens/AlertsDevicesUsersScreens';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Tab icon SVGs (inline) ─────────────────────────────────────────────────

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const color = focused ? Colors.blue : Colors.dim;
  const icons: Record<string, string> = {
    Home: '⌂', Cameras: '▶', Alerts: '🔔', Devices: '▣', Users: '👥',
  };
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 18, color }}>{icons[name]}</Text>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: focused ? Colors.blue : 'transparent' }} />
    </View>
  );
};

// ── Main Tabs ──────────────────────────────────────────────────────────────

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        borderTopWidth: 0.5,
        paddingTop: 8,
        paddingBottom: 20,
        height: 72,
      },
      tabBarLabel: ({ focused }) => (
        <Text style={{
          fontFamily: Typography.display,
          fontSize: 9, letterSpacing: 0.4,
          color: focused ? Colors.blue : Colors.dim,
          marginTop: -4,
        }}>
          {route.name}
        </Text>
      ),
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Cameras" component={CameraListScreen} />
    <Tab.Screen name="Alerts" component={AlertsScreen} />
    <Tab.Screen name="Devices" component={DevicesScreen} />
    <Tab.Screen name="Users" component={UsersScreen} />
  </Tab.Navigator>
);

// ── Camera List (all cams grid) ────────────────────────────────────────────

const CameraListScreen = () => {
  // Reuses the same grid structure from HomeScreen but shows all cameras
  // For brevity, redirects — in production build this as its own full-grid screen
  return <HomeScreen />;
};

// ── Root Stack ─────────────────────────────────────────────────────────────

export const Navigation = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="CameraDetail" component={CameraDetailScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);


// ─────────────────────────────────────────────────────────────────────────────
//  App.tsx — Root component with overlay management
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from './src/store';
import { Navigation } from './src/navigation';
import { IncomingAlertOverlay } from './src/components/IncomingAlertOverlay';
import {
  setupCallKeep,
  setupPushNotifications,
  setupFirebaseMessaging,
  showCallNotification,
} from './src/services/alertService';
import { AlertService } from './src/services/supabase';
import { Colors } from './src/theme';

const App = () => {
  const { incomingAlert, setIncomingAlert, addAlert, currentUser, notificationSettings } = useStore();

  useEffect(() => {
    // ── Boot sequence ──────────────────────────────────────────────────────
    const boot = async () => {
      // 1. Set up CallKeep (native phone-call-style ring)
      await setupCallKeep();

      // 2. Set up local push notifications
      setupPushNotifications();

      // 3. Set up Firebase for remote push
      await setupFirebaseMessaging(handleIncomingAlert);

      // 4. Subscribe to Supabase realtime alerts
      if (currentUser) {
        const channel = AlertService.subscribeToNew('YOUR_ACCOUNT_ID', handleIncomingAlert);
        return () => { channel.unsubscribe(); };
      }
    };

    boot();
  }, []);

  const handleIncomingAlert = (alert: any) => {
    // Add to store
    addAlert(alert);

    // Trigger call-style overlay (with ring + vibration)
    if (notificationSettings.callStyleAlerts) {
      setIncomingAlert(alert);
      showCallNotification(alert);
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <Navigation />

      {/* Global incoming alert overlay — renders on top of everything */}
      {incomingAlert && (
        <IncomingAlertOverlay
          alert={incomingAlert}
          onAccept={() => {
            setIncomingAlert(null);
            // Navigation to camera is handled inside the overlay's onAccept
          }}
          onDecline={() => setIncomingAlert(null)}
        />
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});

export default App;
