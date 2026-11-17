/* SibrixVision — interactive web demo.
   All camera feeds, alerts and diagnostics are simulated in the browser. */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const DEMO_EMAIL = 'sibrix@gmail.co.za';
const DEMO_PASS = 'Password';
const MIN = 60000;

/* ───────────── Seed data (mirrors src/store/index.ts) ───────────── */
function seed() {
  return {
    armed: true,
    cameras: [
      { id: 'cam1', name: 'Front Door', model: 'Dahua 5MP Full-Colour', brand: 'dahua', type: 'outdoor', status: 'online', res: '5MP · 2560×1920', night: true, ai: true, ip: '192.168.1.101', scene: 'door', person: true },
      { id: 'cam2', name: 'Driveway', model: 'Dahua 2MP Bullet', brand: 'dahua', type: 'outdoor', status: 'motion', res: '2MP · 1920×1080', night: true, ai: true, ip: '192.168.1.102', scene: 'drive', car: true },
      { id: 'cam3', name: 'Shop Floor', model: 'ONVIF Generic', brand: 'onvif', type: 'indoor', status: 'online', res: '2MP · 1920×1080', night: false, ai: false, ip: '192.168.1.103', scene: 'shop', person: true },
      { id: 'cam4', name: 'Back Office', model: 'Hikvision DS-2CD2143G2-I', brand: 'hikvision', type: 'indoor', status: 'offline', res: '4MP · 2688×1520', night: true, ai: false, ip: '192.168.1.104', scene: 'office' },
      { id: 'cam5', name: 'Stockroom', model: 'Hikvision DS-2CD2143G2-I', brand: 'hikvision', type: 'indoor', status: 'online', res: '4MP', night: true, ai: false, ip: '192.168.1.105', scene: 'store' },
      { id: 'cam6', name: 'Parking Lot', model: 'Dahua 2MP Bullet', brand: 'dahua', type: 'outdoor', status: 'online', res: '2MP', night: true, ai: true, ip: '192.168.1.106', scene: 'parking' },
      { id: 'cam7', name: 'Staff Entrance', model: 'Reolink RLC-810A', brand: 'reolink', type: 'outdoor', status: 'online', res: '8MP · 4K', night: true, ai: true, ip: '192.168.1.107', scene: 'entrance' },
      { id: 'cam8', name: 'Cash Counter', model: 'Axis M3106-L', brand: 'axis', type: 'indoor', status: 'online', res: '4MP', night: false, ai: false, ip: '192.168.1.108', scene: 'counter', person: true },
    ],
    sensors: [
      { id: 'sen1', name: 'Back Entrance', type: 'door', zone: 2, status: 'normal' },
      { id: 'sen2', name: 'Shop Floor PIR', type: 'pir', zone: 1, status: 'active' },
      { id: 'sen3', name: 'Kitchen Smoke', type: 'smoke', zone: 3, status: 'normal' },
      { id: 'sen4', name: 'Server Room Temp', type: 'temperature', zone: 4, status: 'normal', value: '22.4°C' },
    ],
    biometrics: [
      { id: 'bio1', name: 'Staff Entrance', type: 'Fingerprint', enrolled: 12, brand: 'ZKTeco', status: 'online' },
      { id: 'bio2', name: 'Server Room', type: 'Face + card', enrolled: 3, brand: 'ZKTeco', status: 'online' },
    ],
    dvr: { name: 'Main DVR — 16ch', model: 'Dahua XVR5116HS-4KL-I3', used: 68, size: 2000 },
    alerts: [
      { id: 'a0', type: 'offline', title: 'Camera offline', desc: 'Back Office · no heartbeat for 5 min', cam: 'cam4', t: Date.now() - 5 * MIN, level: 'warning', read: false },
      { id: 'a1', type: 'person', title: 'Person detected', desc: 'Front Door · AI WizSense · high confidence', cam: 'cam1', t: Date.now() - 2 * MIN, level: 'critical', read: false },
      { id: 'a2', type: 'door', title: 'Door sensor opened', desc: 'Back entrance · Zone 2 · open 4.2s', t: Date.now() - 14 * MIN, level: 'warning', read: false },
      { id: 'a3', type: 'bio', title: 'Biometric access granted', desc: 'Thabo M. · Staff entrance · fingerprint', t: Date.now() - 32 * MIN, level: 'info', read: true },
      { id: 'a4', type: 'lpr', title: 'Vehicle in driveway', desc: 'LPR · CA 123-456 · unknown plate', cam: 'cam2', t: Date.now() - 60 * MIN, level: 'warning', read: true },
      { id: 'a5', type: 'armed', title: 'System armed', desc: 'By Sifiso D. · Owner · all zones', t: Date.now() - 17 * 60 * MIN, level: 'log', read: true },
    ],
    users: [
      { id: 'u1', name: 'Sifiso Dlamini', initials: 'SD', role: 'owner', email: 'sifiso@sibrixgroup.co.za', cams: '*', perms: { playback: true, export: true, arm: true, alerts: true }, online: true, color: '#E3EBFE', fg: '#2F63F0' },
      { id: 'u2', name: 'Nomsa Mthembu', initials: 'NM', role: 'family', email: 'nomsa@gmail.com', cams: 3, perms: { playback: false, export: false, arm: false, alerts: true }, online: false, color: '#DDF6EA', fg: '#0E9F62' },
      { id: 'u3', name: 'Thabo Molefe', initials: 'TM', role: 'staff', email: 'thabo@store.co.za', cams: 3, perms: { playback: false, export: false, arm: false, alerts: true }, online: true, color: '#EDE8FF', fg: '#6B4DE6' },
      { id: 'u4', name: 'Precious Khumalo', initials: 'PK', role: 'staff', email: 'precious@store.co.za', cams: 0, perms: { playback: false, export: false, arm: false, alerts: true }, online: false, color: '#EDE8FF', fg: '#6B4DE6' },
      { id: 'u5', name: 'Sibrix Group', initials: 'SG', role: 'installer', email: 'support@sibrixgroup.co.za', cams: '*', perms: { playback: false, export: false, arm: false, alerts: false }, online: false, color: '#FFF1D6', fg: '#C27800' },
    ],
    notif: { call: true, personOnly: true, silent: false, whatsapp: true, lpr: true },
  };
}
let S = seed();

/* ───────────── Helpers ───────────── */
function ago(t) {
  const m = Math.round((Date.now() - t) / MIN);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}
