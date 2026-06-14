const $ = (id) => document.getElementById(id);

/* ================================================================
   THEME ENGINE
   ================================================================ */
const THEME_KEYS = ['theme','font','radius','space','anim','accent','bg'];
const DEFAULTS = {
  theme: 'obsidian',
  font: 'editorial',
  radius: 'sharp',
  space: 'comfortable',
  anim: 'on',
  accent: '#d4a017',
  bg: 'off',
};

function loadSettings() {
  const s = {};
  for (const k of THEME_KEYS) s[k] = localStorage.getItem(`mr_${k}`) || DEFAULTS[k];
  return s;
}
function saveSettings(s) {
  for (const k of THEME_KEYS) localStorage.setItem(`mr_${k}`, s[k]);
}
function applySettings(s) {
  const b = document.body;
  b.className = `theme-${s.theme} font-${s.font} radius-${s.radius} space-${s.space} anim-${s.anim}`;
  if (s.bg === 'on') b.classList.add('bg-on');
  else b.classList.remove('bg-on');
  document.documentElement.style.setProperty('--accent', s.accent);

  const bgLayer = $('bgLayer');
  if (bgLayer) {
    bgLayer.className = 'bg-layer';
    if (s.bg === 'on') bgLayer.classList.add(`bg-${s.theme}`);
  }

  document.querySelectorAll('.tp-theme-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.theme === s.theme));
  document.querySelectorAll('.tp-font-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.font === s.font));
  document.querySelectorAll('.tp-radius-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.radius === s.radius));
  document.querySelectorAll('.tp-space-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.space === s.space));
  document.querySelectorAll('.tp-anim-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.anim === s.anim));
  document.querySelectorAll('.tp-bg-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.bg === s.bg));
  document.querySelectorAll('.tp-swatch').forEach((sw) => sw.classList.toggle('active', sw.dataset.color.toLowerCase() === s.accent.toLowerCase()));
  const hexEl = $('accentHex');
  if (hexEl) hexEl.value = s.accent;
}

function initThemePanel() {
  const panel = $('themePanel');
  const toggle = $('themeToggleBtn');
  const close = $('closeThemePanel');

  toggle.addEventListener('click', () => panel.classList.add('open'));
  close.addEventListener('click', () => panel.classList.remove('open'));
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== toggle) {
      panel.classList.remove('open');
    }
  });

  const settings = loadSettings();
  applySettings(settings);

  document.querySelectorAll('.tp-theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => { settings.theme = btn.dataset.theme; applySettings(settings); saveSettings(settings); });
  });
  document.querySelectorAll('.tp-font-btn').forEach((btn) => {
    btn.addEventListener('click', () => { settings.font = btn.dataset.font; applySettings(settings); saveSettings(settings); });
  });
  document.querySelectorAll('.tp-radius-btn').forEach((btn) => {
    btn.addEventListener('click', () => { settings.radius = btn.dataset.radius; applySettings(settings); saveSettings(settings); });
  });
  document.querySelectorAll('.tp-space-btn').forEach((btn) => {
    btn.addEventListener('click', () => { settings.space = btn.dataset.space; applySettings(settings); saveSettings(settings); });
  });
  document.querySelectorAll('.tp-anim-btn').forEach((btn) => {
    btn.addEventListener('click', () => { settings.anim = btn.dataset.anim; applySettings(settings); saveSettings(settings); });
  });
  document.querySelectorAll('.tp-bg-btn').forEach((btn) => {
    btn.addEventListener('click', () => { settings.bg = btn.dataset.bg; applySettings(settings); saveSettings(settings); });
  });
  document.querySelectorAll('.tp-swatch').forEach((sw) => {
    sw.addEventListener('click', () => { settings.accent = sw.dataset.color; applySettings(settings); saveSettings(settings); });
  });
  const hexEl = $('accentHex');
  if (hexEl) {
    hexEl.addEventListener('change', () => {
      let v = hexEl.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      if (/^#[0-9a-f]{6}$/i.test(v)) { settings.accent = v; applySettings(settings); saveSettings(settings); }
    });
  }
}

/* ================================================================
   SCROLL PROGRESS & BACK TO TOP
   ================================================================ */
function initScrollUI() {
  const bar = $('scrollProgress');
  const btt = $('backToTop');
  window.addEventListener('scroll', () => {
    const st = document.documentElement.scrollTop || document.body.scrollTop;
    const sh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    bar.style.width = (sh ? (st / sh) * 100 : 0) + '%';
    btt.classList.toggle('visible', st > 400);
  });
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ================================================================
   SIDEBAR & MOBILE & TABS
   ================================================================ */
function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.app-tab').forEach((t) => t.classList.remove('active'));
  const activeTab = $(`tab-${tab}`);
  if (activeTab) {
    activeTab.classList.add('active');
    staggerReveal(activeTab, tab);
  }
  $('appSidebar').classList.remove('open');
  $('mobileMenuToggle').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function staggerReveal(container, tabName) {
  let els = [];
  if (tabName === 'workflow') {
    els = Array.from(container.querySelectorAll('.stat-box, .step-box'));
    updateStats();
    updateConfigDisplay();
  } else if (tabName === 'proxies') {
    els = Array.from(container.querySelectorAll('.proxies-panel'));
  } else if (tabName === 'session-manager') {
    loadSessionData();
    els = Array.from(container.querySelectorAll('.session-panel, .session-table-wrap'));
  } else if (tabName === 'method') {
    els = Array.from(container.querySelectorAll('.method-sequence-box, .method-add-box'));
  } else if (tabName === 'console') {
    els = Array.from(container.querySelectorAll('.console-line, .console-placeholder'));
    if (!els.length) {
      const ph = container.querySelector('.console-placeholder');
      if (ph) els = [ph];
    }
  } else if (tabName === 'logs') {
    els = Array.from(container.querySelectorAll('.log-card'));
    if (!els.length) {
      const ph = container.querySelector('.feed-placeholder');
      if (ph) els = [ph];
    }
  } else if (tabName === 'manual' || tabName === 'help') {
    els = Array.from(container.querySelectorAll('.faq-item'));
  } else if (tabName === 'disclaimer' || tabName === 'credits') {
    els = Array.from(container.querySelectorAll('.plain-panel'));
  }

  els.forEach((el) => {
    el.classList.remove('visible');
    el.style.transition = 'none';
  });

  void container.offsetWidth;

  els.forEach((el, i) => {
    el.style.transition = '';
    setTimeout(() => el.classList.add('visible'), 55 * i);
  });
}

function initSidebar() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.link-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const mToggle = $('mobileMenuToggle');
  const sidebar = $('appSidebar');
  mToggle.addEventListener('click', () => {
    const open = mToggle.getAttribute('aria-expanded') === 'true';
    mToggle.setAttribute('aria-expanded', String(!open));
    sidebar.classList.toggle('open', !open);
  });
}

/* ================================================================
   SUPPORT POPOVER
   ================================================================ */
function initSupportPopover() {
  const fab = $('supportFab');
  const pop = $('supportPopover');
  const close = $('closeSupportPopover');
  if (!fab || !pop || !close) return;

  fab.addEventListener('click', () => {
    const hidden = pop.hasAttribute('hidden');
    if (hidden) pop.removeAttribute('hidden');
    else pop.setAttribute('hidden', '');
  });
  close.addEventListener('click', () => pop.setAttribute('hidden', ''));
  document.addEventListener('click', (e) => {
    if (!pop.hasAttribute('hidden') && !pop.contains(e.target) && e.target !== fab) {
      pop.setAttribute('hidden', '');
    }
  });
}

/* ================================================================
   COUNTERS
   ================================================================ */
function animateCounter(el, target, duration = 800) {
  const start = performance.now();
  const from = parseInt(el.textContent) || 0;
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * ease);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateStats() {
  const ids = {
    statSessions: sessionCount,
    statProxies: proxyCount,
    statValid: validCount,
    statReports: reportCount,
  };
  for (const [id, val] of Object.entries(ids)) {
    const el = $(id);
    if (el) animateCounter(el, val);
  }
}

/* ================================================================
   CONFIG DISPLAY
   ================================================================ */
function updateConfigDisplay() {
  const useProxies = $('useProxies').checked;
  const retryOwn = $('retryOwn').checked;

  const seq = methodSequence;
  const methodLabel = seq.length
    ? seq.map((s) => formatStepLabel(s)).join(' \u2192 ')
    : 'None';

  $('cfgProxies').textContent = useProxies ? 'On' : 'Off';
  $('cfgRetryRow').classList.toggle('hidden', !useProxies);
  $('cfgRetry').textContent = retryOwn ? 'Yes' : 'No';
  $('cfgSessions').textContent = String(sessionCount);
  $('cfgValid').textContent = String(validCount);
  $('cfgMethod').textContent = methodLabel;
  $('cfgSteps').textContent = String(seq.length);
  $('cfgThreads').textContent = String(getThreadCount());
  $('cfgProxyCount').textContent = String(proxyCount);

  // Update Workflow method display too
  const wfd = $('workflowMethodDisplay');
  if (wfd) {
    if (seq.length) {
      wfd.innerHTML = seq.map((s) => `<span class="method-mini-pill">${formatStepLabel(s)}</span>`).join('<span class="method-mini-arrow">\u2192</span>');
    } else {
      wfd.innerHTML = '<span class="method-placeholder">No method configured. Go to <button class="link-btn" data-tab="method">Method</button> to build one.</span>';
    }
  }
}

/* ================================================================
   API HELPERS
   ================================================================ */
async function post(name, body) {
  const res = await fetch(`/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const err =
      typeof data === 'object' && data !== null
        ? data.error || data.detail || JSON.stringify(data)
        : String(data);
    return { ok: false, valid: false, error: err || `HTTP ${res.status}` };
  }
  return data;
}

function parseLines(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

function dedupeTextarea(el) {
  const lines = parseLines(el.value);
  const seen = new Set();
  const out = [];
  for (const line of lines) { if (!seen.has(line)) { seen.add(line); out.push(line); } }
  el.value = out.join('\n');
}

function extractUsername(input) {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/instagram\.com\/([A-Za-z0-9._]+)/);
  if (m) return m[1].replace(/\/$/, '');
  return s.replace(/^@/, '').replace(/\/$/, '');
}

function pluralize(n, w) { return `${n} ${w}${n !== 1 ? 's' : ''}`; }

function previewSession(sid) {
  const s = (sid || '').trim();
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

/* ================================================================
   STATE
   ================================================================ */
let sessionCount = 0;
let proxyCount = 0;
let validCount = 0;
let reportCount = 0;
let sessionMap = {};
let logs = [];
let consoleLines = [];
let methodSequence = [];
let reportRunning = false;

/* ================================================================
   PROXY STATUS
   ================================================================ */
function updateProxyStatus() {
  const el = $('proxyStatus');
  const use = $('useProxies').checked;
  const count = proxyCount;
  if (el) {
    el.textContent = use ? `Proxies: On (${pluralize(count, 'proxy')} loaded)` : 'Proxies: Off';
    el.style.color = use ? 'var(--success)' : 'var(--text-muted)';
  }
  updateConfigDisplay();
}

/* ================================================================
   LOGS
   ================================================================ */
function loadLogs() {
  try {
    const raw = localStorage.getItem('mr_logs');
    if (raw) logs = JSON.parse(raw);
  } catch {}
  reportCount = logs.filter((l) => l.type === 'success' || l.type === 'error').length;
  renderLogs();
}
function saveLogs() {
  try { localStorage.setItem('mr_logs', JSON.stringify(logs.slice(-300))); } catch {}
}
function addLog(html, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  logs.push({ time, html, type });
  saveLogs();
  renderLogs();
}
function renderLogs() {
  const container = $('logsList');
  if (!container) return;
  if (!logs.length) {
    container.innerHTML = '<div class="feed-placeholder">No operations recorded yet. Execute a report to populate the log.</div>';
    return;
  }
  const recent = logs.slice(-24).reverse();
  container.innerHTML = recent.map((l) => {
    const sc = l.type === 'success' ? 'success' : l.type === 'error' ? 'error' : l.type === 'warn' ? 'warn' : 'info';
    const st = l.type === 'success' ? 'Success' : l.type === 'error' ? 'Failed' : l.type === 'warn' ? 'Warning' : 'Info';
    return `
      <div class="log-card">
        <div class="log-status ${sc}">${st} <span style="color:var(--text-muted);font-weight:400">\u2014 ${l.time}</span></div>
        <div class="log-body">${l.html}</div>
      </div>
    `;
  }).join('');
}

$('btnClearLogs').addEventListener('click', () => {
  logs = [];
  reportCount = 0;
  saveLogs();
  renderLogs();
  updateStats();
  updateConfigDisplay();
});

/* ================================================================
   CONSOLE (live reporting output)
   ================================================================ */
function appendConsole(html, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  consoleLines.push({ time, html, type });
  renderConsole();
  const wrap = $('consoleOutput');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

function renderConsole() {
  const container = $('consoleOutput');
  if (!container) return;
  if (!consoleLines.length) {
    container.innerHTML = '<div class="console-placeholder">No active run. Start reporting from Workflow to see live output here.</div>';
    return;
  }
  container.innerHTML = consoleLines.map((l) => {
    const cls = l.type === 'success' ? 'ok' : l.type === 'error' ? 'err' : l.type === 'warn' ? 'warn' : 'info';
    return `
      <div class="console-line ${cls}">
        <span class="console-time">${l.time}</span>
        <span class="console-body">${l.html}</span>
      </div>
    `;
  }).join('');
}

function clearConsole() {
  consoleLines = [];
  renderConsole();
}

function showReportAlert(message, type = 'err') {
  const el = $('reportAlert');
  if (!el) return;
  el.textContent = message;
  el.className = `report-alert ${type}`;
  el.classList.remove('hidden');
}

function hideReportAlert() {
  const el = $('reportAlert');
  if (!el) return;
  el.classList.add('hidden');
  el.textContent = '';
}

function getThreadCount() {
  const n = parseInt($('threadCount')?.value || '10', 10);
  return Math.max(1, Math.min(50, Number.isFinite(n) ? n : 10));
}

async function runTaskPool(tasks, concurrency, worker) {
  let cursor = 0;
  const limit = Math.min(concurrency, tasks.length) || 1;
  async function runWorker() {
    while (cursor < tasks.length) {
      const idx = cursor++;
      await worker(tasks[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, runWorker));
}

const REPORT_IDS_NEEDING_VICTIM = new Set(['report_impersonate']);

function formatStepLabel(step) {
  let text = `${step.count}x ${step.label}`;
  if (step.victim_username) text += ` (@${step.victim_username})`;
  return text;
}

function methodItemNeedsVictim(item) {
  return Boolean(item.needsVictim || REPORT_IDS_NEEDING_VICTIM.has(item.id));
}

function renderMethodItem(it) {
  if (methodItemNeedsVictim(it)) {
    return `
      <details class="method-item-expand">
        <summary>
          <span class="method-cat-arrow" aria-hidden="true">\u25B6</span>
          <span class="method-item-name">${it.label}</span>
        </summary>
        <div class="method-item-expand-body">
          <label class="method-victim-label">Victim username</label>
          <input
            type="text"
            class="method-victim-input"
            data-id="${it.id}"
            data-label="${it.label}"
            placeholder="username or @username"
            autocomplete="off"
            spellcheck="false"
          >
          <button type="button" class="method-item-btn method-item-add" data-id="${it.id}" data-label="${it.label}">
            Add to sequence
          </button>
        </div>
      </details>
    `;
  }
  return `
    <button type="button" class="method-item-btn" data-id="${it.id}" data-label="${it.label}">
      <span class="method-item-name">${it.label}</span>
    </button>
  `;
}

function validateReportInputs() {
  const target = extractUsername($('targetUser').value);
  const ids = parseLines($('sessionList').value);
  const seq = methodSequence;
  const errors = [];
  if (!target) errors.push('Enter a target username or Instagram link.');
  for (const step of seq) {
    if (REPORT_IDS_NEEDING_VICTIM.has(step.id) && !step.victim_username) {
      errors.push('An impersonation step is missing a victim username — re-add it in the Method tab.');
      break;
    }
  }
  if (!seq.length) errors.push('Configure a method sequence in the Method tab.');
  if (!ids.length) errors.push('Add and validate at least one session.');
  return { ok: errors.length === 0, errors, target, ids, seq };
}

$('btnClearConsole')?.addEventListener('click', clearConsole);

function normalizeIgUsername(raw) {
  return String(raw || '').trim().replace(/^@+/, '');
}

function setSessionStatus(el, message, type) {
  if (!el) return;
  if (!message) {
    el.textContent = '';
    el.className = 'session-status hidden';
    return;
  }
  el.textContent = message;
  el.className = `session-status ${type}`;
}

function initIgLoginField() {
  const userEl = $('igLoginUser');
  if (!userEl) return;
  userEl.addEventListener('input', () => {
    const cleaned = normalizeIgUsername(userEl.value);
    if (userEl.value !== cleaned) userEl.value = cleaned;
  });
  userEl.addEventListener('blur', () => {
    userEl.value = normalizeIgUsername(userEl.value);
  });
}

/* ================================================================
   SESSION MANAGER
   ================================================================ */
async function loadSessionData() {
  const data = await fetch('/session_data').then((r) => r.json());
  renderSessionTable(data.sessions || []);
}

function renderSessionTable(sessions) {
  const tbody = $('sessionTableBody');
  const empty = $('sessionTableEmpty');
  if (!tbody || !empty) return;

  if (!sessions.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = sessions.map((s) => {
    const sid = s.session || '';
    const user = s.username || '';
    const name = s.name || '';
    const userLink = user ? `<a href="https://instagram.com/${encodeURIComponent(user)}" target="_blank" rel="noopener noreferrer">@${user}</a>` : '<span style="color:var(--text-muted)">\u2014</span>';
    return `
      <tr data-sid="${sid}">
        <td class="sid">${previewSession(sid)}</td>
        <td>${userLink}</td>
        <td>${name || '<span style="color:var(--text-muted)">\u2014</span>'}</td>
        <td><button class="btn-remove" data-sid="${sid}">Remove</button></td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-remove').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sid = btn.dataset.sid;
      btn.textContent = '...';
      btn.disabled = true;
      const res = await post('remove_session', { session: sid });
      if (res && res.ok) {
        addLog(`Removed session ${previewSession(sid)}`, 'info');
        loadSessionData();
        loadSessions();
      } else {
        btn.textContent = 'Remove';
        btn.disabled = false;
      }
    });
  });
}

