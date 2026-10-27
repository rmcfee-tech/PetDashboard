// ui/schedule.js
// Two views: "Today" for the recurring daily checklist (grouped by time of
// day, since that's how the spec frames it — morning/afternoon/evening),
// and "Calendar" for one-off dated events with a month grid + agenda panel.

import { registerRoute } from "../router.js";
import { updateState, getActivePet } from "../state.js";
import { scheduleAutosave } from "../storage.js";
import { makeId, todayISO, formatDate, escapeHtml } from "../utils.js";
import { getMonthGrid, monthLabel, WEEKDAY_LABELS } from "../calendar.js";
import { icon } from "./icons.js";
import { showToast } from "./toast.js";

const TIME_GROUPS = ["Morning", "Afternoon", "Evening", "Anytime"];
let viewMode = "today";
let calendarCursor = new Date();
let selectedDate = todayISO();
let lastResetDate = null; // track the date we last reset daily tasks

/** Reset done flags for recurring daily tasks if a new day has started. */
function resetDailyTasksIfNeeded() {
  const today = todayISO();
  if (lastResetDate === today) return;
  if (lastResetDate !== null) {
    // New day detected — reset done flags for recurring daily tasks.
    updateState((state) => {
      const pet = state.pets.find((p) => p.id === state.activePetId);
      (pet.schedule.dailyTasks || []).forEach((t) => {
        if (t.recurring) t.done = false;
      });
    });
    scheduleAutosave();
  }
  lastResetDate = today;
}

function render(container) {
  resetDailyTasksIfNeeded();
  container.innerHTML = `
    <div class="page-heading"><h1>Schedule</h1></div>
    <div class="segmented" style="max-width: 280px; margin-bottom: var(--space-5);">
      <button data-view="today" class="${viewMode === "today" ? "is-selected" : ""}">Today</button>
      <button data-view="calendar" class="${viewMode === "calendar" ? "is-selected" : ""}">Calendar</button>
    </div>
    <div id="schedule-body"></div>
  `;
  container.querySelectorAll("[data-view]").forEach((btn) =>
    btn.addEventListener("click", () => { viewMode = btn.dataset.view; render(container); })
  );
  const body = container.querySelector("#schedule-body");
  if (viewMode === "today") renderTodayView(body, container);
  else renderCalendarView(body, container);
}

/* ---------------------------------------------------------------------- */
/* Today view                                                              */
/* ---------------------------------------------------------------------- */

function renderTodayView(body, pageContainer) {
  const pet = getActivePet();
  const tasks = pet.schedule.dailyTasks || [];
  const anyTasks = tasks.length > 0;

  body.innerHTML = `
    <div class="btn-row" style="margin-top:0; margin-bottom: var(--space-4);">
      <button class="btn btn--primary" data-add-task>${icon("plus", { size: 16 })} Add task</button>
    </div>
    ${TIME_GROUPS.map((group) => {
      const groupTasks = tasks.filter((t) => (t.timeOfDay || "Anytime") === group);
      if (!groupTasks.length) return "";
      return `
        <div class="card card--wide" style="margin-bottom: var(--space-3);">
          <p class="card__label">${group}</p>
          <ul class="task-list">
            ${groupTasks.map((t) => `
              <li class="task-row ${t.done ? "is-done" : ""}">
                <input type="checkbox" ${t.done ? "checked" : ""} data-toggle="${t.id}" aria-label="${escapeHtml(t.label)}" />
                <span class="task-row__label">${escapeHtml(t.label)}${t.recurring ? " · daily" : ""}</span>
                <button class="icon-btn" data-delete-task="${t.id}" aria-label="Delete task">${icon("trash", { size: 15 })}</button>
              </li>`).join("")}
          </ul>
        </div>`;
    }).join("") || (anyTasks ? "" : `<p class="card__meta">No tasks yet. Add your first one above.</p>`)}
  `;

  body.querySelector("[data-add-task]").addEventListener("click", () => openTaskForm(pageContainer));
  body.querySelectorAll("[data-toggle]").forEach((cb) =>
    cb.addEventListener("change", () => {
      updateState((state) => {
        const p = state.pets.find((pp) => pp.id === state.activePetId);
        const task = p.schedule.dailyTasks.find((t) => t.id === cb.dataset.toggle);
        if (task) task.done = cb.checked;
      });
      scheduleAutosave();
    })
  );
  body.querySelectorAll("[data-delete-task]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!confirm("Delete this task?")) return;
      updateState((state) => {
        const p = state.pets.find((pp) => pp.id === state.activePetId);
        p.schedule.dailyTasks = p.schedule.dailyTasks.filter((t) => t.id !== btn.dataset.deleteTask);
      });
      scheduleAutosave();
      renderTodayView(body, pageContainer);
    })
  );
}

function openTaskForm(pageContainer) {
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Add task">
      <div class="sheet__handle"></div>
      <div class="sheet__header">
        <h2 class="sheet__title">Add task</h2>
        <button class="icon-btn" data-close aria-label="Close">${icon("close")}</button>
      </div>
      <div class="field">
        <label class="field__label" for="task-label">Task</label>
        <input id="task-label" type="text" placeholder="e.g. Evening walk" />
      </div>
      <div class="field">
        <label class="field__label" for="task-time">Time of day</label>
        <select id="task-time">${TIME_GROUPS.map((g) => `<option value="${g}">${g}</option>`).join("")}</select>
      </div>
      <label class="check-row">
        <input type="checkbox" id="task-recurring" checked />
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
    const label = backdrop.querySelector("#task-label").value.trim();
    if (!label) { showToast("Enter a task name"); return; }
    const timeOfDay = backdrop.querySelector("#task-time").value;
    const recurring = backdrop.querySelector("#task-recurring").checked;
    updateState((state) => {
      const p = state.pets.find((pp) => pp.id === state.activePetId);
      p.schedule.dailyTasks.push({ id: makeId("task"), label, timeOfDay, recurring, done: false });
    });
    scheduleAutosave();
    close();
    render(pageContainer);
  });
}

