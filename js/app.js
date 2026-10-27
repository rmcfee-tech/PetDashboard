// app.js
// Boot sequence for the whole app. Responsibilities:
//   1. Load persisted UI theme.
//   2. Load pet data (bundled sample on first run).
//   3. Register all page routes (each ui/*.js self-registers on import).
//   4. Render the app shell (sidebar, bottom nav, header) and start the router.
//   5. Wire the FAB to Quick Add and register the service worker.

import { initTheme } from "./theme.js";
import { loadInitial, scheduleAutosave } from "./storage.js";
import { on } from "./state.js";
import { initRouter, PAGES, getCurrentPath } from "./router.js";
import { renderSidebar, renderBottomNav, bindNavActiveSync } from "./ui/nav.js";
import { openQuickAdd } from "./ui/quickAdd.js";
import { initSyncBanners } from "./ui/syncBanner.js";
import { icon } from "./ui/icons.js";

// Import every page module for its side-effecting registerRoute() call.
import "./ui/dashboard.js";
import "./ui/profile.js";
import "./ui/health.js";
import "./ui/training.js";
import "./ui/grooming.js";
import "./ui/schedule.js";
import "./ui/expenses.js";
import "./ui/journal.js";
import "./ui/cat.js";
import "./ui/daughter.js";
import "./ui/development.js";
import "./ui/photos.js";
import "./ui/reports.js";
import "./ui/settings.js";

async function boot() {
  initTheme();

  const app = document.getElementById("app");
  app.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <aside class="sidebar" id="sidebar" aria-label="Sidebar navigation"></aside>
    <div class="main">
      <header class="header">
        <div class="header__title" id="header-title">Pet Dashboard</div>
        <div class="header__actions">
          <button class="icon-btn" id="theme-quick-toggle" aria-label="Toggle dark mode">${icon("moon")}</button>
        </div>
      </header>
      <main class="content" id="main-content" tabindex="-1"></main>
    </div>
    <nav class="bottom-nav" id="bottom-nav" aria-label="Bottom navigation"></nav>
    <button class="fab" id="fab" aria-label="Quick add">${icon("plus", { size: 26 })}</button>
  `;

  const sidebarEl = document.getElementById("sidebar");
  const bottomNavEl = document.getElementById("bottom-nav");
  renderSidebar(sidebarEl);
  renderBottomNav(bottomNavEl);
  bindNavActiveSync(sidebarEl, bottomNavEl);

  initSyncBanners();
  await loadInitial();

  const contentEl = document.getElementById("main-content");
  initRouter(contentEl);

  // Keep header title in sync with the active page.
  const headerTitle = document.getElementById("header-title");
  window.addEventListener("route:changed", (e) => {
    const page = PAGES.find((p) => p.path === e.detail.path);
    headerTitle.textContent = page ? page.label : "Pet Dashboard";
  });
  headerTitle.textContent = PAGES.find((p) => p.path === getCurrentPath())?.label || "Dashboard";

  document.getElementById("fab").addEventListener("click", () => openQuickAdd());

  // Any state change (from Quick Add, forms, etc.) triggers autosave when a
  // file handle is active, and re-renders the current page.
  on("state:changed", () => {
    scheduleAutosave();
    const active = document.querySelector(`.nav-item.is-active, .bottom-nav__item.is-active`);
    // Re-render current route so cards reflect the latest state.
    window.dispatchEvent(new Event("hashchange"));
  });

  document.getElementById("theme-quick-toggle").addEventListener("click", async () => {
    const { getTheme, applyTheme } = await import("./theme.js");
    const current = getTheme();
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  });

  registerServiceWorker();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Register immediately rather than waiting for the "load" event: boot()
  // does async work (loading pet data) before reaching this point, so by
  // then "load" may already have fired and a listener would never run.
  navigator.serviceWorker.register("sw.js").catch((err) => {
    console.error("Service worker registration failed:", err);
  });
}

boot();