$('btnAddSession').addEventListener('click', async () => {
  const sid = $('newSessionId').value.trim();
  const status = $('addSessionStatus');

  if (!sid) {
    setSessionStatus(status, 'Session ID is required.', 'err');
    return;
  }

  // Deduplicate — check if already in the table
  const existingRow = document.querySelector(`#sessionTableBody tr[data-sid="${sid}"]`);
  if (existingRow) {
    setSessionStatus(status, 'Session already exists.', 'err');
    return;
  }

  setSessionStatus(status, 'Validating session…', 'info');

  const v = await post('validate_sessionid', {
    session_id: sid,
    sessionid: sid,
  });

  if (!v || !v.valid) {
    setSessionStatus(status, v?.error ? `Invalid: ${v.error}` : 'Invalid session ID.', 'err');
    addLog(`Add failed — invalid session ${previewSession(sid)}`, 'error');
    return;
  }

  setSessionStatus(status, 'Adding…', 'info');
  const res = await post('add_session', {
    session: sid,
    session_id: sid,
    sessionid: sid,
    username: v.username || '',
    name: v.name || '',
  });

  if (res && res.ok) {
    $('newSessionId').value = '';
    setSessionStatus(status, `Session added for @${v.username || '?'}.`, 'ok');
    addLog(`Added session ${previewSession(sid)} → @${v.username || '?'}`, 'info');
    loadSessionData();
    loadSessions();
  } else {
    setSessionStatus(status, res?.error || 'Failed to add session.', 'err');
  }
});

