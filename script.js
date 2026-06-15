let armedState = true;
let diagnosticStateStep = 0;
const DEFAULT_ACCOUNT_EMAIL = 'sibrix@gmail.co.za';
const DEFAULT_ACCOUNT_PASSWORD = 'Password';

// ADD This Multi-lingual Threat Track Object Array to the top of your script.js file
const TRANSLATION_DATABASE = {
  rawAudio: '"Hambani, masiphame apha ngoku uvale lo mlomo!"',
  translations: {
    en: {
      label: "TRANSLATION (ENGLISH):",
      text: '"Move, let\'s break in here right now and shut that mouth!"'
    },
    xh: {
      label: "TRANSLATION (ISIXHOSA):",
      text: '"Khawuleza, masigqobhoze apha ngoku ungathethi kwaphela!"'
    },
    af: {
      label: "TRANSLATION (AFRIKAANS):",
      text: '"Beweeg, kom ons breek nou hier in en hou daardie mond toe!"'
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  ensureDefaultAccount();
  const defaultEmailField = document.getElementById('loginUser');
  if (defaultEmailField && defaultEmailField.value.trim() === '') {
    defaultEmailField.value = DEFAULT_ACCOUNT_EMAIL;
  }
});

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

function processSimulatedTranslation() {
  const currentSelectedLang = document.getElementById('targetLanguageSelector')?.value || 'en';
  const rawTranscriptNode = document.getElementById('rawAudioTranscript');
  const translationOutputNode = document.getElementById('translatedAudioOutput');
  const targetLabelTagNode = document.getElementById('translatedLabelTag');

  if (!rawTranscriptNode || !translationOutputNode || !targetLabelTagNode) return;

  rawTranscriptNode.textContent = TRANSLATION_DATABASE.rawAudio;

  const selectedLangPayload = TRANSLATION_DATABASE.translations[currentSelectedLang] || TRANSLATION_DATABASE.translations.en;
  targetLabelTagNode.textContent = selectedLangPayload.label;
  translationOutputNode.textContent = selectedLangPayload.text;
  translationOutputNode.classList.remove('italic');
  translationOutputNode.style.color = currentSelectedLang === 'en' ? 'var(--text)' : 'var(--green)';
}

function showCamDetail(camName, camModel, camType, autoTranslate = false) {
  const overlay = document.getElementById('camDetail');
  if (!overlay) return;

  const nameNode = document.getElementById('camDetailName');
  const modelNode = document.getElementById('camDetailModel');
  const statusNode = document.getElementById('camStatusLabel');

  if (nameNode) nameNode.textContent = camName || 'Camera';
  if (modelNode) modelNode.textContent = camModel || '';
  if (statusNode) statusNode.textContent = camType === 'outdoor' ? 'Outdoor Feed' : 'Live Feed';

  overlay.classList.add('show');
  showScreen('s-home');

  if (autoTranslate) {
    setTimeout(() => processSimulatedTranslation(), 800);
  }
}

function closeCamDetail() {
  document.getElementById('camDetail')?.classList.remove('show');
}

function acceptCall() {
  document.getElementById('callOverlay')?.classList.remove('show');
  showScreen('s-home');
  showCamDetail('Front Door', 'Dahua 5MP Full-Colour', 'outdoor', true);

  setTimeout(() => {
    processSimulatedTranslation();
  }, 800);
}

function ensureDefaultAccount() {
  const existingHash = getUserHash(DEFAULT_ACCOUNT_EMAIL);
  if (!existingHash) {
    registerUser(DEFAULT_ACCOUNT_EMAIL, DEFAULT_ACCOUNT_PASSWORD).catch(() => {});
  }
}

// TOGGLE ARMED SYSTEM STATE
const SECURE_VAULT_HASH = "85b54a72fa34407b46d79a7bc671b569bfbe983a54d52bc0a1f26cf94c034b07";

function getActiveVaultHash() {
  try {
    const stored = localStorage.getItem('secure_vault_hash');
    return stored && stored.length === 64 ? stored : SECURE_VAULT_HASH;
  } catch (e) {
    return SECURE_VAULT_HASH;
  }
}

function getUserAccounts() {
  try {
    const raw = localStorage.getItem('user_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveUserAccounts(obj) {
  try { localStorage.setItem('user_accounts', JSON.stringify(obj)); } catch (e) {}
}

function getUserHash(email) {
  const acc = getUserAccounts();
  return acc[email] || null;
}

async function registerUser(email, pass) {
  const buf = new TextEncoder().encode(pass);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hArr = Array.from(new Uint8Array(hashBuf));
  const hex = hArr.map(b => b.toString(16).padStart(2, '0')).join('');
  const acc = getUserAccounts();
  acc[email] = hex;
  saveUserAccounts(acc);
  return hex;
}

function promptRegister() {
  const email = prompt('Enter email for new account:');
  if (!email) { alert('Cancelled'); return; }
  const p1 = prompt('Enter password for ' + email + ':');
  if (!p1) { alert('Cancelled'); return; }
  const p2 = prompt('Repeat password:');
  if (p1 !== p2) { alert('Passwords do not match.'); return; }
  registerUser(email, p1).then(() => alert('Account created locally. You can now sign in.'));
}

async function promptResetPassphrase() {
  const ok = confirm('Reset local passphrase? Only run this on your machine. Continue?');
  if (!ok) return;
  const p1 = prompt('Enter new passphrase (will be stored locally):');
  if (!p1) { alert('Cancelled.'); return; }
  const p2 = prompt('Repeat new passphrase:');
  if (p1 !== p2) { alert('Passphrases did not match.'); return; }
  await setNewPassphrase(p1);
}

async function setNewPassphrase(pass) {
  try {
    const buf = new TextEncoder().encode(pass);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    const hArr = Array.from(new Uint8Array(hashBuf));
    const hex = hArr.map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('secure_vault_hash', hex);
    alert('Local passphrase stored. Use it to login now.');
  } catch (e) {
    alert('Failed to set passphrase locally.');
  }
}

function toggleArmed() {
  armedState = !armedState;
  const pill = document.getElementById('armedPill');
  const lbl = document.getElementById('armedLabel');
  if (armedState) {
    pill.classList.remove('disarmed');
    lbl.textContent = 'Armed';
  } else {
    pill.classList.add('disarmed');
    lbl.textContent = 'Disarmed';
  }
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('loginPass');
  if (passInput.type === 'password') {
    passInput.type = 'text';
  } else {
    passInput.type = 'password';
  }
}

async function verifySecureLogin() {
  const email = (document.getElementById('loginUser').value || '').trim().toLowerCase();
  const passwordInput = document.getElementById('loginPass').value;
  const errorNode = document.getElementById('loginError');

  if (!email || !passwordInput) {
    errorNode.style.color = "var(--red)";
    errorNode.textContent = "Please enter email and password.";
    return;
  }

  errorNode.style.color = "var(--cyan)";
  errorNode.textContent = "Verifying credentials...";

  try {
    const msgBuffer = new TextEncoder().encode(passwordInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const storedHash = getUserHash(email);
    const legacyHash = getActiveVaultHash();

    // Accept either a stored user account or the legacy admin hash
    if (storedHash && computedHashHex === storedHash) {
      // success
    } else if (!storedHash && computedHashHex === legacyHash) {
      // legacy admin success
    } else {
      errorNode.style.color = "var(--red)";
      errorNode.textContent = "Authentication failed: invalid email or password.";
      return;
    }

    // Signed in
    errorNode.textContent = "";
    document.getElementById('loginPass').value = '';
    document.getElementById('s-login').classList.remove('active');
    showScreen('s-home');

    setTimeout(() => {
      const chatSpace = document.getElementById('chatSpace');
      if (chatSpace) {
        const systemHint = document.createElement('div');
        systemHint.className = 'msg ai';
        systemHint.style.borderColor = 'var(--blue)';
        systemHint.innerHTML = `💡 <b>Welcome ${email}</b> — you are signed in.`;
        chatSpace.appendChild(systemHint);
        chatSpace.scrollTop = chatSpace.scrollHeight;
      }
    }, 800);
  } catch (err) {
    errorNode.style.color = "var(--red)";
    errorNode.textContent = "Crypto failure processing transaction token.";
  }
}

function logout() {
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').textContent = '';
  showScreen('s-login');
}

// OPEN INTERACTIVE OFFLINE TERMINAL & AI ENGINE
function openOfflineDiagnostic(camName, camModel) {
  document.getElementById('offCamName').textContent = camName;
  document.getElementById('offCamModel').textContent = camModel;
  document.getElementById('offlineDetail').classList.add('show');
}

function closeOfflineDiagnostic() {
  document.getElementById('offlineDetail').classList.remove('show');
  diagnosticStateStep = 0;
  document.getElementById('terminalOutput').textContent = '> Ready. Tap diagnostic option below to begin trace...';
  
  // Clear chat thread reset back to base condition for next demo run
  document.getElementById('chatSpace').innerHTML = `
    <div class="msg ai">
      Hello! I noticed the <b>Back Office</b> camera dropped off the local area network network. Before you call support, let's trace the fault path together. Are the status indicator lights completely dark on the back of the camera housing?
    </div>
  `;
}

// SIMULATE AI CHAT RESPONSE LOGIC REPLIES
function sendUserSimulatedMsg(text) {
  const chatSpace = document.getElementById('chatSpace');
  const term = document.getElementById('terminalOutput');
  const presetsContainer = document.querySelector('.chat-presets');
  
  // 1. Post user choice selection directly to the message window
  const userMsg = document.createElement('div');
  userMsg.className = 'msg user';
  userMsg.textContent = text;
  chatSpace.appendChild(userMsg);
  chatSpace.scrollTop = chatSpace.scrollHeight;

  // 2. Clear out older selection buttons temporarily to mimic network processing latencies
  presetsContainer.innerHTML = `<span style="font-size:11px; color:var(--muted); padding:6px 0;">Copilot processing telemetry...</span>`;

  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'msg ai';

    if (diagnosticStateStep === 0) {
      term.innerHTML = "> Executing ICMP Ping to node [192.168.1.45]...\n> Request timed out.\n> Packet loss: 100%";
      aiMsg.innerHTML = "Confirming 100% packet drop. Since the physical housing status lights are dead, we are dealing with a power infrastructure drop. <b>Please try power-cycling the Ethernet connection on PoE Switch Port 4.</b> Did the link lights activate after reconnecting?";
      presetsContainer.innerHTML = `
        <button class="chip" onclick="sendUserSimulatedMsg('Yes! The green power LED turned back on.')">Yes, link active</button>
        <button class="chip" onclick="sendUserSimulatedMsg('No, the device remains completely dark.')">Still dead</button>
      `;
      diagnosticStateStep = 1;
    } else if (diagnosticStateStep === 1) {
      if (text.includes('turned back on')) {
        term.innerHTML = "> ICMP Ping successful! [192.168.1.45]\n> TTL=64, Time=4.2ms\n> Parsing H.265 video handshake... OK.";
        aiMsg.innerHTML = "Excellent news! Telemetry streams show the camera handshake completed successfully. The port cycle cleared the cache latch fault. <b>You don't need to request field service support—the channel is resolved.</b>";
        document.getElementById('topoLineBreak').className = 'topo-line line-active';
        document.getElementById('topoTargetNode').className = 'topo-node node-ok';
        presetsContainer.innerHTML = `<span style="font-size:11px; color:var(--green);">✔️ System diagnostic fault cleared successfully</span>`;
      } else {
        term.innerHTML = "> Tracepath stopped: Hardware unreachable.\n> Recommendation: Check physical switchboard circuit infrastructure.";
        aiMsg.innerHTML = "Understood. Because power cycling the line failed to restore the hardware node link, there is a physical cable breakage or internal fuse drop. <b>I'll compile the system log history so you can open an active service ticket with support.</b>";
        presetsContainer.innerHTML = `<button class="chip" style="border-color:var(--red); color:#fff; background:var(--red)" onclick="alert('System logs compiled! Ticket dispatched to technical operations.')">Dispatch Logs to Support</button>`;
      }
    }

    chatSpace.appendChild(aiMsg);
    chatSpace.scrollTop = chatSpace.scrollHeight;
  }, 1200);
}
