import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, Sensor, AlertItem, AppUser } from '../store';

// ─── Config ────────────────────────────────────────────────────────────────────
// Replace these with your actual Supabase project values from supabase.com
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const AuthService = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};

// ─── Cameras ──────────────────────────────────────────────────────────────────

export const CameraService = {
  fetchAll: async (accountId: string): Promise<Camera[]> => {
    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  create: async (camera: Omit<Camera, 'id'> & { account_id: string }) => {
    const { data, error } = await supabase
      .from('cameras')
      .insert(camera)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, patch: Partial<Camera>) => {
    const { error } = await supabase
      .from('cameras')
      .update(patch)
      .eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('cameras')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Subscribe to realtime status changes
  subscribeToStatus: (accountId: string, onUpdate: (camera: Camera) => void) => {
    return supabase
      .channel('camera-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'cameras',
        filter: `account_id=eq.${accountId}`,
      }, payload => onUpdate(payload.new as Camera))
      .subscribe();
  },
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const AlertService = {
  fetchRecent: async (accountId: string, limit = 50): Promise<AlertItem[]> => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('account_id', accountId)
      .eq('dismissed', false)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(d => ({ ...d, timestamp: new Date(d.timestamp) }));
  },

  dismiss: async (id: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ dismissed: true })
      .eq('id', id);
    if (error) throw error;
  },

  markRead: async (id: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  },

  // Realtime subscription — fires when a new alert is inserted (e.g. from your backend motion worker)
  subscribeToNew: (accountId: string, onAlert: (alert: AlertItem) => void) => {
    return supabase
      .channel('new-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
        filter: `account_id=eq.${accountId}`,
      }, payload => {
        const alert = { ...payload.new, timestamp: new Date(payload.new.timestamp) } as AlertItem;
        onAlert(alert);
      })
      .subscribe();
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const UserService = {
  fetchAll: async (accountId: string): Promise<AppUser[]> => {
    const { data, error } = await supabase
      .from('account_users')
      .select('*, users(name, email, phone)')
      .eq('account_id', accountId);
    if (error) throw error;
    return data || [];
  },

  invite: async (email: string, role: string, accountId: string) => {
    // This calls a Supabase Edge Function that sends the invite email
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, role, account_id: accountId },
    });
    if (error) throw error;
    return data;
  },

  updatePermissions: async (userId: string, permissions: object) => {
    const { error } = await supabase
      .from('account_users')
      .update({ permissions })
      .eq('user_id', userId);
    if (error) throw error;
  },

  remove: async (userId: string, accountId: string) => {
    const { error } = await supabase
      .from('account_users')
      .delete()
      .eq('user_id', userId)
      .eq('account_id', accountId);
    if (error) throw error;
  },
};

// ─── Sensors ──────────────────────────────────────────────────────────────────

export const SensorService = {
  fetchAll: async (accountId: string): Promise<Sensor[]> => {
    const { data, error } = await supabase
      .from('sensors')
      .select('*')
      .eq('account_id', accountId);
    if (error) throw error;
    return data || [];
  },

  subscribeToStatus: (accountId: string, onUpdate: (sensor: Sensor) => void) => {
    return supabase
      .channel('sensor-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sensors',
        filter: `account_id=eq.${accountId}`,
      }, payload => onUpdate(payload.new as Sensor))
      .subscribe();
  },
};

// ─── Supabase DB Schema (run in SQL editor) ────────────────────────────────────
/*
-- Accounts (a single Sibrix installation/property)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cameras
CREATE TABLE cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT,
  brand TEXT,
  type TEXT CHECK (type IN ('indoor','outdoor')),
  status TEXT DEFAULT 'online',
  rtsp_url TEXT,
  resolution TEXT,
  has_night_vision BOOLEAN DEFAULT false,
  has_ai BOOLEAN DEFAULT false,
  ip_rating TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensors
CREATE TABLE sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('door','pir','smoke','temperature','glass_break')),
  zone INTEGER,
  status TEXT DEFAULT 'normal',
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Biometric devices
CREATE TABLE biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  types TEXT[],
  enrolled_count INTEGER DEFAULT 0,
  brand TEXT,
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  camera_id UUID REFERENCES cameras(id),
  camera_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT CHECK (level IN ('critical','warning','info','log')),
  read BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false
);

-- Account users (join table with permissions)
CREATE TABLE account_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner','family','staff','installer')),
  permissions JSONB DEFAULT '{}',
  biometric_enrolled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: users can only see their own account's data
CREATE POLICY "Account members only" ON cameras
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Enable realtime on alerts and cameras
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE cameras;
ALTER PUBLICATION supabase_realtime ADD TABLE sensors;
*/
