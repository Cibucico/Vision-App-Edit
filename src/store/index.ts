import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CameraStatus = 'online' | 'offline' | 'motion';
export type SensorStatus = 'normal' | 'open' | 'triggered' | 'active';
export type BiometricType = 'fingerprint' | 'face' | 'card';
export type UserRole = 'owner' | 'family' | 'staff' | 'installer';
export type AlertLevel = 'critical' | 'warning' | 'info' | 'log';

export interface Camera {
  id: string;
  name: string;
  model: string;
  brand: 'dahua' | 'hikvision' | 'reolink' | 'axis' | 'onvif' | 'rtsp';
  type: 'indoor' | 'outdoor';
  status: CameraStatus;
  rtspUrl: string;
  resolution: string;
  hasNightVision: boolean;
  hasAI: boolean;
  ipRating?: string;
  location: string;
}

export interface Sensor {
  id: string;
  name: string;
  type: 'door' | 'pir' | 'smoke' | 'temperature' | 'glass_break';
  zone: number;
  status: SensorStatus;
  lastTriggered?: Date;
}

export interface BiometricDevice {
  id: string;
  name: string;
  location: string;
  type: BiometricType[];
  enrolledCount: number;
  brand: string;
  status: 'online' | 'offline';
}

export interface DVR {
  id: string;
  name: string;
  channels: number;
  hddUsedPercent: number;
  hddSizeGB: number;
  model: string;
  status: 'online' | 'offline';
}

export interface AlertItem {
  id: string;
  type: 'motion_person' | 'motion_vehicle' | 'door_open' | 'biometric' | 'armed' | 'lpr' | 'smoke' | 'offline';
  title: string;
  description: string;
  cameraId?: string;
  cameraName?: string;
  timestamp: Date;
  level: AlertLevel;
  read: boolean;
  dismissed: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  email: string;
  phone?: string;
  permissions: {
    cameras: string[];   // camera IDs they can see — '*' means all
    canPlayback: boolean;
    canExport: boolean;
    canManageUsers: boolean;
    canArmDisarm: boolean;
    receiveAlerts: boolean;
  };
  biometricEnrolled: boolean;
  isOnline: boolean;
  avatarColor: string;
}

