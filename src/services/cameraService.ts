import axios from 'axios';

// ─── ONVIF Discovery & Connection ─────────────────────────────────────────────
// SibrixVision supports ANY camera with RTSP or ONVIF protocol.
// This service handles auto-discovery and stream URL generation per brand.

export interface CameraConnectionTest {
  success: boolean;
  resolution?: string;
  brand?: string;
  error?: string;
}

// Known RTSP URL patterns per brand
const RTSP_PATTERNS: Record<string, (ip: string, user: string, pass: string) => string[]> = {
  dahua: (ip, u, p) => [
    `rtsp://${u}:${p}@${ip}:554/cam/realmonitor?channel=1&subtype=0`,
    `rtsp://${u}:${p}@${ip}:554/stream`,
  ],
  hikvision: (ip, u, p) => [
    `rtsp://${u}:${p}@${ip}:554/Streaming/Channels/101`,
    `rtsp://${u}:${p}@${ip}:554/Streaming/Channels/1`,
  ],
  reolink: (ip, u, p) => [
    `rtsp://${u}:${p}@${ip}:554/h264Preview_01_main`,
    `rtsp://${u}:${p}@${ip}:554/h265Preview_01_main`,
  ],
  axis: (ip, u, p) => [
    `rtsp://${u}:${p}@${ip}/axis-media/media.amp`,
    `rtsp://${u}:${p}@${ip}:554/axis-media/media.amp?videocodec=h264`,
  ],
  onvif: (ip, u, p) => [
    `rtsp://${u}:${p}@${ip}:554/stream`,
    `rtsp://${u}:${p}@${ip}:8554/stream`,
  ],
};

export const CameraConnectionService = {
  // Build RTSP URL from brand + credentials
  buildRtspUrl: (
    brand: string,
    ip: string,
    username: string,
    password: string,
    customUrl?: string,
  ): string => {
    if (customUrl) return customUrl;
    const patterns = RTSP_PATTERNS[brand.toLowerCase()] || RTSP_PATTERNS.onvif;
    return patterns(ip, username, password)[0];
  },

  // Test if a camera is reachable (calls your backend proxy)
  testConnection: async (rtspUrl: string): Promise<CameraConnectionTest> => {
    try {
      // Your backend at api.sibrixgroup.co.za will proxy the RTSP test
      const res = await axios.post('https://api.sibrixgroup.co.za/camera/test', {
        rtsp_url: rtspUrl,
      }, { timeout: 8000 });
      return { success: true, resolution: res.data.resolution, brand: res.data.brand };
    } catch (err: any) {
      return {
        success: false,
        error: err?.response?.data?.message || 'Could not connect. Check IP and credentials.',
      };
    }
  },

  // Auto-discover cameras on the local network via ONVIF WS-Discovery
  discoverOnNetwork: async (): Promise<Array<{ ip: string; brand: string; name: string }>> => {
    try {
      const res = await axios.get('https://api.sibrixgroup.co.za/camera/discover', { timeout: 15000 });
      return res.data.cameras || [];
    } catch {
      return [];
    }
  },

  // Get snapshot frame for thumbnail (via your backend HLS proxy)
  getSnapshotUrl: (cameraId: string): string => {
    return `https://api.sibrixgroup.co.za/camera/${cameraId}/snapshot?t=${Date.now()}`;
  },

  // Get HLS stream URL (your backend transcodes RTSP → HLS for web playback)
  getHlsUrl: (cameraId: string): string => {
    return `https://api.sibrixgroup.co.za/camera/${cameraId}/stream.m3u8`;
  },
};

// ─── RTSP Player Config for react-native-vlc-media-player ────────────────────

export const VLCOptions = {
  // Hardware decoding — works on most Android devices
  android: [
    '--network-caching=300',
    '--rtsp-tcp',
    '--avcodec-hw=any',
    '--drop-late-frames',
    '--skip-frames',
  ],
  // iOS uses VLCKit hardware decoder by default
  ios: [
    '--network-caching=300',
    '--rtsp-tcp',
  ],
};