$('btnIgLogin').addEventListener('click', async () => {
  const igUser = normalizeIgUsername($('igLoginUser').value);
  $('igLoginUser').value = igUser;
  const password = $('igLoginPass').value || '';
  const status = $('igLoginStatus');
  const btn = $('btnIgLogin');

  if (!igUser || !password) {
    setSessionStatus(status, 'Enter your plain username (no @) and password.', 'err');
    return;
  }

  btn.disabled = true;
  setSessionStatus(status, 'Logging in to Instagram…', 'info');

  const res = await post('stein_login', { username: igUser, password });

  btn.disabled = false;

  if (!res || !res.ok) {
    const msg =
      res?.error ||
      (res?.reason === 'bad_credentials'
        ? 'Wrong username or password.'
        : 'Login failed. Try again or paste a session ID.');
    setSessionStatus(status, msg, 'err');
    addLog(`Instagram login failed for ${igUser}: ${msg}`, 'error');
    return;
  }

  $('igLoginPass').value = '';
  const who = res.username || igUser;
  setSessionStatus(
    status,
    `Session obtained for @${who}. Added to vault${res.name ? ` (${res.name})` : ''}.`,
    'ok'
  );
  addLog(`Session obtained via login for @${who}`, 'info');
  loadSessionData();
  loadSessions();
});