/* ---------------------------------------------------------------------- */
/* Calendar view                                                           */
/* ---------------------------------------------------------------------- */

function renderCalendarView(body, pageContainer) {
  const pet = getActivePet();
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const weeks = getMonthGrid(year, month);
  const events = pet.schedule.calendarEvents || [];
  const eventsByDate = {};
  events.forEach((e) => { (eventsByDate[e.date] ||= []).push(e); });

  body.innerHTML = `
    <div class="card" style="margin-bottom: var(--space-4);">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-3);">
        <button class="icon-btn" data-prev-month aria-label="Previous month">‹</button>
        <strong>${monthLabel(year, month)}</strong>
        <button class="icon-btn" data-next-month aria-label="Next month">›</button>
      </div>
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align:center; font-size: var(--font-size-xs); color: var(--color-text-faint); margin-bottom: var(--space-1);">
        ${WEEKDAY_LABELS.map((d) => `<div>${d}</div>`).join("")}
      </div>
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
        ${weeks.flat().map((day) => `
          <button data-date="${day.iso}" style="
            aspect-ratio: 1; border-radius: var(--radius-sm); border: none; cursor: pointer;
            background: ${day.iso === selectedDate ? "var(--color-primary)" : day.isToday ? "var(--color-primary-soft)" : "transparent"};
            color: ${day.iso === selectedDate ? "#fff" : day.inMonth ? "var(--color-text)" : "var(--color-text-faint)"};
            font-size: var(--font-size-sm); position: relative;">
            ${day.date.getDate()}
            ${eventsByDate[day.iso]?.length ? `<span style="position:absolute; bottom:4px; left:50%; transform:translateX(-50%); width:4px; height:4px; border-radius:50%; background:${day.iso === selectedDate ? "#fff" : "var(--color-primary)"};"></span>` : ""}
          </button>`).join("")}
      </div>
    </div>
    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-3);">
        <p class="card__label" style="margin:0;">${formatDate(selectedDate)}</p>
        <button class="btn btn--secondary btn--sm" data-add-event>${icon("plus", { size: 14 })} Add event</button>
      </div>
      ${
        (eventsByDate[selectedDate] || []).length
          ? `<div>${eventsByDate[selectedDate].map((e) => `
              <div class="list-row">
                <div class="list-row__icon">${icon("calendar", { size: 16 })}</div>
                <div class="list-row__main">
                  <div class="list-row__title">${escapeHtml(e.title)}${e.time ? ` · ${escapeHtml(e.time)}` : ""}</div>
                  ${e.notes ? `<div class="list-row__subtitle">${escapeHtml(e.notes)}</div>` : ""}
                </div>
                <button class="icon-btn" data-delete-event="${e.id}" aria-label="Delete event">${icon("trash", { size: 15 })}</button>
              </div>`).join("")}</div>`
          : `<p class="card__meta">No events on this day.</p>`
      }
    </div>
  `;

  body.querySelector("[data-prev-month]").addEventListener("click", () => {
    calendarCursor = new Date(year, month - 1, 1);
    renderCalendarView(body, pageContainer);
  });
  body.querySelector("[data-next-month]").addEventListener("click", () => {
    calendarCursor = new Date(year, month + 1, 1);
    renderCalendarView(body, pageContainer);
  });
  body.querySelectorAll("[data-date]").forEach((btn) =>
    btn.addEventListener("click", () => { selectedDate = btn.dataset.date; renderCalendarView(body, pageContainer); })
  );
  body.querySelector("[data-add-event]").addEventListener("click", () => openEventForm(body, pageContainer));
  body.querySelectorAll("[data-delete-event]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!confirm("Delete this event?")) return;
      updateState((state) => {
        const p = state.pets.find((pp) => pp.id === state.activePetId);
        p.schedule.calendarEvents = p.schedule.calendarEvents.filter((e) => e.id !== btn.dataset.deleteEvent);
      });
      scheduleAutosave();
      renderCalendarView(body, pageContainer);
    })
  );
}

function openEventForm(body, pageContainer) {
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Add event">
      <div class="sheet__handle"></div>
      <div class="sheet__header">
        <h2 class="sheet__title">Add event</h2>
        <button class="icon-btn" data-close aria-label="Close">${icon("close")}</button>
      </div>
      <div class="field"><label class="field__label" for="ev-title">Title</label><input id="ev-title" type="text" placeholder="e.g. Vet checkup" /></div>
      <div class="field"><label class="field__label" for="ev-time">Time</label><input id="ev-time" type="time" /></div>
      <div class="field"><label class="field__label" for="ev-notes">Notes</label><textarea id="ev-notes"></textarea></div>
      <div class="btn-row"><button class="btn btn--primary btn--full" data-save>Save event</button></div>
    </div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("[data-close]").addEventListener("click", close);
  backdrop.querySelector("[data-save]").addEventListener("click", () => {
    const title = backdrop.querySelector("#ev-title").value.trim();
    if (!title) { showToast("Enter a title"); return; }
    const time = backdrop.querySelector("#ev-time").value;
    const notes = backdrop.querySelector("#ev-notes").value.trim();
    updateState((state) => {
      const p = state.pets.find((pp) => pp.id === state.activePetId);
      p.schedule.calendarEvents.push({ id: makeId("evt"), date: selectedDate, title, time, notes });
    });
    scheduleAutosave();
    close();
    renderCalendarView(body, pageContainer);
  });
}

registerRoute("schedule", render);