let toastTimer;
function toast(msg, ms = 2600) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
function openOverlay(id) { const el = $('#' + id); el.classList.add('show'); el.setAttribute('aria-hidden', 'false'); }
function closeOverlay(id) {
  const el = $('#' + id); el.classList.remove('show'); el.setAttribute('aria-hidden', 'true');
  if (id === 'camView') stopCamView();
  if (id === 'callView') stopRing();
}
const cam = id => S.cameras.find(c => c.id === id);
const ALERT_ICON = { person: '🚶', door: '🚪', bio: '☝', lpr: '🚗', armed: '🛡', offline: '🔌', disarmed: '🔓', added: '📷', fixed: '✅' };

/* ───────────── Simulated CCTV feed renderer ───────────── */
const NOISE = [0, 1, 2].map(() => {
  const c = document.createElement('canvas'); c.width = 160; c.height = 100;
  const x = c.getContext('2d'), d = x.createImageData(160, 100);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); return c;
});
const feeds = new Set();
function attachFeed(canvas, c, opts = {}) { const f = { canvas, cam: c, pan: { x: 0, y: 0 }, ...opts }; feeds.add(f); return f; }

function rect(x, c, a, b, w, h) { x.fillStyle = c; x.fillRect(a, b, w, h); }
function person(x, px, py, s, color = '#2b2f38') {
  x.fillStyle = color;
  x.beginPath(); x.arc(px, py - 62 * s, 10 * s, 0, 7); x.fill();
  x.beginPath(); x.roundRect(px - 13 * s, py - 50 * s, 26 * s, 34 * s, 8 * s); x.fill();
  const step = Math.sin(performance.now() / 160) * 5 * s;
  x.fillRect(px - 9 * s + step, py - 18 * s, 7 * s, 18 * s);
  x.fillRect(px + 2 * s - step, py - 18 * s, 7 * s, 18 * s);
}
function car(x, cx, cy, s, body = '#5b6475') {
  x.fillStyle = body; x.beginPath(); x.roundRect(cx - 60 * s, cy - 30 * s, 120 * s, 34 * s, 8 * s); x.fill();
  x.beginPath(); x.roundRect(cx - 38 * s, cy - 52 * s, 76 * s, 26 * s, 10 * s); x.fill();
  x.fillStyle = '#9fb4c9'; x.fillRect(cx - 32 * s, cy - 47 * s, 64 * s, 16 * s);
  x.fillStyle = '#ffe9a8'; x.fillRect(cx - 54 * s, cy - 20 * s, 14 * s, 7 * s); x.fillRect(cx + 40 * s, cy - 20 * s, 14 * s, 7 * s);
  x.fillStyle = '#15171c'; x.fillRect(cx - 50 * s, cy + 2 * s, 20 * s, 10 * s); x.fillRect(cx + 30 * s, cy + 2 * s, 20 * s, 10 * s);
}
function aiBox(x, bx, by, bw, bh, label) {
  x.strokeStyle = '#FF3B47'; x.lineWidth = 2.5; x.strokeRect(bx, by, bw, bh);
  x.font = '600 13px "JetBrains Mono", monospace';
  const w = x.measureText(label).width + 10;
  rect(x, '#FF3B47', bx, by - 18, w, 18);
  x.fillStyle = '#fff'; x.fillText(label, bx + 5, by - 5);
}