/* ================================================================
   SESSIONS (Workflow)
   ================================================================ */
async function loadSessions() {
  const data = await fetch('/sessions').then((r) => r.json());
  if (data.text) { $('sessionList').value = data.text; sessionCount = parseLines(data.text).length; }
}
async function saveSessions() {
  dedupeTextarea($('sessionList'));
  const res = await post('save_sessions', { sessions: $('sessionList').value });
  if (res && res.ok) {
    $('sessionSaveStatus').textContent = `${pluralize(res.count, 'session')} saved`;
    $('sessionSaveStatus').className = 'hint ok';
    sessionCount = res.count;
    addLog(`${pluralize(res.count, 'session')} saved`, 'info');
    updateStats();
    updateConfigDisplay();
  } else {
    $('sessionSaveStatus').textContent = 'Save failed';
    $('sessionSaveStatus').className = 'hint err';
  }
}
async function validateSessions() {
  dedupeTextarea($('sessionList'));
  const ids = parseLines($('sessionList').value);
  if (!ids.length) {
    $('sessionSaveStatus').textContent = 'Enter at least one session ID.';
    $('sessionSaveStatus').className = 'hint err';
    $('validateResult').classList.add('hidden');
    return;
  }
  $('sessionSaveStatus').textContent = `Validating ${pluralize(ids.length, 'session')}\u2026`;
  $('sessionSaveStatus').className = 'hint';
  $('validateResult').classList.add('hidden');
  sessionMap = {};
  validCount = 0;

  await saveSessions();
  const data = await post('validate_sessions', {
    session_ids: ids,
    proxies: $('useProxies').checked,
    retry_with_own_ip: $('retryOwn').checked,
  });

  if (!data || !data.results) {
    $('sessionSaveStatus').textContent = 'Validation failed.';
    $('sessionSaveStatus').className = 'hint err';
    addLog('Session validation failed.', 'error');
    return;
  }

  const validIds = [];
  let ok = 0, bad = 0;
  for (const r of data.results) {
    const sid = ids[r.index - 1];
    if (r.valid) { ok++; validIds.push(sid); sessionMap[sid] = { username: r.username || '?', name: r.name || '?' }; }
    else { bad++; }
  }
  validCount = ok;
  sessionCount = validIds.length;

  $('sessionList').value = validIds.join('\n');
  await saveSessions();

  $('vrTotal').textContent = String(ids.length);
  $('vrValid').textContent = String(ok);
  $('vrInvalid').textContent = String(bad);
  $('validateResult').classList.remove('hidden');
  $('sessionSaveStatus').textContent = `${pluralize(ok, 'valid session')}, ${pluralize(bad, 'invalid session')}. Invalid removed.`;
  $('sessionSaveStatus').className = ok > 0 ? 'hint ok' : 'hint err';
  addLog(`${pluralize(ok, 'valid session')}, ${pluralize(bad, 'invalid session')}. Invalid removed.`, 'info');
  updateStats();
  updateConfigDisplay();
  loadSessionData(); // refresh Session Manager table with new metadata
}