export interface NotificationSettings {
  callStyleAlerts: boolean;
  aiPersonOnly: boolean;
  silentHoursEnabled: boolean;
  silentStart: string;
  silentEnd: string;
  whatsappAlerts: boolean;
  lprAlerts: boolean;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface SibrixStore {
  // System state
  isArmed: boolean;
  toggleArmed: () => void;

  // Cameras
  cameras: Camera[];
  setCameras: (cameras: Camera[]) => void;
  updateCamera: (id: string, patch: Partial<Camera>) => void;

  // Sensors
  sensors: Sensor[];
  setSensors: (sensors: Sensor[]) => void;

  // Biometrics
  biometrics: BiometricDevice[];

  // DVR
  dvr: DVR | null;

  // Alerts
  alerts: AlertItem[];
  addAlert: (alert: AlertItem) => void;
  dismissAlert: (id: string) => void;
  markAlertRead: (id: string) => void;
  unreadCount: number;

  // Users
  users: AppUser[];
  currentUser: AppUser | null;

  // Notifications
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;

  // Incoming alert call
  incomingAlert: AlertItem | null;
  setIncomingAlert: (alert: AlertItem | null) => void;
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────

const seedCameras: Camera[] = [
  { id: 'cam1', name: 'Front Door', model: 'Dahua 5MP Full-Colour', brand: 'dahua', type: 'outdoor', status: 'online', rtspUrl: 'rtsp://admin:password@192.168.1.101:554/stream', resolution: '5MP · 2560×1920', hasNightVision: true, hasAI: true, ipRating: 'IP67', location: 'Main entrance' },
  { id: 'cam2', name: 'Driveway', model: 'Dahua 2MP Bullet', brand: 'dahua', type: 'outdoor', status: 'motion', rtspUrl: 'rtsp://admin:password@192.168.1.102:554/stream', resolution: '2MP · 1920×1080', hasNightVision: true, hasAI: true, ipRating: 'IP67', location: 'Driveway approach' },
  { id: 'cam3', name: 'Shop Floor', model: 'ONVIF Generic', brand: 'onvif', type: 'indoor', status: 'online', rtspUrl: 'rtsp://192.168.1.103:554/live', resolution: '2MP · 1920×1080', hasNightVision: false, hasAI: false, location: 'Retail floor' },
  { id: 'cam4', name: 'Back Office', model: 'Hikvision DS-2CD2143G2-I', brand: 'hikvision', type: 'indoor', status: 'offline', rtspUrl: 'rtsp://admin:password@192.168.1.104:554/Streaming/Channels/1', resolution: '4MP · 2688×1520', hasNightVision: true, hasAI: false, location: 'Back office' },
  { id: 'cam5', name: 'Stockroom', model: 'Hikvision DS-2CD2143G2-I', brand: 'hikvision', type: 'indoor', status: 'online', rtspUrl: 'rtsp://admin:password@192.168.1.105:554/Streaming/Channels/1', resolution: '4MP', hasNightVision: true, hasAI: false, location: 'Storage area' },
  { id: 'cam6', name: 'Parking Lot', model: 'Dahua 2MP Bullet', brand: 'dahua', type: 'outdoor', status: 'online', rtspUrl: 'rtsp://admin:password@192.168.1.106:554/stream', resolution: '2MP', hasNightVision: true, hasAI: true, ipRating: 'IP67', location: 'External parking' },
  { id: 'cam7', name: 'Staff Entrance', model: 'Reolink RLC-810A', brand: 'reolink', type: 'outdoor', status: 'online', rtspUrl: 'rtsp://admin:password@192.168.1.107:554/h264Preview_01_main', resolution: '8MP · 4K', hasNightVision: true, hasAI: true, ipRating: 'IP66', location: 'Staff entry' },
  { id: 'cam8', name: 'Cash Counter', model: 'Axis M3106-L', brand: 'axis', type: 'indoor', status: 'online', rtspUrl: 'rtsp://root:pass@192.168.1.108/axis-media/media.amp', resolution: '4MP', hasNightVision: false, hasAI: false, location: 'POS area' },
];

const seedSensors: Sensor[] = [
  { id: 'sen1', name: 'Back Entrance', type: 'door', zone: 2, status: 'normal' },
  { id: 'sen2', name: 'Shop Floor PIR', type: 'pir', zone: 1, status: 'active', lastTriggered: new Date(Date.now() - 840000) },
  { id: 'sen3', name: 'Kitchen Smoke', type: 'smoke', zone: 3, status: 'normal' },
  { id: 'sen4', name: 'Server Room Temp', type: 'temperature', zone: 4, status: 'normal' },
];

const seedBiometrics: BiometricDevice[] = [
  { id: 'bio1', name: 'Staff Entrance', location: 'Staff entry door', type: ['fingerprint'], enrolledCount: 12, brand: 'ZKTeco', status: 'online' },
  { id: 'bio2', name: 'Server Room', location: 'Server room door', type: ['face', 'card'], enrolledCount: 3, brand: 'ZKTeco', status: 'online' },
];

const seedUsers: AppUser[] = [
  { id: 'u1', name: 'Sifiso Dlamini', initials: 'SD', role: 'owner', email: 'sifiso@sibrixgroup.co.za', phone: '+27821234567', permissions: { cameras: ['*'], canPlayback: true, canExport: true, canManageUsers: true, canArmDisarm: true, receiveAlerts: true }, biometricEnrolled: true, isOnline: true, avatarColor: 'rgba(59,110,248,0.2)' },
  { id: 'u2', name: 'Nomsa Mthembu', initials: 'NM', role: 'family', email: 'nomsa@gmail.com', permissions: { cameras: ['cam1','cam2','cam3'], canPlayback: false, canExport: false, canManageUsers: false, canArmDisarm: false, receiveAlerts: true }, biometricEnrolled: false, isOnline: false, avatarColor: 'rgba(16,230,138,0.15)' },
  { id: 'u3', name: 'Thabo Molefe', initials: 'TM', role: 'staff', email: 'thabo@store.co.za', permissions: { cameras: ['cam3','cam5','cam8'], canPlayback: false, canExport: false, canManageUsers: false, canArmDisarm: false, receiveAlerts: true }, biometricEnrolled: true, isOnline: false, avatarColor: 'rgba(155,127,255,0.15)' },
  { id: 'u4', name: 'Precious Khumalo', initials: 'PK', role: 'staff', email: 'precious@store.co.za', permissions: { cameras: [], canPlayback: false, canExport: false, canManageUsers: false, canArmDisarm: false, receiveAlerts: true }, biometricEnrolled: true, isOnline: false, avatarColor: 'rgba(155,127,255,0.15)' },
  { id: 'u5', name: 'Sibrix Group', initials: 'SG', role: 'installer', email: 'support@sibrixgroup.co.za', phone: '+27211234567', permissions: { cameras: ['*'], canPlayback: false, canExport: false, canManageUsers: false, canArmDisarm: false, receiveAlerts: false }, biometricEnrolled: false, isOnline: false, avatarColor: 'rgba(255,170,0,0.15)' },
];

const seedAlerts: AlertItem[] = [
  { id: 'a1', type: 'motion_person', title: 'Person detected', description: 'Front Door · AI WizSense · high confidence', cameraId: 'cam1', cameraName: 'Front Door', timestamp: new Date(Date.now() - 120000), level: 'critical', read: false, dismissed: false },
  { id: 'a2', type: 'door_open', title: 'Door sensor opened', description: 'Back entrance · Zone 2 · stayed open 4.2s', timestamp: new Date(Date.now() - 840000), level: 'warning', read: false, dismissed: false },
  { id: 'a3', type: 'biometric', title: 'Biometric access granted', description: 'Thabo M. · Staff entrance · fingerprint match', timestamp: new Date(Date.now() - 1920000), level: 'info', read: true, dismissed: false },
  { id: 'a4', type: 'lpr', title: 'Vehicle in driveway', description: 'LPR detected · CA 123-456 · unknown plate', cameraId: 'cam2', cameraName: 'Driveway', timestamp: new Date(Date.now() - 3600000), level: 'warning', read: true, dismissed: false },
  { id: 'a5', type: 'armed', title: 'System armed', description: 'By Sifiso D. · Owner · all zones active', timestamp: new Date(Date.now() - 86400000 + 25200000), level: 'log', read: true, dismissed: false },
];

// ─── Store Implementation ──────────────────────────────────────────────────────

export const useStore = create<SibrixStore>((set, get) => ({
  isArmed: true,
  toggleArmed: () => set(s => ({ isArmed: !s.isArmed })),

  cameras: seedCameras,
  setCameras: cameras => set({ cameras }),
  updateCamera: (id, patch) => set(s => ({
    cameras: s.cameras.map(c => c.id === id ? { ...c, ...patch } : c),
  })),

  sensors: seedSensors,
  setSensors: sensors => set({ sensors }),

  biometrics: seedBiometrics,
  dvr: { id: 'dvr1', name: 'Main DVR — 16ch', channels: 16, hddUsedPercent: 68, hddSizeGB: 2000, model: 'Dahua XVR5116HS-4KL-I3', status: 'online' },

  alerts: seedAlerts,
  addAlert: alert => set(s => ({ alerts: [alert, ...s.alerts], unreadCount: s.unreadCount + 1 })),
  dismissAlert: id => set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a) })),
  markAlertRead: id => set(s => ({
    alerts: s.alerts.map(a => a.id === id ? { ...a, read: true } : a),
    unreadCount: Math.max(0, s.unreadCount - 1),
  })),
  unreadCount: seedAlerts.filter(a => !a.read).length,

  users: seedUsers,
  currentUser: seedUsers[0],

  notificationSettings: {
    callStyleAlerts: true,
    aiPersonOnly: true,
    silentHoursEnabled: false,
    silentStart: '22:00',
    silentEnd: '06:00',
    whatsappAlerts: true,
    lprAlerts: true,
  },
  updateNotificationSettings: patch => set(s => ({
    notificationSettings: { ...s.notificationSettings, ...patch },
  })),

  incomingAlert: null,
  setIncomingAlert: alert => set({ incomingAlert: alert }),
}));