const SCENES = {
  door(x, t, c) {
    rect(x, '#7a756c', 0, 0, 640, 400); rect(x, '#8b857b', 0, 0, 640, 30);
    x.fillStyle = '#5a564f'; x.beginPath(); x.moveTo(0, 400); x.lineTo(150, 300); x.lineTo(490, 300); x.lineTo(640, 400); x.fill();
    rect(x, '#3d2b20', 265, 100, 110, 200); rect(x, '#2c1f17', 275, 112, 90, 80); rect(x, '#2c1f17', 275, 200, 90, 90);
    rect(x, '#d4b35c', 352, 200, 8, 8);
    rect(x, '#a9c3d6', 110, 120, 100, 80); rect(x, '#a9c3d6', 430, 120, 100, 80);
    x.strokeStyle = '#666059'; x.lineWidth = 4; x.strokeRect(110, 120, 100, 80); x.strokeRect(430, 120, 100, 80);
    const g = x.createRadialGradient(320, 80, 4, 320, 80, 120); g.addColorStop(0, 'rgba(255,230,160,.55)'); g.addColorStop(1, 'rgba(255,230,160,0)');
    x.fillStyle = g; x.fillRect(180, 0, 280, 220);
    rect(x, '#4e5d3c', 210, 255, 40, 45); x.fillStyle = '#5f7a43'; x.beginPath(); x.arc(230, 245, 26, 0, 7); x.fill();
    if (c.person) {
      const p = (t / 9000) % 1, px = 120 + Math.sin(p * Math.PI * 2) * 160 + 200, py = 345, s = 1.6;
      person(x, px, py, s, '#23262e');
      if (c.ai) aiBox(x, px - 30, py - 128, 60, 132, 'PERSON 97%');
    }
  },
  drive(x, t, c) {
    rect(x, '#3a4a5c', 0, 0, 640, 130); rect(x, '#3b4a34', 0, 130, 640, 270);
    x.fillStyle = '#4c4f55'; x.beginPath(); x.moveTo(270, 130); x.lineTo(370, 130); x.lineTo(620, 400); x.lineTo(20, 400); x.fill();
    x.strokeStyle = '#bfb79a'; x.lineWidth = 3; x.setLineDash([18, 16]); x.beginPath(); x.moveTo(320, 135); x.lineTo(320, 400); x.stroke(); x.setLineDash([]);
    rect(x, '#2a2d33', 240, 96, 160, 36); for (let i = 0; i < 16; i++) rect(x, '#555a63', 244 + i * 10, 96, 3, 36);
    x.fillStyle = '#2d3a28'; [[60, 120], [580, 125], [120, 160]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 40, 0, 7); x.fill(); });
    if (c.car) {
      const p = (t / 7000) % 1, s = 0.5 + p * 1.6, cy = 150 + p * 230;
      car(x, 320 + p * 40, cy, s);
      if (c.ai) aiBox(x, 320 + p * 40 - 64 * s, cy - 58 * s, 128 * s, 74 * s, 'VEHICLE · CA 123-456');
    }
  },
  shop(x, t, c) {
    rect(x, '#c2bcb0', 0, 0, 640, 220); rect(x, '#9a948a', 0, 220, 640, 180);
    const cols = ['#d1584a', '#3f7cc9', '#e3b23c', '#5ca36b', '#8d6cc4'];
    for (let r = 0; r < 3; r++) {
      const y = 60 + r * 62; rect(x, '#6f6a62', 40, y + 46, 560, 6);
      for (let i = 0; i < 28; i++) rect(x, cols[(i + r * 2) % 5], 46 + i * 20, y + 18 + (i % 3) * 4, 14, 28 - (i % 3) * 4);
    }
    if (c.person) { const p = (t / 12000) % 1, px = 60 + (p < .5 ? p * 2 : 2 - p * 2) * 520; person(x, px, 380, 1.5, '#34404f'); }
  },
  office(x) { rect(x, '#555', 0, 0, 640, 400); },
  store(x) {
    rect(x, '#8a8478', 0, 0, 640, 400); rect(x, '#6c675e', 0, 280, 640, 120);
    for (let s = 0; s < 4; s++) for (let r = 0; r < 4 - (s % 2); r++) {
      rect(x, ['#b48a55', '#a37d4c', '#c29a62'][(s + r) % 3], 40 + s * 150, 270 - r * 52, 120, 50);
      rect(x, 'rgba(0,0,0,.15)', 40 + s * 150, 270 - r * 52 + 20, 120, 6);
    }
  },
  parking(x) {
    rect(x, '#3f4146', 0, 0, 640, 400); rect(x, '#2f3a4a', 0, 0, 640, 70);
    x.strokeStyle = '#d8d8d0'; x.lineWidth = 4;
    for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(40 + i * 100, 400); x.lineTo(150 + i * 70, 150); x.stroke(); }
    car(x, 200, 300, 1.2, '#8a2f2f'); car(x, 465, 220, 0.85, '#d9d9d9'); car(x, 300, 180, 0.7, '#2f4f8a');
  },
  entrance(x, t) {
    rect(x, '#8c5a44', 0, 0, 640, 400);
    for (let r = 0; r < 14; r++) for (let i = 0; i < 12; i++) rect(x, '#7a4c39', i * 56 + (r % 2) * 28, r * 22, 52, 2);
    rect(x, '#6c6c6c', 0, 320, 640, 80);
    rect(x, '#2b3540', 240, 90, 160, 230); rect(x, '#9fb8cc', 252, 104, 64, 200); rect(x, '#9fb8cc', 324, 104, 64, 200);
    rect(x, '#20262e', 430, 170, 34, 50); rect(x, (Math.floor(t / 600) % 2 ? '#2BE38E' : '#1c7a50'), 440, 180, 14, 6);
  },
  counter(x, t, c) {
    rect(x, '#d9d3c7', 0, 0, 640, 400); rect(x, '#a39b8c', 0, 300, 640, 100);
    rect(x, '#5b4a3a', 80, 220, 480, 90); rect(x, '#6e5b48', 80, 210, 480, 16);
    rect(x, '#262a33', 330, 160, 90, 56); rect(x, '#5bb1d9', 338, 166, 74, 40); rect(x, '#3a3f4a', 340, 216, 70, 10);
    if (c.person) person(x, 220 + Math.sin(t / 2200) * 30, 230, 1.3, '#3a465e');
  },
};
SCENES.custom = SCENES.entrance;

function drawFeed(f, t) {
  const cv = f.canvas, x = cv.getContext('2d'), W = cv.width, H = cv.height, c = f.cam;
  x.save(); x.scale(W / 640, H / 400);
  if (c.status === 'offline') {
    x.drawImage(NOISE[Math.floor(t / 70) % 3], 0, 0, 640, 400);
    rect(x, 'rgba(6,8,13,.78)', 0, 0, 640, 400);
    x.restore(); return;
  }
  const z = f.pan.x || f.pan.y ? 1.25 : 1;
  x.save();
  if (z !== 1) { x.translate(320, 200); x.scale(z, z); x.translate(-320 - f.pan.x, -200 - f.pan.y); }
  (SCENES[c.scene] || SCENES.custom)(x, t, c);
  x.restore();
  // night-vision / colour grading
  x.fillStyle = c.type === 'outdoor' ? 'rgba(10,20,40,.22)' : 'rgba(20,16,8,.12)'; x.fillRect(0, 0, 640, 400);
  x.globalAlpha = .1; x.drawImage(NOISE[Math.floor(t / 90) % 3], 0, 0, 640, 400); x.globalAlpha = 1;
  const v = x.createRadialGradient(320, 200, 160, 320, 200, 420); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
  x.fillStyle = v; x.fillRect(0, 0, 640, 400);
  if (f.osd !== false) {
    const d = new Date(), ts = d.toLocaleDateString('en-ZA') + ' ' + d.toLocaleTimeString('en-ZA', { hour12: false });
    x.font = '600 15px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(255,255,255,.9)';
    x.textAlign = 'right'; x.fillText(ts, 626, 26);
    x.textAlign = 'left'; x.fillText('CH' + String(S.cameras.indexOf(c) + 1).padStart(2, '0') + ' ' + c.name.toUpperCase(), 14, 388);
  }
  x.restore();
}
let lastFrame = 0;
function loop(t) {
  requestAnimationFrame(loop);
  if (t - lastFrame < 66) return; lastFrame = t;
  for (const f of feeds) {
    if (!f.canvas.isConnected) { feeds.delete(f); continue; }
    if (f.canvas.offsetParent === null && !f.always) continue;
    drawFeed(f, t);
  }
}
requestAnimationFrame(loop);

/* ───────────── Audio (ring + siren) ───────────── */
let actx, ringTimer, ringNodes = [];
function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} } if (actx?.state === 'suspended') actx.resume(); return actx; }
function beep(freq, start, dur, type = 'sine', gain = .12) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = 0;
  g.gain.setTargetAtTime(gain, a.currentTime + start, .01); g.gain.setTargetAtTime(0, a.currentTime + start + dur, .02);
  o.connect(g).connect(a.destination); o.start(a.currentTime + start); o.stop(a.currentTime + start + dur + .2);
  ringNodes.push(o);
}
function ringOnce() { for (let i = 0; i < 2; i++) { beep(440, i * .5, .4); beep(480, i * .5, .4); } try { navigator.vibrate?.([400, 200, 400]); } catch {} }
function startRing() { stopRing(); ringOnce(); ringTimer = setInterval(ringOnce, 2600); }
function stopRing() { clearInterval(ringTimer); ringNodes.forEach(o => { try { o.stop(); } catch {} }); ringNodes = []; try { navigator.vibrate?.(0); } catch {} }
function siren() { const a = audio(); if (!a) return; for (let i = 0; i < 6; i++) beep(i % 2 ? 660 : 880, i * .35, .33, 'square', .05); }