$('btnSaveSessions').addEventListener('click', saveSessions);
$('btnValidate').addEventListener('click', validateSessions);

/* ================================================================
   PROXIES
   ================================================================ */
async function loadProxies() {
  const data = await fetch('/proxies').then((r) => r.json());
  if (data.text) { $('proxyList').value = data.text; proxyCount = parseLines(data.text).length; }
}
async function saveProxies() {
  dedupeTextarea($('proxyList'));
  const res = await post('save_proxies', { proxies: $('proxyList').value });
  if (res && res.ok) {
    $('proxySaveStatus').textContent = `${pluralize(res.count, 'proxy line')} saved`;
    $('proxySaveStatus').className = 'hint ok';
    proxyCount = res.count;
    addLog(`${pluralize(res.count, 'proxy line')} saved`, 'info');
    updateProxyStatus();
    updateStats();
  } else {
    $('proxySaveStatus').textContent = 'Save failed';
    $('proxySaveStatus').className = 'hint err';
  }
}
$('btnSaveProxies').addEventListener('click', saveProxies);

/* ================================================================
   PROXY TOGGLE
   ================================================================ */
function updateProxyToggle() {
  const use = $('useProxies').checked;
  $('retryWrap').classList.toggle('hidden', !use);
  updateProxyStatus();
}
$('useProxies').addEventListener('change', updateProxyToggle);
$('retryOwn').addEventListener('change', updateConfigDisplay);
$('threadCount')?.addEventListener('input', updateConfigDisplay);

/* ================================================================
   METHOD BUILDER
   ================================================================ */
