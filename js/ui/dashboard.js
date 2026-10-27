// ui/dashboard.js
// The dashboard surfaces the full card set from the spec. Cards whose
// underlying feature page doesn't exist yet (Grooming, Training, Expenses,
// Photos — all Stage 4) still read from real state so they light up
// automatically once those pages start writing data; today they show a
// calm "not tracked yet" state instead of fake numbers.

import { registerRoute, navigateTo } from "../router.js";
import { getActivePet } from "../state.js";
import { formatAge, formatDate, byDateDesc } from "../utils.js";
import {
  nextVaccinationDue, activeMedications, upcomingVetVisit,
  nextGroomingDue, daysUntil, trainingStreak, monthlySpend,
} from "../reminders.js";

function render(container) {
  const pet = getActivePet();
  const name = pet.profile.name || "Your pet";
  const age = formatAge(pet.profile.birthday);

  const latestWeight = [...pet.health.weightHistory].sort(byDateDesc)[0];
  const latestNote = [...pet.journal.entries].sort(byDateDesc)[0];
  const dailyTasks = pet.schedule.dailyTasks || [];

  const vaccine = nextVaccinationDue(pet);
  const vaccineDays = vaccine ? daysUntil(vaccine.nextDue) : null;

  const meds = activeMedications(pet);
  const visit = upcomingVetVisit(pet);
  const visitDays = visit ? daysUntil(visit.date) : null;

  const groomDate = nextGroomingDue(pet);
  const groomDays = groomDate ? daysUntil(groomDate) : null;

  const streak = trainingStreak(pet);
  const spend = monthlySpend(pet);
  const recentPhoto = [...(pet.photos.items || [])].sort(byDateDesc)[0];

  container.innerHTML = `
    <div class="page-heading">
      <h1>${name}${age !== "—" ? ` · ${age}` : ""}</h1>
    </div>
    <div class="card-grid">

      <div class="card card--wide">
        <p class="card__label">Today</p>
        ${
          dailyTasks.length
            ? `<ul class="task-list">${dailyTasks
                .map(
                  (t) => `
                <li class="task-row ${t.done ? "is-done" : ""}">
                  <input type="checkbox" ${t.done ? "checked" : ""} data-task="${t.id}" aria-label="${t.label}" />
                  <span class="task-row__label">${t.label}</span>
                </li>`
                )
                .join("")}</ul>`
            : `<p class="card__meta">No tasks yet. Add recurring tasks from Schedule.</p>`
        }
      </div>

      <button class="card card--interactive" data-nav="health" style="text-align:left; border:none; cursor:pointer;">
        <p class="card__label">Upcoming appointment</p>
        <p class="card__value">${visit ? formatDate(visit.date) : "—"}</p>
        <p class="card__meta">${visit ? (visit.reason || "Vet visit") : "None scheduled — log one in Health"}</p>
        ${visit && visitDays !== null ? trendBadge(visitDays, "in") : ""}
      </button>

      <button class="card card--interactive" data-nav="health" style="text-align:left; border:none; cursor:pointer;">
        <p class="card__label">Medication due</p>
        <p class="card__value">${meds.length}</p>
        <p class="card__meta">${meds.length ? meds.map((m) => m.name).filter(Boolean).slice(0, 2).join(", ") : "No active medications"}</p>
      </button>

      <button class="card card--interactive" data-nav="training" style="text-align:left; border:none; cursor:pointer;">
        <p class="card__label">Training streak</p>
        <p class="card__value">${streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "—"}</p>
        <p class="card__meta">${streak > 0 ? "Keep it going" : "Full tracker arrives in Stage 4"}</p>
      </button>

      <button class="card card--interactive" data-nav="health" style="text-align:left; border:none; cursor:pointer;">
        <p class="card__label">Current weight</p>
        <p class="card__value">${latestWeight ? `${latestWeight.value} kg` : "—"}</p>
        <p class="card__meta">${latestWeight ? formatDate(latestWeight.date) : "No entries yet"}</p>
      </button>

      <div class="card card--wide">
        <p class="card__label">Recent note</p>
        <p class="card__meta">${latestNote ? `"${escapePreview(latestNote.text)}" — ${formatDate(latestNote.date)}` : "No journal entries yet. Use Quick Add to write one."}</p>
      </div>

      <button class="card card--interactive" data-nav="grooming" style="text-align:left; border:none; cursor:pointer;">
        <p class="card__label">Next grooming</p>
        <p class="card__value">${groomDate ? formatDate(groomDate) : "—"}</p>
        <p class="card__meta">${groomDate ? "" : "Not tracked yet — full page arrives in Stage 4"}</p>
        ${groomDate && groomDays !== null ? trendBadge(groomDays, "in") : ""}
      </button>

      <button class="card card--interactive" data-nav="health" style="text-align:left; border:none; cursor:pointer;">
        <p class="card__label">Vaccination countdown</p>
        <p class="card__value">${vaccine ? formatDate(vaccine.nextDue) : "—"}</p>
        <p class="card__meta">${vaccine ? (vaccine.vaccine || "Vaccine") : "None logged yet — add one in Health"}</p>
        ${vaccine && vaccineDays !== null ? trendBadge(vaccineDays, "in") : ""}
      </button>

      <button class="card card--interactive" data-nav="expenses" style="text-align:left; border:none; cursor:pointer;">
        <p class="card__label">Monthly spending</p>
        <p class="card__value">$${spend.toFixed(2)}</p>
        <p class="card__meta">${spend ? "This month" : "Full expense tracker arrives in Stage 4"}</p>
      </button>

      <div class="card">
        <p class="card__label">Recent photo</p>
        ${recentPhoto ? `<img src="${recentPhoto.dataUrl}" alt="${recentPhoto.caption || "Pet photo"}" style="width:100%; border-radius: var(--radius-md); margin-top: var(--space-2);" />` : `<p class="card__meta">Photo gallery arrives in Stage 4</p>`}
      </div>

      <div class="card">
        <p class="card__label">Weather</p>
        <p class="card__meta">Weather integration is a placeholder for now — not part of this stage.</p>
      </div>

    </div>
  `;

  container.querySelectorAll("[data-task]").forEach((cb) => {
    cb.addEventListener("change", () => {
      cb.closest(".task-row").classList.toggle("is-done", cb.checked);
      updateState((state) => {
        const pet = state.pets.find((p) => p.id === state.activePetId);
        const task = pet.schedule.dailyTasks.find((t) => t.id === cb.dataset.task);
        if (task) task.done = cb.checked;
      });
      scheduleAutosave();
    });
  });

  container.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => navigateTo(btn.dataset.nav));
  });
}

function trendBadge(days, prefix) {
  if (days === null) return "";
  const overdue = days < 0;
  const soon = days >= 0 && days <= 7;
  const cls = overdue ? "card__trend--down" : soon ? "card__trend--warn" : "card__trend--up";
  const label = overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "today" : `${prefix} ${days}d`;
  return `<span class="card__trend ${cls}">${label}</span>`;
}

function escapePreview(text) {
  const trimmed = text.length > 90 ? `${text.slice(0, 90)}…` : text;
  return trimmed.replaceAll("<", "&lt;");
}

registerRoute("dashboard", render);