/* ───────────── Auth ───────────── */
async function sha(s) {
  if (window.crypto?.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  return 'plain:' + s;
}
const accounts = () => store.get('sv_accounts', {});
async function login(email, pass) {
  email = email.trim().toLowerCase();
  if (email === DEMO_EMAIL && pass === DEMO_PASS) return { email, name: 'Sifiso Dlamini' };
  const acc = accounts()[email];
  if (acc && acc.hash === await sha(pass)) return { email, name: acc.name };
  return null;
}
function enterApp(user) {
  try { sessionStorage.setItem('sv_user', JSON.stringify(user)); } catch {}
  $('#login').classList.remove('active'); $('#app').classList.add('active');
  switchTab('home'); renderAll();
  toast(`Welcome, ${user.name.split(' ')[0]} 👋`);
  if (!window.__autoRang) { window.__autoRang = true; setTimeout(() => { if ($('#app').classList.contains('active') && !anyOverlayOpen()) incomingAlert(); }, 7000); }
}
function logout() {
  try { sessionStorage.removeItem('sv_user'); } catch {}
  ['camView', 'diagView', 'callView', 'addView'].forEach(closeOverlay);
  $('#app').classList.remove('active'); $('#login').classList.add('active');
  $('#loginErr').textContent = '';
}
const anyOverlayOpen = () => $$('.overlay.show').length > 0;

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); audio();
  const err = $('#loginErr'), email = $('#loginEmail').value, pass = $('#loginPass').value;
  if (!email.trim() || !pass) { err.className = 'form-err'; err.textContent = 'Enter your email and password.'; return; }
  err.className = 'form-err ok'; err.textContent = 'Verifying…';
  const user = await login(email, pass);
  if (!user) { err.className = 'form-err'; err.textContent = 'Incorrect email or password.'; return; }
  err.textContent = ''; enterApp(user);
});
$('#pwToggle').addEventListener('click', () => {
  const i = $('#loginPass'), show = i.type === 'password';
  i.type = show ? 'text' : 'password'; $('#pwToggle').textContent = show ? 'Hide' : 'Show';
});
$('#openRegister').addEventListener('click', () => { $('#loginForm').classList.add('hidden'); $('#registerForm').classList.remove('hidden'); $('#regName').focus(); });
$('#backToLogin').addEventListener('click', () => { $('#registerForm').classList.add('hidden'); $('#loginForm').classList.remove('hidden'); });
$('#registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#regName').value.trim(), email = $('#regEmail').value.trim().toLowerCase(), pass = $('#regPass').value, err = $('#regErr');
  if (!name) return (err.textContent = 'Enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) return (err.textContent = 'Enter a valid email address.');
  if (pass.length < 6) return (err.textContent = 'Password needs at least 6 characters.');
  if (email === DEMO_EMAIL || accounts()[email]) return (err.textContent = 'An account with that email already exists.');
  const all = accounts(); all[email] = { name, hash: await sha(pass) }; store.set('sv_accounts', all);
  err.textContent = ''; enterApp({ email, name });
  $('#registerForm').classList.add('hidden'); $('#loginForm').classList.remove('hidden');
});
$('#logoutBtn').addEventListener('click', logout);

/* ───────────── Tabs ───────────── */
function switchTab(name) {
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  $('.tabs-body').scrollTop = 0;
}
$('#tabbar').addEventListener('click', e => { const b = e.target.closest('button'); if (b) switchTab(b.dataset.tab); });
document.addEventListener('click', e => {
  const g = e.target.closest('[data-goto]'); if (g) switchTab(g.dataset.goto);
  const c = e.target.closest('[data-close]'); if (c) closeOverlay(c.dataset.close);
  const a = e.target.closest('[data-action="add-cam"]'); if (a) openAddCam();
});