const REPORT_CATEGORIES = [
  {
    title: 'Spam',
    items: [
      { id: 'reportspam', label: 'Report account as spam' },
    ],
  },
  {
    title: 'Bullying / harassment',
    items: [
      { id: 'report_threatingtosharenudes', label: 'Threatening to share nude images' },
      { id: 'report_bully_me', label: 'Harassment \u2014 directed at me' },
      { id: 'report_bully_afriend', label: 'Harassment \u2014 directed at a friend' },
      { id: 'reportbully_spam', label: 'Annoying or spam (misleading/annoying category)' },
    ],
  },
  {
    title: 'Self-harm',
    items: [
      { id: 'selfharm', label: 'Suicide or self-injury concern' },
      { id: 'report_eatingdisorder', label: 'Eating disorder concern' },
    ],
  },
  {
    title: 'Violence / hate / exploitation',
    items: [
      { id: 'report_credible_threat_to_safety', label: 'Credible threat to safety' },
      { id: 'report_terrisom', label: 'Terrorism or organized crime' },
      { id: 'report_human_trafficking', label: 'Human trafficking' },
      { id: 'report_sexual_exploitation', label: 'Sexual exploitation' },
      { id: 'report_hate', label: 'Hate speech or symbols' },
      { id: 'report_calling_for_violence', label: 'Calling for violence' },
      { id: 'report_death_or_sever_injury', label: 'Violence \u2014 death or severe injury' },
      { id: 'report_animal_abuse', label: 'Animal abuse' },
    ],
  },
  {
    title: 'Restricted items / selling',
    items: [
      { id: 'reprort_drugv1', label: 'Drugs \u2014 high risk' },
      { id: 'reprort_drugv2', label: 'Drugs \u2014 prescription' },
      { id: 'reprort_drugv3', label: 'Drugs \u2014 other' },
      { id: 'report_weapon', label: 'Weapons' },
      { id: 'report_selling_animals', label: 'Selling animals' },
      { id: 'report_selling_gambling', label: 'Gambling' },
      { id: 'report_selling_alchohol', label: 'Alcohol' },
      { id: 'report_selling_tobocco', label: 'Tobacco' },
    ],
  },
  {
    title: 'Nudity / sexual content',
    items: [
      { id: 'report_nudity_threatining_toshare_nude', label: 'Threatening to share nude images' },
      { id: 'report_prostitution', label: 'Prostitution' },
      { id: 'report_nudity_explotion', label: 'Sexual exploitation (nudity flow)' },
      { id: 'report_nudity_sexual_activity', label: 'Nudity or sexual activity' },
    ],
  },
  {
    title: 'Account integrity',
    items: [
      { id: 'report_impersonate', label: 'Impersonation', needsVictim: true },
    ],
  },
  {
    title: 'Scam / fraud',
    items: [
      { id: 'report_scam_financial', label: 'Financial / investment scam' },
      { id: 'report_scam_identity_theft', label: 'Identity theft' },
      { id: 'report_scam_sellingfakegoods', label: 'Fake goods or services' },
      { id: 'report_scam_emotional_threat', label: 'Physical threats (scam flow)' },
      { id: 'report_scam_suspicious_contact', label: 'Suspicious contact' },
      { id: 'report_scam_suspicious_links', label: 'Suspicious links' },
    ],
  },
];

function loadMethodSequence() {
  try {
    const raw = localStorage.getItem('mr_method');
    if (raw) methodSequence = JSON.parse(raw);
  } catch {}
}
function saveMethodSequence() {
  try { localStorage.setItem('mr_method', JSON.stringify(methodSequence)); } catch {}
}

function renderMethodCategories() {
  const container = $('methodCategories');
  if (!container) return;
  container.innerHTML = REPORT_CATEGORIES.map((cat) => `
    <details class="method-cat">
      <summary><span class="method-cat-arrow" aria-hidden="true">\u25B6</span>${cat.title}</summary>
      <div class="method-cat-body">
        ${cat.items.map((it) => renderMethodItem(it)).join('')}
      </div>
    </details>
  `).join('');

  container.querySelectorAll('.method-item-btn:not(.method-item-add)').forEach((btn) => {
    btn.addEventListener('click', () => {
      addMethodStep(btn.dataset.id, btn.dataset.label);
    });
  });

  container.querySelectorAll('.method-item-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const body = btn.closest('.method-item-expand-body');
      const input = body?.querySelector('.method-victim-input');
      const victim = extractUsername(input?.value || '');
      const status = $('methodStatus');
      if (!victim) {
        if (status) {
          status.textContent = 'Enter the victim username (with or without @).';
          status.className = 'hint err';
        }
        input?.focus();
        return;
      }
      addMethodStep(btn.dataset.id, btn.dataset.label, victim);
      if (input) input.value = '';
    });
  });

  container.querySelectorAll('.method-victim-input').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.closest('.method-item-expand-body')?.querySelector('.method-item-add')?.click();
      }
    });
  });

  container.querySelectorAll('.method-cat, .method-item-expand').forEach((details) => {
    const arrow = details.querySelector(':scope > summary .method-cat-arrow');
    if (!arrow) return;
    details.addEventListener('toggle', () => {
      arrow.textContent = details.open ? '\u25BC' : '\u25B6';
    });
  });
}

function toggleMethodCategories() {
  const container = $('methodCategories');
  const hint = $('methodCategoriesHint');
  const countEl = $('methodCount');
  const count = parseInt(countEl?.value || '0', 10);
  if (count >= 1) {
    container.classList.remove('hidden');
    if (hint) hint.classList.add('hidden');
  } else {
    container.classList.add('hidden');
    if (hint) hint.classList.remove('hidden');
  }
}

