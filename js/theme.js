// theme.js
// Applies the light/dark/system theme choice by setting a data-theme
// attribute on <html>, which variables.css and dark.css key off of.
// Preference is stored via storage.js's UI-prefs helper (localStorage,
// not the pet JSON — this is app chrome, not pet data).

import { getUiPrefs, setUiPrefs } from "./storage.js";

export function getTheme() {
  return getUiPrefs().theme || "system";
}

export function applyTheme(theme) {
  setUiPrefs({ theme });
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  updateMetaThemeColor(theme);
}

function updateMetaThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  meta.setAttribute("content", isDark ? "#1C1A17" : "#FAF7F2");
}

/** Call once at boot to restore the saved preference. */
export function initTheme() {
  applyTheme(getTheme());
}