/* ───────────── Render ───────────── */
function tileHTML(c) {
  const badge = c.status === 'offline' ? '<span class="tl-badge off">OFFLINE</span>'
    : c.status === 'motion' ? '<span class="tl-badge motion"><span class="live-dot"></span>MOTION</span>'
    : '<span class="tl-badge"><span class="live-dot"></span>LIVE</span>';
  const off = c.status === 'offline' ? '<div class="offline-msg">⚠ NO SIGNAL<span>Tap to diagnose</span></div>' : '';
  return `<button class="tile ${c.status}" data-cam="${c.id}" aria-label="${esc(c.name)} camera, ${c.status}"><canvas width="320" height="200"></canvas>${badge}${off}<div class="tl-name">${esc(c.name)}<small>${esc(c.res.split(' ·')[0])}</small></div></button>`;
}
function renderCams() {
  const home = $('#homeCams'), all = $('#allCams');
  const order = [...S.cameras].sort((a, b) => (b.status === 'offline') - (a.status === 'offline'));
  home.innerHTML = order.slice(0, 4).map(tileHTML).join('');
  all.innerHTML = S.cameras.map(tileHTML).join('');
  $$('.tile', home).concat($$('.tile', all)).forEach(el => attachFeed($('canvas', el), cam(el.dataset.cam)));
  $('#camCount').textContent = `Cameras · ${S.cameras.length}`;
}
function renderStats() {
  const on = S.cameras.filter(c => c.status !== 'offline').length, off = S.cameras.length - on;
  const unread = S.alerts.filter(a => !a.read).length;
  $('#stats').innerHTML = `
    <button class="stat" data-goto="cams"><b class="green">${on}</b><small>Cameras online</small></button>
    <button class="stat" ${off ? `data-diag="${S.cameras.find(c => c.status === 'offline').id}"` : 'data-goto="cams"'}><b class="${off ? 'red' : 'green'}">${off}</b><small>Offline</small></button>
    <button class="stat" data-goto="alerts"><b class="blue">${unread}</b><small>New alerts</small></button>`;
  const badge = $('#alertBadge'); badge.textContent = unread; badge.classList.toggle('show', unread > 0);
}
function alertRow(a) {
  return `<button class="row lvl-${a.level} ${a.read ? '' : 'unread'}" data-alert="${a.id}"><span class="ico">${ALERT_ICON[a.type] || '🔔'}</span><span class="body"><b>${esc(a.title)}</b><small>${esc(a.desc)}</small><span class="time">${ago(a.t)}</span></span>${a.type === 'offline' && cam(a.cam)?.status === 'offline' ? '<span class="pill amber">Fix</span>' : ''}</button>`;
}
let alertFilter = 'all';
function renderAlerts() {
  const sorted = [...S.alerts].sort((a, b) => b.t - a.t);
  $('#homeAlerts').innerHTML = sorted.slice(0, 3).map(alertRow).join('');
  $('#alertList').innerHTML = sorted.filter(a => alertFilter === 'all' || a.level === alertFilter || (alertFilter === 'info' && a.level === 'log')).map(alertRow).join('');
}
function renderNotif() {
  const rows = [
    ['call', '📞', 'Call-style alerts', 'Phone rings like an incoming call'],
    ['personOnly', '🧠', 'AI: people & vehicles only', 'Ignore animals, trees and shadows'],
    ['whatsapp', '💬', 'WhatsApp snapshots', 'Send a still image with each alert'],
    ['lpr', '🚗', 'Number plate alerts', 'Unknown plates in the driveway'],
    ['silent', '🌙', 'Silent hours 22:00–06:00', 'Critical alerts still ring'],
  ];
  $('#notifSettings').innerHTML = rows.map(([k, i, t, d]) => `<button class="row" data-notif="${k}" role="switch" aria-checked="${S.notif[k]}"><span class="ico">${i}</span><span class="body"><b>${t}</b><small>${d}</small></span><span class="switch ${S.notif[k] ? 'on' : ''}"></span></button>`).join('');
}
function renderDevices() {
  const d = S.dvr;
  $('#dvrCard').innerHTML = `<div class="dvr-top"><div><b>${d.name}</b><small>${d.model}</small></div><span class="pill green">Recording</span></div>
    <div class="bar"><i style="width:${d.used}%"></i></div><div class="dvr-foot"><span>${Math.round(d.size * d.used / 100)} GB of ${d.size / 1000} TB used</span><span>≈ 21 days retention</span></div>`;
  const sIco = { door: '🚪', pir: '📡', smoke: '🔥', temperature: '🌡' };
  const sPill = { normal: ['green', 'Normal'], active: ['blue', 'Motion'], open: ['amber', 'Open'], triggered: ['red', 'Triggered'] };
  $('#sensorList').innerHTML = S.sensors.map(s => `<button class="row" data-sensor="${s.id}"><span class="ico">${sIco[s.type]}</span><span class="body"><b>${esc(s.name)}</b><small>Zone ${s.zone} · ${s.type === 'temperature' ? s.value : 'tap to test'}</small></span><span class="pill ${sPill[s.status][0]}">${sPill[s.status][1]}</span></button>`).join('');
  $('#bioList').innerHTML = S.biometrics.map(b => `<div class="row"><span class="ico">☝</span><span class="body"><b>${esc(b.name)}</b><small>${b.brand} · ${b.type} · ${b.enrolled} enrolled</small></span><span class="pill green">Online</span></div>`).join('');
}
const ROLE = { owner: 'blue', family: 'green', staff: 'purple', installer: 'amber' };
const PERM = { playback: 'Playback', export: 'Export', arm: 'Arm/disarm', alerts: 'Alerts' };
let openUser = null;
function renderUsers() {
  $('#userList').innerHTML = S.users.map(u => {
    const camTxt = u.cams === '*' ? 'All cameras' : `${u.cams} camera${u.cams === 1 ? '' : 's'}`;
    const perms = Object.entries(u.perms).filter(([, v]) => v).map(([k]) => `<span class="pill">${PERM[k]}</span>`).join('');
    const detail = openUser === u.id ? `<div style="padding:0 14px 12px 64px">${Object.keys(PERM).map(k => `<button class="row" style="padding:8px 0" data-perm="${u.id}:${k}" role="switch" aria-checked="${u.perms[k]}" ${u.role === 'owner' ? 'disabled' : ''}><span class="body"><b style="font-weight:500">${PERM[k]}</b></span><span class="switch ${u.perms[k] ? 'on' : ''}" ${u.role === 'owner' ? 'style="opacity:.5"' : ''}></span></button>`).join('')}${u.role === 'owner' ? '<small style="color:var(--dim)">Owner permissions cannot be changed.</small>' : ''}</div>` : '';
    return `<div><button class="row" data-user="${u.id}" aria-expanded="${openUser === u.id}"><span class="avatar ${u.online ? 'online' : ''}" style="background:${u.color};color:${u.fg}">${u.initials}</span><span class="body"><b>${esc(u.name)}</b><small>${camTxt} · ${esc(u.email)}</small><span class="perm-row">${perms}</span></span><span class="pill ${ROLE[u.role]}">${u.role[0].toUpperCase() + u.role.slice(1)}</span></button>${detail}</div>`;
  }).join('');
}
function renderArmed() {
  const p = $('#armedPill'); p.classList.toggle('off', !S.armed); p.setAttribute('aria-pressed', S.armed);
  $('#armedLabel').textContent = S.armed ? 'Armed' : 'Disarmed';
}
function renderAll() { renderArmed(); renderStats(); renderCams(); renderAlerts(); renderNotif(); renderDevices(); renderUsers(); }
setInterval(() => { if ($('#app').classList.contains('active')) renderAlerts(); }, 30000);

function addAlert(a) { S.alerts.push({ id: 'a' + Date.now(), t: Date.now(), read: false, ...a }); renderStats(); renderAlerts(); }

