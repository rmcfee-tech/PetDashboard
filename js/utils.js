// utils.js
// Small, pure, dependency-free helpers used across the app.
// No DOM access, no state access — keep this file trivially testable.

/** Generate a reasonably-unique id without external libraries. */
export function makeId(prefix = "id") {
  const rand = Math.random().toString(36).slice(2, 9);
  const time = Date.now().toString(36);
  return `${prefix}-${time}-${rand}`;
}

/** Debounce a function so rapid calls (e.g. typing) collapse to one. */
export function debounce(fn, waitMs = 400) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

/** ISO date string (YYYY-MM-DD) for "today", in local time. */
export function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

/** Format an ISO date string for display, e.g. "Jul 7, 2026". */
export function formatDate(isoString, options = {}) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric", ...options,
  });
}

/** Human age string from a birthday ISO date: "14 weeks", "1 yr 2 mo", etc. */
export function formatAge(birthdayISO, asOf = new Date()) {
  if (!birthdayISO) return "—";
  const birth = new Date(birthdayISO);
  if (Number.isNaN(birth.getTime())) return "—";
  const days = Math.floor((asOf - birth) / (1000 * 60 * 60 * 24));
  if (days < 0) return "—";
  if (days < 70) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const years = Math.floor(days / 365.25);
  const months = Math.floor((days % 365.25) / 30.44);
  if (years === 0) return `${months} month${months === 1 ? "" : "s"}`;
  return `${years} yr${years === 1 ? "" : "s"}${months ? ` ${months} mo` : ""}`;
}

/** Clamp a number between min and max. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Basic numeric validation used by form inputs. */
export function isValidNumber(value, { min, max } = {}) {
  const n = Number(value);
  if (Number.isNaN(n)) return false;
  if (min !== undefined && n < min) return false;
  if (max !== undefined && n > max) return false;
  return true;
}

/** Escape text for safe insertion into innerHTML. */
export function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Deep clone via structured algorithm (state snapshots, undo, etc.). */
export function deepClone(obj) {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

/** Sort a list of dated entries newest-first. */
export function byDateDesc(a, b) {
  return new Date(b.date) - new Date(a.date);
}
