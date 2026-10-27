// ui/quickAdd.js
// The Quick Add bottom sheet reachable from the FAB on every page — this is
// what keeps the "useful within three taps" requirement true for the most
// common actions. Stage 2 wires the sheet shell, tab switching, and two
// reference entry types (Weight, Journal note); Health/Expenses/Medication
// tabs get their full forms in Stage 3/4 but already appear here as stubs
// so the navigation pattern is settled early.

import { icon } from "./icons.js";
import { updateState, getActivePet } from "../state.js";
import { scheduleAutosave } from "../storage.js";
import { makeId, todayISO } from "../utils.js";
import { showToast } from "./toast.js";

const TABS = [
  { id: "weight", label: "Weight" },
  { id: "taskComplete", label: "Task" },
  { id: "journal", label: "Note" },
  { id: "expense", label: "Expense" },
  { id: "medication", label: "Medication" },
];

export function openQuickAdd(defaultTab = "weight") {
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Quick add">
      <div class="sheet__handle"></div>
      <div class="sheet__header">
        <h2 class="sheet__title">Quick Add</h2>
        <button class="icon-btn" data-close aria-label="Close">${icon("close")}</button>
      </div>
      <div class="quickadd-tabs" role="tablist">
        ${TABS.map((t) => `<button role="tab" data-tab="${t.id}">${t.label}</button>`).join("")}
      </div>
      <div class="quickadd-body"></div>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("[data-close]").addEventListener("click", close);

  const tabButtons = backdrop.querySelectorAll(".quickadd-tabs button");
  const body = backdrop.querySelector(".quickadd-body");

  function selectTab(tabId) {
    tabButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabId));
    body.innerHTML = "";
    body.appendChild(renderTabForm(tabId, close));
  }

  tabButtons.forEach((b) => b.addEventListener("click", () => selectTab(b.dataset.tab)));
  selectTab(defaultTab);
}

