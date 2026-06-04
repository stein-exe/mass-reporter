/** DOM helper — throws if the element is missing (page must include the id). */
function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Element #${id} not found`);
  }
  return el as T;
}

interface ApiOk {
  ok?: boolean;
  count?: number;
  error?: string;
}

interface ValidateSessionResult {
  index: number;
  preview: string;
  valid: boolean;
  username?: string | null;
  name?: string | null;
  error?: string;
}

interface ValidateSessionsResponse extends ApiOk {
  all_valid?: boolean;
  valid_count?: number;
  results?: ValidateSessionResult[];
}

interface ReportBatchResult {
  index: number;
  preview: string;
  ok: boolean;
  result: unknown;
}

interface ReportBatchResponse extends ApiOk {
  success_count?: number;
  report?: string;
  username?: string;
  results?: ReportBatchResult[];
}

interface ReportTypeEntry {
  id: string;
  label: string;
}

const sessionListEl = $<HTMLTextAreaElement>("sessionList");
const usernameEl = $<HTMLInputElement>("username");
const reportTypeEl = $<HTMLSelectElement>("reportType");
const retryOwnEl = $<HTMLInputElement>("retryOwn");
const proxyListEl = $<HTMLTextAreaElement>("proxyList");
const proxyOptionsEl = $<HTMLElement>("proxyOptions");
const validateOut = $<HTMLElement>("validateOut");
const reportOut = $<HTMLElement>("reportOut");
const proxySaveStatus = $<HTMLElement>("proxySaveStatus");
const sessionSaveStatus = $<HTMLElement>("sessionSaveStatus");
const reportGate = $<HTMLElement>("reportGate");
const btnReport = $<HTMLButtonElement>("btnReport");
const btnSaveSessions = $<HTMLButtonElement>("btnSaveSessions");
const btnValidate = $<HTMLButtonElement>("btnValidate");
const btnSaveProxies = $<HTMLButtonElement>("btnSaveProxies");

let sessionsReady = false;
let validatedSessionIds: string[] = [];

function proxyMode(): "yes" | "no" {
  const checked = document.querySelector<HTMLInputElement>(
    'input[name="proxyMode"]:checked'
  );
  return checked?.value === "yes" ? "yes" : "no";
}

function proxyFlags(): { proxies: boolean; retry_with_own_ip: boolean } {
  const useProxies = proxyMode() === "yes";
  return {
    proxies: useProxies,
    retry_with_own_ip: useProxies ? retryOwnEl.checked : true,
  };
}

