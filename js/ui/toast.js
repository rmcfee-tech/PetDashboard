// ui/toast.js
// Tiny transient toast for confirmations ("Weight saved", "File exported").

let hideTimer = null;

export function showToast(message, durationMs = 2200) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => el.classList.remove("is-visible"), durationMs);
}