function renderMethodSequence() {
  const display = $('methodSequenceDisplay');
  if (!display) return;
  if (!methodSequence.length) {
    display.innerHTML = '<span class="method-placeholder">No steps yet. Add a report below.</span>';
    return;
  }
  display.innerHTML = methodSequence.map((s, i) => `
    <span class="method-pill">
      <b>${s.count}x</b> ${s.label}${s.victim_username ? ` <span class="method-victim">(@${s.victim_username})</span>` : ''}
      <button class="method-pill-remove" data-idx="${i}" aria-label="Remove step">\u00D7</button>
    </span>
  `).join('<span class="method-arrow">\u2192</span>');

  display.querySelectorAll('.method-pill-remove').forEach((btn) => {
    btn.addEventListener('click', () => removeMethodStep(parseInt(btn.dataset.idx)));
  });
}

function addMethodStep(id, label, victimUsername = '') {
  const countEl = $('methodCount');
  const count = Math.max(1, Math.min(99, parseInt(countEl?.value || '1', 10)));
  const status = $('methodStatus');
  const victim = extractUsername(victimUsername || '');

  if (methodSequence.length) {
    const last = methodSequence[methodSequence.length - 1];
    const sameVictim = !REPORT_IDS_NEEDING_VICTIM.has(id) || last.victim_username === victim;
    if (last.id === id && sameVictim) {
      if (status) {
        status.textContent = 'Cannot add the same report consecutively. Pick a different one.';
        status.className = 'hint err';
      }
      return;
    }
  }

  const step = { id, label, count };
  if (REPORT_IDS_NEEDING_VICTIM.has(id)) {
    if (!victim) {
      if (status) {
        status.textContent = 'Victim username is required for impersonation.';
        status.className = 'hint err';
      }
      return;
    }
    step.victim_username = victim;
  }

  methodSequence.push(step);
  saveMethodSequence();
  renderMethodSequence();
  updateConfigDisplay();
  if (status) {
    const victimNote = step.victim_username ? ` (@${step.victim_username})` : '';
    status.textContent = `Added ${count}x ${label}${victimNote}.`;
    status.className = 'hint ok';
  }
}

function removeMethodStep(idx) {
  methodSequence.splice(idx, 1);
  saveMethodSequence();
  renderMethodSequence();
  updateConfigDisplay();
}

function clearMethodSequence() {
  methodSequence = [];
  saveMethodSequence();
  renderMethodSequence();
  updateConfigDisplay();
  const status = $('methodStatus');
  if (status) { status.textContent = 'Sequence cleared.'; status.className = 'hint'; }
}

$('btnClearSequence').addEventListener('click', clearMethodSequence);
$('btnDoneSequence').addEventListener('click', () => {
  const status = $('methodStatus');
  if (!methodSequence.length) {
    if (status) { status.textContent = 'Build a sequence first.'; status.className = 'hint err'; }
    return;
  }
  if (status) { status.textContent = 'Method saved. Switch to Workflow to execute.'; status.className = 'hint ok'; }
  updateConfigDisplay();
});

$('methodCount').addEventListener('input', toggleMethodCategories);

/* ================================================================
   FETCH INFO
   ================================================================ */
function showUserPfp(info) {
  const pfpWrap = $('pfpWrap');
  const pfpEl = $('userPfp');
  const initialsEl = $('pfpInitials');
  if (!pfpWrap || !pfpEl) return;

  const username = info.username || '?';
  const initials = (info.full_name || username).replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?';

  pfpEl.classList.remove('visible');
  pfpEl.style.display = 'none';
  pfpEl.src = '';
  if (initialsEl) {
    initialsEl.textContent = initials;
    initialsEl.classList.add('hidden');
  }

  const pfpUrl = info.profile_pic && info.profile_pic !== 'N/A' ? info.profile_pic : '';
  const proxySrc =
    username && username !== '?' && pfpUrl
      ? `/profile_pic?username=${encodeURIComponent(username)}`
      : '';

  if (proxySrc) {
    pfpEl.referrerPolicy = 'no-referrer';
    pfpEl.onload = () => {
      pfpEl.style.display = 'block';
      pfpEl.classList.add('visible');
      if (initialsEl) initialsEl.classList.add('hidden');
    };
    pfpEl.onerror = () => {
      pfpEl.style.display = 'none';
      pfpEl.classList.remove('visible');
      if (initialsEl) {
        initialsEl.textContent = initials;
        initialsEl.classList.remove('hidden');
      }
    };
    pfpEl.src = proxySrc;
  } else if (initialsEl) {
    initialsEl.textContent = initials;
    initialsEl.classList.remove('hidden');
  }
}

