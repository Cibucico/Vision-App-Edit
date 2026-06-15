# SibrixVision — React Native App

Professional CCTV monitoring app for Sibrix Group Pty (Ltd).  
Works with Dahua, Hikvision, Reolink, Axis, and any RTSP/ONVIF camera.

---

## Project Structure

```
sibrixvision-app/
├── App.tsx                          # Root — boots services, mounts overlay
├── package.json
├── src/
│   ├── theme/index.ts               # Colors, typography, spacing
│   ├── store/index.ts               # Zustand global state + seed data
│   ├── services/
│   │   ├── supabase.ts              # DB client + SQL schema + all API calls
│   │   ├── alertService.ts          # CallKeep + Firebase + ring logic
│   │   └── cameraService.ts         # RTSP/ONVIF connection + VLC config
│   ├── navigation/index.tsx         # Stack + Tab navigation
│   ├── components/
│   │   ├── index.tsx                # Badge, Card, StatCard, Toggle, DeviceRow etc.
│   │   └── IncomingAlertOverlay.tsx # The phone-call-style alert screen
│   └── screens/
│       ├── HomeScreen.tsx           # Dashboard
│       ├── CameraDetailScreen.tsx   # Full-screen live view + timeline
│       └── AlertsDevicesUsersScreens.tsx  # Alerts, Devices, Users
```

---

## Setup

### 1. Prerequisites
- Node.js 18+
- React Native CLI: `npm install -g react-native-cli`
- Android Studio (for Android) or Xcode 14+ (for iOS)
- Java 17 (for Android)

### 2. Install dependencies
```bash
npm install
cd ios && pod install && cd ..   # iOS only
```

### 3. Configure your services

**Supabase** (`src/services/supabase.ts`):
```ts
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```
- Create a project at supabase.com
- Run the SQL schema from the bottom of `supabase.ts` in the SQL editor
- Enable Realtime on `alerts`, `cameras`, `sensors` tables

**Firebase** (`google-services.json` / `GoogleService-Info.plist`):
- Create a Firebase project at console.firebase.google.com
- Add Android/iOS app and download the config files
- Place `google-services.json` in `android/app/`
- Place `GoogleService-Info.plist` in `ios/SibrixVision/`

### 4. Run the app
```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

---

## Key Features

### 📞 Call-style Alerts
When a camera detects motion, the phone rings **exactly like an incoming call**:
- Uses `react-native-callkeep` to trigger the native call screen
- Uses `react-native-incall-manager` to play a ringtone through the speaker
- Vibrates in a ring pattern
- Shows a live camera preview on the alert screen
- Accept = goes straight to live camera view
- Decline = dismisses the alert

### 📷 Universal Camera Support
Supports **any camera brand** via RTSP/ONVIF:
- Dahua, Hikvision, Reolink, Axis, Bosch, and more
- Auto-generates RTSP URLs per brand (see `cameraService.ts`)
- Uses `react-native-vlc-media-player` for hardware-decoded live playback

### 👥 Multi-User Accounts
- Owner, Family, Staff, Installer roles
- Per-camera permissions per user
- Biometric enrolment tracking (ZKTeco integration via your backend)

### 🔔 Real-Time Alerts
- Supabase Realtime subscription — zero latency
- Firebase FCM for background/killed app notifications
- WhatsApp snapshot alerts (via backend webhook to WhatsApp Business API)

---

## Backend Requirements

SibrixVision needs a small backend server (Node.js/Express or Supabase Edge Functions) to:

1. **RTSP → HLS transcoding** — VLC or FFmpeg proxy so the web dashboard can stream cameras
2. **Motion detection worker** — reads from DVR webhook/API, inserts alert rows into Supabase
3. **WhatsApp snapshot sender** — uses WhatsApp Business API to send camera snapshots
4. **Camera connection tester** — tests RTSP URLs on behalf of the app

Suggested stack: **Supabase + Edge Functions + Fly.io** for the RTSP proxy.

---

## Adding a New Camera

In the app: Devices → + Add → enter camera name, select brand, enter IP/RTSP URL, username, password → Connect.

The `CameraConnectionService.buildRtspUrl()` function auto-generates the correct RTSP URL format for the selected brand. The connection test pings your backend proxy to verify the stream is reachable.

---

## Fonts

Add these to your React Native project:
- **Syne** (display/headings): https://fonts.google.com/specimen/Syne
- **DM Sans** (body text): https://fonts.google.com/specimen/DM+Sans

Place `.ttf` files in `android/app/src/main/assets/fonts/` and `ios/SibrixVision/` then run:
```bash
npx react-native-asset
```

---

## Web Prototype Summary

The repository root now includes a standalone web preview for the SibrixVision UI:
- `index.html` — AI diagnostics interface with live camera tiles and offline node analysis
- `style.css` — white/light-blue theme with red warning and green normal state accents
- `script.js` — interactive offline diagnostic overlay, AI chat simulation, and camera detail controls

This preview is ideal for quick design validation and demoing the new visual workflow without launching the full React Native app.

> To view it instantly, open `index.html` in a browser.

---

## Supabase Database Schema

The full SQL to create all tables, enable RLS, and set up realtime is at the bottom of  
`src/services/supabase.ts` in a comment block. Copy it into the Supabase SQL editor and run it.

---

## Contact

**Sibrix Group Pty (Ltd)**  
📧 info@sibrixgroup.co.za  
🌐 www.sibrixgroup.co.za  
📱 SibrixVision — Protecting South African Homes & Businesses
