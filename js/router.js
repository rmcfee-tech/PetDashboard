// router.js
// Minimal hash-based router. No history-API complexity needed since this
// is a single-file-opened, no-backend app — hash routes work identically
// whether launched from a server, file://, or as an installed PWA.

const routes = new Map(); // path -> render(container) function
let container = null;
let currentPath = null;

export const PAGES = [
  { path: "dashboard", label: "Dashboard", icon: "home" },
  { path: "profile", label: "Profile", icon: "paw" },
  { path: "health", label: "Health", icon: "heart" },
  { path: "training", label: "Training", icon: "target" },
  { path: "grooming", label: "Grooming", icon: "scissors" },
  { path: "schedule", label: "Schedule", icon: "calendar" },
  { path: "expenses", label: "Expenses", icon: "dollar" },
  { path: "journal", label: "Journal", icon: "book" },
  { path: "cat", label: "Cat", icon: "paw" },
  { path: "daughter", label: "Daughter", icon: "person" },
  { path: "development", label: "Development", icon: "target" },
  { path: "photos", label: "Photos", icon: "image" },
  { path: "reports", label: "Reports", icon: "document" },
  { path: "settings", label: "Settings", icon: "gear" },
];

/** Register a render function for a route path (called by each ui/*.js module). */
export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

/** Initialize the router against a container element. */
export function initRouter(containerEl) {
  container = containerEl;
  window.addEventListener("hashchange", () => renderCurrentRoute());
  renderCurrentRoute();
}

export function getCurrentPath() {
  return currentPath;
}

export function navigateTo(path) {
  if (window.location.hash === `#/${path}`) {
    renderCurrentRoute(); // re-render even if hash unchanged (e.g. re-tap nav)
    return;
  }
  window.location.hash = `#/${path}`;
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  return raw || "dashboard";
}

function renderCurrentRoute() {
  const path = parseHash();
  const renderFn = routes.get(path) || routes.get("dashboard");
  currentPath = routes.has(path) ? path : "dashboard";
  if (!container) return;
  container.innerHTML = "";
  renderFn?.(container);
  container.scrollTop = 0;
  window.dispatchEvent(new CustomEvent("route:changed", { detail: { path: currentPath } }));
}