/* ───────────── Interactions ───────────── */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-cam]'); if (t) { const c = cam(t.dataset.cam); c.status === 'offline' ? openDiag(c) : openCam(c); return; }
  const d = e.target.closest('[data-diag]'); if (d) { openDiag(cam(d.dataset.diag)); return; }
  const al = e.target.closest('[data-alert]');
  if (al) {
    const a = S.alerts.find(x => x.id === al.dataset.alert); a.read = true; renderStats(); renderAlerts();
    const c = a.cam && cam(a.cam);
    if (c) c.status === 'offline' ? openDiag(c) : openCam(c, a.type === 'person' && c.id === 'cam1');
    else toast(a.title + ' · ' + a.desc);
    return;
  }
  const n = e.target.closest('[data-notif]'); if (n) { const k = n.dataset.notif; S.notif[k] = !S.notif[k]; renderNotif(); toast(`${$('b', n).textContent}: ${S.notif[k] ? 'on' : 'off'}`); return; }
  const s = e.target.closest('[data-sensor]');
  if (s) {
    const sen = S.sensors.find(x => x.id === s.dataset.sensor);
    if (sen.type === 'temperature') { toast('Server room is 22.4°C. That is in the normal range.'); return; }
    toast(`Testing ${sen.name}…`);
    setTimeout(() => { toast(`✅ ${sen.name} responded in 38 ms. Battery 92%.`); }, 1000);
    return;
  }
  const u = e.target.closest('[data-user]'); if (u) { openUser = openUser === u.dataset.user ? null : u.dataset.user; renderUsers(); return; }
  const p = e.target.closest('[data-perm]');
  if (p && !p.disabled) { const [id, k] = p.dataset.perm.split(':'), usr = S.users.find(x => x.id === id); usr.perms[k] = !usr.perms[k]; renderUsers(); toast(`${usr.name.split(' ')[0]}: ${PERM[k]} ${usr.perms[k] ? 'granted' : 'removed'}`); }
});
$('#alertFilters').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  alertFilter = c.dataset.f; $$('#alertFilters .chip').forEach(x => x.classList.toggle('on', x === c)); renderAlerts();
});
$('#markAllRead').addEventListener('click', () => { S.alerts.forEach(a => (a.read = true)); renderStats(); renderAlerts(); toast('All alerts marked as read'); });
$('#armedPill').addEventListener('click', () => {
  S.armed = !S.armed; renderArmed();
  addAlert({ type: S.armed ? 'armed' : 'disarmed', title: S.armed ? 'System armed' : 'System disarmed', desc: 'By you · all zones', level: 'log', read: true });
  toast(S.armed ? '🛡 System armed. All zones are active.' : '🔓 System disarmed. Alerts are paused.');
});
$('#simAlertBtn').addEventListener('click', () => incomingAlert());

/* ───────────── Incoming call-style alert ───────────── */
let callFeed;
function incomingAlert() {
  audio();
  if (!S.armed) { toast('The system is disarmed. Arm it to receive alerts.'); return; }
  const c = cam('cam1');
  $('#callTitle').textContent = 'Person detected';
  $('#callSub').textContent = `${c.name} · AI confidence 97%`;
  if (!callFeed) callFeed = attachFeed($('#callCanvas'), c, { always: false });
  openOverlay('callView');
  if (S.notif.call) startRing(); else ringOnce();
  addAlert({ type: 'person', title: 'Person detected', desc: 'Front Door · AI WizSense · 97%', cam: 'cam1', level: 'critical' });
}
$('#callAccept').addEventListener('click', () => {
  closeOverlay('callView');
  const a = [...S.alerts].reverse().find(x => x.type === 'person'); if (a) a.read = true; renderStats(); renderAlerts();
  openCam(cam('cam1'), true);
});
$('#callDecline').addEventListener('click', () => { closeOverlay('callView'); toast('Alert dismissed. You can find it under Alerts.'); });