$('btnFetchInfo').addEventListener('click', async () => {
  const user = extractUsername($('targetUser').value);
  if (!user) {
    $('userInfo').classList.add('hidden');
    showReportAlert('Enter a username or Instagram link to fetch.', 'err');
    return;
  }
  hideReportAlert();

  $('userInfo').classList.remove('hidden');
  $('userName').textContent = 'Loading...';
  $('userName').style.color = '';
  $('userFullName').textContent = '';
  $('userMeta1').textContent = '';
  $('userMeta2').textContent = '';
  $('userMeta3').textContent = '';
  showUserPfp({ username: user, full_name: user, profile_pic: '' });

  const info = await post('instagram_info', { username: user });

  if (!info || info.error) {
    $('userName').textContent = `Error: ${info?.error || 'Failed to fetch'}`;
    $('userName').style.color = 'var(--error)';
    addLog(`Fetch info failed for @${user}: ${info?.error || 'unknown'}`, 'error');
    return;
  }
  addLog(`Fetched info for @${info.username}`, 'info');
  $('userName').style.color = '';
  showUserPfp(info);

  $('userName').textContent = `@${info.username}${info.is_verified ? ' \u2713' : ''}`;
  $('userFullName').textContent = info.full_name && info.full_name !== 'N/A' ? info.full_name : '';
  $('userMeta1').textContent = `ID: ${info.id} \u00B7 Year: ${info.year}`;
  $('userMeta2').textContent = `Followers: ${info.followers} \u00B7 Following: ${info.following} \u00B7 Posts: ${info.posts}`;
  $('userMeta3').textContent = `${info.is_private ? 'Private' : 'Public'} \u00B7 ${info.is_business ? 'Business' : info.is_professional ? 'Professional' : 'Personal'}`;
});

/* ================================================================
   REPORTING
   ================================================================ */
async function doReport() {
  if (reportRunning) return;

  const check = validateReportInputs();
  if (!check.ok) {
    showReportAlert(check.errors.join(' '), 'err');
    return;
  }
  hideReportAlert();

  const { target, ids, seq } = check;
  const threads = getThreadCount();
  const proxyOpts = {
    proxies: $('useProxies').checked,
    retry_with_own_ip: $('retryOwn').checked,
  };

  const tasks = [];
  for (let si = 0; si < ids.length; si++) {
    const sid = ids[si];
    for (const step of seq) {
      for (let c = 0; c < step.count; c++) {
        tasks.push({
          sessionIndex: si + 1,
          sessionId: sid,
          reportId: step.id,
          reportLabel: step.label,
          victimUsername: step.victim_username || '',
        });
      }
    }
  }

  reportRunning = true;
  $('btnStartReport').disabled = true;
  $('btnStartReport').textContent = 'Running...';

  clearConsole();
  switchTab('console');

  const seqSummary = seq.map((s) => formatStepLabel(s)).join(' \u2192 ');
  appendConsole(
    `<strong>Starting</strong> ${seqSummary} against <span class="target">@${target}</span> \u00B7 ${pluralize(ids.length, 'session')} \u00B7 ${threads} thread${threads !== 1 ? 's' : ''} \u00B7 ${pluralize(tasks.length, 'job')}`,
    'info'
  );

  let ok = 0;
  let fail = 0;

  await runTaskPool(tasks, threads, async (task) => {
    const meta = sessionMap[task.sessionId];
    const reporter = meta?.username || previewSession(task.sessionId);
    const victimNote = task.victimUsername ? ` <span class="by">impersonating @${task.victimUsername}</span>` : '';
    appendConsole(
      `[${task.sessionIndex}/${ids.length}] <span class="by">${task.reportLabel}</span>${victimNote} \u2192 @${target} <span class="by">via</span> @${reporter} <span class="by">\u2026</span>`,
      'info'
    );

    const postBody = {
      username: target,
      sessionid: task.sessionId,
      ...proxyOpts,
    };
    if (task.victimUsername) {
      postBody.victim_username = task.victimUsername;
    }

    const result = await post(task.reportId, postBody);

    const success = result === true;
    const line = `[${task.sessionIndex}/${ids.length}] <span class="target">@${target}</span> <span class="by">[${task.reportLabel}]</span> <span class="by">by</span> <span class="reporter">@${reporter}</span>`;

    if (success) {
      ok++;
      reportCount++;
      appendConsole(`${line} <span class="ok-tag">OK</span>`, 'success');
    } else {
      fail++;
      const err = typeof result === 'string' ? result : (result?.error || JSON.stringify(result));
      appendConsole(`${line} <span class="err-tag">${err}</span>`, 'error');
    }
    updateStats();
  });

  appendConsole(
    `<strong>Finished.</strong> ${ok} succeeded, ${fail} failed (${tasks.length} total).`,
    fail === 0 ? 'success' : 'warn'
  );
  addLog(`Report run finished: ${ok}/${tasks.length} succeeded against @${target}`, fail === 0 ? 'success' : 'warn');

  reportRunning = false;
  $('btnStartReport').disabled = false;
  $('btnStartReport').textContent = 'Start Reporting';
  updateConfigDisplay();
}

$('btnStartReport').addEventListener('click', doReport);

/* ================================================================
   INIT
   ================================================================ */
function init() {
  initThemePanel();
  initScrollUI();
  initSidebar();
  initSupportPopover();
  initIgLoginField();
  loadMethodSequence();
  renderMethodCategories();
  toggleMethodCategories();
  renderMethodSequence();
  loadSessions().then(() => {
    loadProxies().then(() => {
      updateProxyStatus();
      updateStats();
      updateConfigDisplay();
    });
  });
  loadLogs();
  loadSessionData();
  updateProxyToggle();
  staggerReveal($('tab-workflow'), 'workflow');
}

init();