function parseSessionLines(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

function setReportEnabled(enabled: boolean): void {
  sessionsReady = enabled;
  usernameEl.disabled = !enabled;
  reportTypeEl.disabled = !enabled;
  btnReport.disabled = !enabled;
  reportGate.classList.toggle("hidden", enabled);
}

async function post(
  name: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function showResult(
  el: HTMLElement,
  data: unknown,
  success?: boolean
): void {
  el.classList.remove("ok", "err");
  if (success === true) el.classList.add("ok");
  if (success === false) el.classList.add("err");
  el.textContent =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function formatValidateSummary(data: ValidateSessionsResponse): string {
  const lines: string[] = [];
  const total = data.count ?? 0;
  const ok = data.valid_count ?? 0;
  lines.push(`${ok}/${total} sessions valid\n`);
  for (const r of data.results ?? []) {
    const who = r.valid
      ? `@${r.username ?? "?"} (${r.name ?? ""})`
      : r.error
        ? `invalid — ${r.error}`
        : "invalid";
    lines.push(`  ${r.index}. ${r.preview} → ${who}`);
  }
  if (data.all_valid) {
    lines.push("\nAll sessions OK — you can report now.");
  } else {
    lines.push("\nFix invalid sessions before reporting.");
  }
  return lines.join("\n");
}

function formatReportSummary(data: ReportBatchResponse): string {
  const lines: string[] = [];
  lines.push(
    `${data.success_count ?? 0}/${data.count ?? 0} reports succeeded (${data.report} → @${data.username})\n`
  );
  for (const r of data.results ?? []) {
    const status = r.ok
      ? "OK"
      : typeof r.result === "string"
        ? r.result
        : JSON.stringify(r.result);
    lines.push(`  ${r.index}. ${r.preview} → ${status}`);
  }
  return lines.join("\n");
}

function updateProxyPanel(): void {
  proxyOptionsEl.classList.toggle("hidden", proxyMode() !== "yes");
}

document
  .querySelectorAll<HTMLInputElement>('input[name="proxyMode"]')
  .forEach((el) => {
    el.addEventListener("change", updateProxyPanel);
  });

async function loadReportTypes(): Promise<void> {
  const res = await fetch("/report_types");
  const data = (await res.json()) as { report_types: ReportTypeEntry[] };
  reportTypeEl.innerHTML = data.report_types
    .map((t) => `<option value="${t.id}">${t.label}</option>`)
    .join("");
}

async function loadSessions(): Promise<void> {
  const res = await fetch("/sessions");
  const data = (await res.json()) as { text?: string };
  if (data.text) {
    sessionListEl.value = data.text;
  }
}

async function saveSessions(): Promise<{
  ok: boolean;
  count?: number;
  message: string;
}> {
  const ids = parseSessionLines(sessionListEl.value);
  if (ids.length === 0) {
    return { ok: false, message: "Enter at least one session ID." };
  }
  const res = await post("save_sessions", { sessions: sessionListEl.value });
  if (isRecord(res) && res.ok === true) {
    const count = typeof res.count === "number" ? res.count : ids.length;
    return {
      ok: true,
      count,
      message: `Saved ${count} session(s) to sessions.txt`,
    };
  }
  return {
    ok: false,
    message: typeof res === "string" ? res : JSON.stringify(res),
  };
}

async function saveProxies(): Promise<{
  ok: boolean;
  count?: number;
  message: string;
}> {
  const text = proxyListEl.value.trim();
  if (!text) {
    return { ok: false, message: "Enter at least one proxy line." };
  }
  const res = await post("save_proxies", { proxies: proxyListEl.value });
  if (isRecord(res) && res.ok === true) {
    const count = typeof res.count === "number" ? res.count : 0;
    return {
      ok: true,
      count,
      message: `Saved ${count} proxy line(s) to proxies.txt`,
    };
  }
  return {
    ok: false,
    message: typeof res === "string" ? res : JSON.stringify(res),
  };
}

btnSaveSessions.addEventListener("click", async () => {
  sessionSaveStatus.classList.remove("ok", "err");
  sessionSaveStatus.textContent = "Saving…";
  const result = await saveSessions();
  sessionSaveStatus.textContent = result.message;
  sessionSaveStatus.classList.add(result.ok ? "ok" : "err");
  setReportEnabled(false);
  validatedSessionIds = [];
});

btnValidate.addEventListener("click", async () => {
  const ids = parseSessionLines(sessionListEl.value);
  if (ids.length === 0) {
    showResult(validateOut, "Enter at least one session ID.", false);
    setReportEnabled(false);
    return;
  }

  validateOut.textContent = `Validating ${ids.length} session(s)…`;
  validateOut.classList.remove("ok", "err");
  setReportEnabled(false);
  validatedSessionIds = [];

  await saveSessions();
  const data = await post("validate_sessions", {
    session_ids: ids,
    ...proxyFlags(),
  });

  if (!isRecord(data)) {
    showResult(validateOut, data, false);
    return;
  }

  const d = data as ValidateSessionsResponse;

  if (d.error && !(d.results?.length)) {
    showResult(validateOut, d.error, false);
    return;
  }

  showResult(validateOut, formatValidateSummary(d), d.all_valid === true);

  if (d.all_valid) {
    validatedSessionIds = ids;
    setReportEnabled(true);
  }
});

btnSaveProxies.addEventListener("click", async () => {
  proxySaveStatus.classList.remove("ok", "err");
  proxySaveStatus.textContent = "Saving…";
  const result = await saveProxies();
  proxySaveStatus.textContent = result.message;
  proxySaveStatus.classList.add(result.ok ? "ok" : "err");
});

sessionListEl.addEventListener("input", () => {
  if (sessionsReady) {
    setReportEnabled(false);
    validatedSessionIds = [];
  }
});

btnReport.addEventListener("click", async () => {
  const user = usernameEl.value.trim();
  const fn = reportTypeEl.value;
  const ids =
    validatedSessionIds.length > 0
      ? validatedSessionIds
      : parseSessionLines(sessionListEl.value);

  if (!sessionsReady || ids.length === 0) {
    showResult(reportOut, "Validate all sessions first.", false);
    return;
  }
  if (!user) {
    showResult(reportOut, "Username to report is required.", false);
    return;
  }
  if (!fn) {
    showResult(reportOut, "Select a report type.", false);
    return;
  }

  btnReport.disabled = true;
  reportOut.textContent = `Reporting with ${ids.length} session(s)…`;
  reportOut.classList.remove("ok", "err");

  try {
    if (proxyMode() === "yes" && proxyListEl.value.trim()) {
      const saved = await saveProxies();
      if (!saved.ok) {
        showResult(reportOut, saved.message, false);
        return;
      }
      proxySaveStatus.textContent = saved.message;
      proxySaveStatus.classList.add("ok");
    }

    const data = await post("report_batch", {
      report: fn,
      username: user,
      session_ids: ids,
      ...proxyFlags(),
    });

    if (!isRecord(data)) {
      showResult(reportOut, data, false);
      return;
    }

    const d = data as ReportBatchResponse;
    if (d.error && !(d.results?.length)) {
      showResult(reportOut, d.error, false);
      return;
    }

    const allOk = d.ok === true;
    reportOut.textContent = formatReportSummary(d);
    reportOut.classList.toggle("ok", allOk);
    reportOut.classList.toggle("err", !allOk);
  } finally {
    btnReport.disabled = !sessionsReady;
  }
});

void loadReportTypes();
void loadSessions();
updateProxyPanel();
setReportEnabled(false);