/* ───────────── Camera detail ───────────── */
let cvFeed, cvCam, waveTimer, trTimers = [], recording = false, talking = false;
const TR = {
  raw: '"Hambani, masiphume apha ngoku, kukho umntu oza kusibona!"',
  en: ['TRANSLATION · ENGLISH', '"Move, let\'s get out of here now, someone is going to see us!"'],
  af: ['TRANSLATION · AFRIKAANS', '"Beweeg, kom ons gaan nou hier weg, iemand gaan ons sien!"'],
  orig: ['ORIGINAL · ISIXHOSA', '"Hambani, masiphume apha ngoku, kukho umntu oza kusibona!"'],
};
function openCam(c, translate = false) {
  cvCam = c;
  $('#cvName').textContent = c.name; $('#cvModel').textContent = c.model;
  const st = $('#cvStatus'); st.textContent = c.status === 'motion' ? '● MOTION' : '● LIVE'; st.className = 'pill ' + (c.status === 'motion' ? 'red' : 'green');
  $('#cvMeta').innerHTML = `<div><span>Resolution</span><b>${esc(c.res)}</b></div><div><span>Brand</span><b>${esc(c.brand[0].toUpperCase() + c.brand.slice(1))}</b></div><div><span>IP address</span><b>${esc(c.ip)}</b></div><div><span>Features</span><b>${[c.night && 'Night vision', c.ai && 'AI'].filter(Boolean).join(' · ') || 'Standard'}</b></div>`;
  if (cvFeed) feeds.delete(cvFeed);
  cvFeed = attachFeed($('#cvCanvas'), c);
  const h = new Date().getHours();
  const ev = [
    [c.id === 'cam1' ? 'Person detected at door' : 'Motion in zone', 'red', 2],
    ['Recording segment saved', '', 18],
    ['Night mode switched off', '', 60 * Math.max(1, h - 6)],
    ['Camera came online', '', 60 * Math.max(2, h - 5)],
  ];
  $('#timeline').innerHTML = ev.map(([t, cls, m]) => `<div class="${cls}">${t}<small>${new Date(Date.now() - m * MIN).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</small></div>`).join('');
  setRecording(false); setTalking(false);
  $('#langSel').value = 'en';
  resetTranslation();
  openOverlay('camView');
  $('#camView .cv-scroll').scrollTop = 0;
  if (translate) runTranslation(); else idleWave();
}
function stopCamView() { clearInterval(waveTimer); trTimers.forEach(clearTimeout); trTimers = []; setRecording(false); setTalking(false); }
function resetTranslation() {
  trTimers.forEach(clearTimeout); trTimers = [];
  $('#trRaw').textContent = 'Listening for voices…'; $('#trRaw').className = 'muted-i';
  $('#trOut').textContent = 'Waiting for speech…'; $('#trOut').className = 'muted-i';
  $('#trLbl').textContent = TR.en[0];
}
function setWave(level) { clearInterval(waveTimer); const bars = $$('#wave i'); waveTimer = setInterval(() => bars.forEach(b => (b.style.height = (10 + Math.random() * level) + '%')), 120); }
function idleWave() { setWave(14); }
function runTranslation() {
  setWave(85);
  trTimers.push(setTimeout(() => { $('#trRaw').textContent = TR.raw; $('#trRaw').className = ''; }, 1400));
  trTimers.push(setTimeout(() => { showTranslation(); setWave(30); }, 2400));
}
function showTranslation() {
  const [lbl, txt] = TR[$('#langSel').value] || TR.en;
  $('#trLbl').textContent = lbl; $('#trOut').textContent = txt; $('#trOut').className = '';
}
$('#langSel').addEventListener('change', () => {
  if ($('#trRaw').className === 'muted-i') { $('#trLbl').textContent = (TR[$('#langSel').value] || TR.en)[0]; return; }
  showTranslation();
});
function setRecording(on) { recording = on; $('#actRec').classList.toggle('on', on); $('#recInd').classList.toggle('hidden', !on); }
function setTalking(on) { talking = on; const b = $('#actTalk'); b.classList.toggle('on', on); b.classList.toggle('talk', on); }
$('#actSnap').addEventListener('click', () => {
  try {
    const a = document.createElement('a');
    a.download = `SibrixVision-${cvCam.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
    a.href = $('#cvCanvas').toDataURL('image/png'); a.click();
    toast('📸 Snapshot saved');
  } catch { toast('Snapshot could not be saved in this browser.'); }
});
$('#actRec').addEventListener('click', () => { setRecording(!recording); toast(recording ? '⏺ Recording to the DVR…' : '⏹ Clip saved to the DVR'); });
$('#actTalk').addEventListener('click', () => { setTalking(!talking); toast(talking ? `🎙 Two-way audio open on ${cvCam.name}` : 'Two-way audio closed'); });
$('#actSiren').addEventListener('click', () => { siren(); const b = $('#actSiren'); b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 2200); toast('🚨 Siren and strobe triggered for 30 s'); });
$('.ptz-pad').addEventListener('click', e => {
  const b = e.target.closest('[data-ptz]'); if (!b || !cvFeed) return;
  const p = cvFeed.pan, step = 40, d = b.dataset.ptz;
  if (d === 'home') { p.x = 0; p.y = 0; } else {
    p.x = Math.max(-64, Math.min(64, p.x + (d === 'left' ? -step : d === 'right' ? step : 0)));
    p.y = Math.max(-40, Math.min(40, p.y + (d === 'up' ? -step : d === 'down' ? step : 0)));
  }
});

/* ───────────── Offline diagnostic + AI Copilot ───────────── */
let diagCam, diagStep = 0, diagTimers = [];
function chat(text, who = 'ai') {
  const m = document.createElement('div'); m.className = 'msg ' + who; m.innerHTML = text;
  $('#chat').appendChild(m); $('#chat').scrollTop = $('#chat').scrollHeight; return m;
}
function presets(list) {
  $('#presets').innerHTML = list.map(([label, val, cls = '']) => `<button class="chip ${cls}" data-say="${esc(val)}">${esc(label)}</button>`).join('');
}
function typeTerm(lines, done) {
  const term = $('#term'); term.textContent = ''; let i = 0;
  (function next() { if (i >= lines.length) return done?.(); term.textContent += (i ? '\n' : '') + lines[i++]; diagTimers.push(setTimeout(next, 380)); })();
}
function openDiag(c) {
  diagCam = c; diagStep = 0; diagTimers.forEach(clearTimeout); diagTimers = [];
  $('#dgName').textContent = c.name; $('#dgModel').textContent = c.model; $('#topoCam').textContent = c.name;
  $('#dgStatus').textContent = 'OFFLINE'; $('#dgStatus').className = 'pill red';
  $('#hudTitle').textContent = '⚠ FAULT ANALYSIS'; $('#hudTitle').className = 'hud-title';
  $('#hudDiag').textContent = 'PING_TIMEOUT / NO_POWER'; $('#hudDiag').className = 'amber';
  $('#hudSeen').textContent = new Date(Date.now() - 5 * MIN).toLocaleString('en-ZA', { hour12: false });
  $('#topoLine').className = 'tl bad'; $('#topoNode').className = 'tn bad';
  $('#term').textContent = '> Ready. Answer the Copilot below to begin trace…';
  $('#cpSub').textContent = 'Tracing network path to camera…';
  $('#chat').innerHTML = '';
  chat(`Hi! <b>${esc(c.name)}</b> stopped responding 5 minutes ago. Let's find the fault together before you call a technician. <b>Are the status lights on the camera completely dark?</b>`);
  presets([['Yes, completely dark', 'Yes, the lights are completely dark.'], ['Blinking amber', 'The light is blinking amber slowly.'], ['Cables look fine', 'I checked, the cables are plugged in tight.']]);
  openOverlay('diagView');
}
function copilotReply(build) {
  $('#presets').innerHTML = '<span class="done" style="color:var(--dim)">Copilot is checking the network…</span>';
  const typing = chat('Analysing telemetry…', 'ai typing');
  diagTimers.push(setTimeout(() => { typing.remove(); build(); }, 1100));
}
$('#presets').addEventListener('click', e => {
  const b = e.target.closest('[data-say]'); if (!b) return;
  const text = b.dataset.say;
  if (b.dataset.say === '__ticket') { dispatchTicket(); return; }
  if (b.dataset.say === '__done') { closeOverlay('diagView'); return; }
  chat(esc(text), 'me');
  if (diagStep === 0) {
    copilotReply(() => {
      typeTerm([`> ping ${diagCam.ip} -c 4`, '> Request timed out. (x4)', '> Packet loss: 100%', '> PoE switch port 4: 0.0 W draw'], () => {
        chat(text.includes('amber')
          ? 'Slow amber blinking means the camera has power but no network link. The switch reports <b>no power draw on port 4</b>, so the cable is probably faulty. <b>Unplug the cable from PoE switch port 4 for 10 seconds, then plug it back in.</b> Did the link light come on?'
          : 'Confirmed: 100% packet loss and <b>no power draw on PoE switch port 4</b>. The camera is not getting power. <b>Unplug the cable from port 4 for 10 seconds, then plug it back in.</b> Did the link light come on?');
        presets([['Yes, link light is on', 'Yes! The green link light turned back on.'], ['Still dark', 'No, the camera is still completely dark.']]);
        diagStep = 1;
      });
    });
  } else if (diagStep === 1) {
    diagStep = 2;
    if (text.includes('turned back on')) {
      copilotReply(() => {
        typeTerm([`> ping ${diagCam.ip} -c 4`, '> 64 bytes: ttl=64 time=4.2 ms', '> PoE port 4: 6.1 W draw · link 100 Mbps', '> RTSP handshake (H.265)… OK'], () => {
          $('#topoLine').className = 'tl ok'; $('#topoNode').className = 'tn ok';
          $('#hudTitle').textContent = '✔ FAULT CLEARED'; $('#hudTitle').className = 'hud-title ok';
          $('#hudDiag').textContent = 'LINK RESTORED'; $('#hudDiag').className = 'green';
          $('#dgStatus').textContent = 'ONLINE'; $('#dgStatus').className = 'pill green';
          $('#cpSub').textContent = 'Camera restored';
          chat(`Fixed! <b>${esc(diagCam.name)}</b> is streaming again. Power-cycling the port cleared the PoE fault. <b>You don't need a call-out.</b> I've added this fix to the maintenance log.`);
          presets([['✔ Back to dashboard', '__done', 'ok']]);
          diagCam.status = 'online';
          addAlert({ type: 'fixed', title: 'Camera restored', desc: `${diagCam.name} · fixed with the AI Copilot`, cam: diagCam.id, level: 'info', read: true });
          renderCams();
        });
      });
    } else {
      copilotReply(() => {
        typeTerm(['> tracepath stopped: device unreachable', '> Cable test port 4: OPEN at 23 m', '> Recommendation: replace cable run'], () => {
          chat('The cable test found a <b>break about 23 m along the cable</b>, so a technician needs to replace it. I\'ve put together the diagnostic logs so Sibrix support can come prepared.');
          presets([['Send logs to Sibrix support', '__ticket', 'danger']]);
        });
      });
    }
  }
});
function dispatchTicket() {
  const id = 'SV-' + Math.floor(10000 + Math.random() * 89999);
  chat(`Ticket <b>${id}</b> sent to Sibrix support with the full trace. A technician will contact you within 4 business hours.`);
  presets([['✔ Back to dashboard', '__done']]);
  toast(`🎫 Ticket ${id} sent to Sibrix support`);
}
$('#diagView [data-close]').addEventListener('click', () => { diagTimers.forEach(clearTimeout); diagTimers = []; });

/* ───────────── Add camera ───────────── */
const RTSP = {
  dahua: (ip, u, p) => `rtsp://${u}:${p}@${ip}:554/cam/realmonitor?channel=1&subtype=0`,
  hikvision: (ip, u, p) => `rtsp://${u}:${p}@${ip}:554/Streaming/Channels/101`,
  reolink: (ip, u, p) => `rtsp://${u}:${p}@${ip}:554/h264Preview_01_main`,
  axis: (ip, u, p) => `rtsp://${u}:${p}@${ip}/axis-media/media.amp`,
  onvif: (ip, u, p) => `rtsp://${u}:${p}@${ip}:554/stream`,
};
function updateUrl() {
  const b = $('#acBrand').value, p = $('#acPass').value ? '•'.repeat(Math.min(8, $('#acPass').value.length)) : '';
  $('#acUrl').textContent = RTSP[b]($('#acIp').value || '0.0.0.0', $('#acUser').value || 'admin', p);
}
function openAddCam() { $('#addForm').reset(); $('#acErr').textContent = ''; $('#acSubmit').disabled = false; $('#acSubmit').textContent = 'Test & connect'; updateUrl(); openOverlay('addView'); setTimeout(() => $('#acName').focus(), 250); }
['acBrand', 'acIp', 'acUser', 'acPass'].forEach(id => $('#' + id).addEventListener('input', updateUrl));
$('#addView').addEventListener('click', e => { if (e.target.id === 'addView') closeOverlay('addView'); });
$('#addForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#acName').value.trim(), ip = $('#acIp').value.trim(), err = $('#acErr');
  if (!name) { err.textContent = 'Give the camera a name.'; return; }
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || ip.split('.').some(n => +n > 255)) { err.textContent = 'Enter a valid IP address, e.g. 192.168.1.120'; return; }
  if (S.cameras.some(c => c.ip === ip)) { err.textContent = 'A camera with that IP address is already added.'; return; }
  err.className = 'form-err ok'; err.textContent = 'Connecting over RTSP…';
  const btn = $('#acSubmit'); btn.disabled = true; btn.textContent = 'Connecting…';
  setTimeout(() => { err.textContent = 'Stream found · H.264 · 1920×1080 · 25 fps'; }, 900);
  setTimeout(() => {
    const brand = $('#acBrand').value, type = $('#acType').value;
    S.cameras.push({ id: 'cam' + Date.now(), name, model: brand === 'onvif' ? 'ONVIF Generic' : $('#acBrand').selectedOptions[0].text + ' IP camera', brand, type, status: 'online', res: '2MP · 1920×1080', night: true, ai: brand !== 'onvif', ip, scene: type === 'indoor' ? 'store' : 'entrance' });
    addAlert({ type: 'added', title: 'Camera added', desc: `${name} · ${ip}`, level: 'info', read: true });
    renderAll(); closeOverlay('addView'); switchTab('cams'); err.className = 'form-err';
    toast(`📷 ${name} connected`);
  }, 2000);
});

