// ui/nav.js
// Renders the desktop sidebar and mobile bottom nav, and keeps the
// "is-active" state in sync with the router. Bottom nav shows the 5 most
// used sections; everything else is reachable via "More".

import { PAGES, navigateTo, getCurrentPath } from "../router.js";
import { icon } from "./icons.js";

const BOTTOM_NAV_PRIMARY = ["dashboard", "health", "schedule", "journal"];

export function renderSidebar(el) {
  el.innerHTML = `
    <div class="sidebar__brand">
      <span aria-hidden="true">${icon("paw", { size: 24 })}</span>
      <span>Pet Dashboard</span>
    </div>
    <nav class="sidebar__nav" aria-label="Main navigation">
      ${PAGES.map((p) => navItemHtml(p)).join("")}
    </nav>
  `;
  el.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => navigateTo(btn.dataset.path));
  });
  syncActive(el, ".nav-item");
}

export function renderBottomNav(el) {
  const items = [
    ...PAGES.filter((p) => BOTTOM_NAV_PRIMARY.includes(p.path)),
    { path: "more", label: "More", icon: "more" },
  ];
  el.innerHTML = items
    .map(
      (p) => `
      <button class="bottom-nav__item" data-path="${p.path}" aria-label="${p.label}">
        ${icon(p.icon, { size: 22 })}
        <span>${p.label}</span>
      </button>`
    )
    .join("");
  el.querySelectorAll(".bottom-nav__item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.path === "more") {
        openMoreSheet();
      } else {
        navigateTo(btn.dataset.path);
      }
    });
  });
  syncActive(el, ".bottom-nav__item");
}

function navItemHtml(page) {
  return `
    <button class="nav-item" data-path="${page.path}">
      <span class="nav-item__icon">${icon(page.icon, { size: 20 })}</span>
      <span>${page.label}</span>
    </button>`;
}

function syncActive(el, selector) {
  const current = getCurrentPath();
  el.querySelectorAll(selector).forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.path === current);
  });
}

/** Re-sync active state on every route change; called once from app.js. */
export function bindNavActiveSync(sidebarEl, bottomNavEl) {
  window.addEventListener("route:changed", () => {
    syncActive(sidebarEl, ".nav-item");
    syncActive(bottomNavEl, ".bottom-nav__item");
  });
}

function openMoreSheet() {
  const remaining = PAGES.filter((p) => !BOTTOM_NAV_PRIMARY.includes(p.path));
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-label="More sections">
      <div class="sheet__handle"></div>
      <div class="sheet__header">
        <h2 class="sheet__title">More</h2>
        <button class="icon-btn" data-close aria-label="Close">${icon("close")}</button>
      </div>
      <nav class="sidebar__nav">
        ${remaining.map((p) => navItemHtml(p)).join("")}
      </nav>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("[data-close]").addEventListener("click", close);
  backdrop.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigateTo(btn.dataset.path);
      close();
    });
  });
}