function renderTabForm(tabId, closeSheet) {
  const wrap = document.createElement("div");

  if (tabId === "weight") {
    wrap.innerHTML = `
      <div class="field">
        <label class="field__label" for="qa-weight">Weight</label>
        <input id="qa-weight" type="number" step="0.01" min="0" inputmode="decimal" placeholder="6.20" />
      </div>
      <div class="field">
        <label class="field__label" for="qa-weight-date">Date</label>
        <input id="qa-weight-date" type="date" value="${todayISO()}" />
      </div>
      <div class="btn-row">
        <button class="btn btn--primary btn--full" data-save>Save weight</button>
      </div>`;
    wrap.querySelector("[data-save]").addEventListener("click", () => {
      const value = Number(wrap.querySelector("#qa-weight").value);
      const date = wrap.querySelector("#qa-weight-date").value;
      if (!value || value <= 0) { showToast("Enter a valid weight"); return; }
      updateState((state) => {
        const pet = state.pets.find((p) => p.id === state.activePetId);
        pet.health.weightHistory.push({ id: makeId("wt"), date, value, notes: "" });
      });
      scheduleAutosave();
      showToast("Weight saved");
      closeSheet();
    });
    return wrap;
  }

  if (tabId === "journal") {
    wrap.innerHTML = `
      <div class="field">
        <label class="field__label" for="qa-note">Note</label>
        <textarea id="qa-note" placeholder="What happened today?"></textarea>
      </div>
      <div class="btn-row">
        <button class="btn btn--primary btn--full" data-save>Save note</button>
      </div>`;
    wrap.querySelector("[data-save]").addEventListener("click", () => {
      const text = wrap.querySelector("#qa-note").value.trim();
      if (!text) { showToast("Write something first"); return; }
      updateState((state) => {
        const pet = state.pets.find((p) => p.id === state.activePetId);
        pet.journal.entries.push({
          id: makeId("jrnl"), date: todayISO(), text, mood: null, tags: [], photoIds: [],
        });
      });
      scheduleAutosave();
      showToast("Note saved");
      closeSheet();
    });
    return wrap;
  }

  if (tabId === "taskComplete") {
    const pet = getActivePet();
    const openTasks = (pet.schedule.dailyTasks || []).filter((t) => !t.done);
    const allTasks = pet.schedule.dailyTasks || [];

    wrap.innerHTML = `
      <div class="btn-row" style="margin-bottom: var(--space-3);">
        <button class="btn btn--primary btn--sm" data-add-task>${icon("plus", { size: 14 })} Add task</button>
      </div>
      ${allTasks.length ? `<ul class="task-list">${allTasks.map((t) => `
        <li class="task-row ${t.done ? "is-done" : ""}"><input type="checkbox" data-task="${t.id}" ${t.done ? "checked" : ""} /><span class="task-row__label">${escapeHtml(t.label)}</span></li>`).join("")}</ul>`
        : `<p class="card__meta">No tasks yet. Add your first one above.</p>`}
    `;

    wrap.querySelector("[data-add-task]").addEventListener("click", () => openQuickTaskForm(closeSheet));

    wrap.querySelectorAll("[data-task]").forEach((cb) => {
      cb.addEventListener("change", () => {
        updateState((state) => {
          const pet2 = state.pets.find((p) => p.id === state.activePetId);
          const task = pet2.schedule.dailyTasks.find((t) => t.id === cb.dataset.task);
          if (task) task.done = cb.checked;
        });
        scheduleAutosave();
        showToast("Task updated");
        cb.closest(".task-row").classList.toggle("is-done", cb.checked);
      });
    });
    return wrap;
  }

  if (tabId === "expense") {
    const pet = getActivePet();
    wrap.innerHTML = `
      <div class="field">
        <label class="field__label" for="qa-cat">Category</label>
        <select id="qa-cat">${pet.expenses.categories.map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
      </div>
      <div class="field"><label class="field__label" for="qa-amount">Amount</label><input id="qa-amount" type="number" step="0.01" min="0" inputmode="decimal" placeholder="25.00" /></div>
      <div class="field"><label class="field__label" for="qa-desc">Description</label><input id="qa-desc" type="text" /></div>
      <div class="btn-row"><button class="btn btn--primary btn--full" data-save>Save expense</button></div>`;
    wrap.querySelector("[data-save]").addEventListener("click", () => {
      const amount = Number(wrap.querySelector("#qa-amount").value);
      if (!amount || amount <= 0) { showToast("Enter a valid amount"); return; }
      const category = wrap.querySelector("#qa-cat").value;
      const description = wrap.querySelector("#qa-desc").value.trim();
      updateState((state) => {
        const pet2 = state.pets.find((p) => p.id === state.activePetId);
        pet2.expenses.entries.push({ id: makeId("exp"), date: todayISO(), category, amount, description, notes: "" });
      });
      scheduleAutosave();
      showToast("Expense saved");
      closeSheet();
    });
    return wrap;
  }

  if (tabId === "medication") {
    wrap.innerHTML = `
      <div class="field"><label class="field__label" for="qa-med-name">Medication</label><input id="qa-med-name" type="text" placeholder="e.g. Nexgard" /></div>
      <div class="field"><label class="field__label" for="qa-med-dose">Dosage</label><input id="qa-med-dose" type="text" /></div>
      <div class="btn-row"><button class="btn btn--primary btn--full" data-save>Log medication given</button></div>`;
    wrap.querySelector("[data-save]").addEventListener("click", () => {
      const name = wrap.querySelector("#qa-med-name").value.trim();
      if (!name) { showToast("Enter a medication name"); return; }
      const dosage = wrap.querySelector("#qa-med-dose").value.trim();
      updateState((state) => {
        const pet2 = state.pets.find((p) => p.id === state.activePetId);
        pet2.health.medications.push({ id: makeId("med"), date: todayISO(), name, dosage, frequency: "Daily", active: "Active", notes: "" });
      });
      scheduleAutosave();
      showToast("Medication logged");
      closeSheet();
    });
    return wrap;
  }

  // Stub for any future tabs.
  wrap.innerHTML = `
    <div class="empty-state">
      <h2>Coming soon</h2>
      <p>This tab is wired and ready for a future form.</p>
    </div>`;
  return wrap;
}

function openQuickTaskForm(closeSheet) {
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Add task">
      <div class="sheet__handle"></div>
      <div class="sheet__header">
        <h2 class="sheet__title">Add task</h2>
        <button class="icon-btn" data-close aria-label="Close">${icon("close", { size: 16 })}</button>
      </div>
      <div class="field">
        <label class="field__label" for="qa-task-label">Task</label>
        <input id="qa-task-label" type="text" placeholder="e.g. Evening walk" />
      </div>
      <div class="field">
        <label class="field__label" for="qa-task-time">Time of day</label>
        <select id="qa-task-time">
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Evening">Evening</option>
          <option value="Anytime" selected>Anytime</option>
        </select>
      </div>
      <label class="check-row">
        <input type="checkbox" id="qa-task-recurring" checked />
        <span>Repeats daily</span>
      </label>
      <div class="btn-row">
        <button class="btn btn--primary btn--full" data-save>Save task</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("[data-close]").addEventListener("click", close);
  backdrop.querySelector("[data-save]").addEventListener("click", () => {
    const label = backdrop.querySelector("#qa-task-label").value.trim();
    if (!label) { showToast("Enter a task name"); return; }
    const timeOfDay = backdrop.querySelector("#qa-task-time").value;
    const recurring = backdrop.querySelector("#qa-task-recurring").checked;
    updateState((state) => {
      const pet = state.pets.find((p) => p.id === state.activePetId);
      pet.schedule.dailyTasks.push({ id: makeId("task"), label, timeOfDay, recurring, done: false });
    });
    scheduleAutosave();
    showToast("Task added");
    close();
    // Re-render the quick add sheet to show the new task.
    const tabBtn = document.querySelector(`.quickadd-tabs button[data-tab="taskComplete"]`);
    if (tabBtn) tabBtn.click();
  });
}

function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function getActivePetSafe() {
  return getActivePet();
}