/* ───────────── Desktop guide ───────────── */
async function ensureIn() {
  if ($('#app').classList.contains('active')) return;
  enterApp({ email: DEMO_EMAIL, name: 'Sifiso Dlamini' });
}
$$('[data-guide]').forEach(b => b.addEventListener('click', async () => {
  const g = b.dataset.guide; audio();
  if (g === 'reset') { try { sessionStorage.clear(); } catch {} location.reload(); return; }
  window.__autoRang = true; await ensureIn();
  ['camView', 'diagView', 'callView', 'addView'].forEach(id => $('#' + id).classList.contains('show') && closeOverlay(id));
  if (g === 'ring') { if (!S.armed) { S.armed = true; renderArmed(); } setTimeout(incomingAlert, 300); }
  if (g === 'diag') { const c = cam('cam4'); c.status = 'offline'; renderAll(); openDiag(c); }
  if (g === 'add') { switchTab('cams'); openAddCam(); }
}));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const open = $$('.overlay.show').pop(); if (open && open.id !== 'callView') closeOverlay(open.id);
});

/* ───────────── Boot ───────────── */
(function boot() {
  let u = null; try { u = JSON.parse(sessionStorage.getItem('sv_user') || 'null'); } catch {}
  if (u) { window.__autoRang = true; enterApp(u); }
})();
