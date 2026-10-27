// ui/reports.js
// Generates printable summaries. "Printable" here means window.print() —
// the @media print rules in mobile.css already hide chrome (nav, FAB,
// header actions) so printing/saving as PDF from the browser just works,
// with no separate PDF library needed.

import { registerRoute } from "../router.js";
import { getActivePet } from "../state.js";
import { formatDate, byDateDesc } from "../utils.js";
import { drawLineChart, drawBarChart } from "../charts.js";
import { trainingStreak } from "../reminders.js";

const REPORTS = [
  { id: "health", label: "Health summary" },
  { id: "vaccinations", label: "Vaccination summary" },
  { id: "expenses", label: "Expense summary" },
  { id: "growth", label: "Growth report" },
  { id: "training", label: "Training report" },
];

let activeReport = "health";

function render(container) {
  container.innerHTML = `
    <div class="page-heading"><h1>Reports</h1></div>
    <div class="quickadd-tabs" role="tablist" id="report-tabs">
      ${REPORTS.map((r) => `<button data-report="${r.id}" class="${r.id === activeReport ? "is-active" : ""}">${r.label}</button>`).join("")}
    </div>
    <div class="btn-row" style="margin-bottom: var(--space-4);">
      <button class="btn btn--primary" id="print-btn">Print / Save as PDF</button>
    </div>
    <div id="report-content" class="card"></div>
  `;

  container.querySelectorAll("[data-report]").forEach((btn) =>
    btn.addEventListener("click", () => { activeReport = btn.dataset.report; render(container); })
  );
  container.querySelector("#print-btn").addEventListener("click", () => window.print());

  const content = container.querySelector("#report-content");
  const pet = getActivePet();
  const renderers = { health: renderHealth, vaccinations: renderVaccinations, expenses: renderExpenses, growth: renderGrowth, training: renderTraining };
  renderers[activeReport](content, pet);
}

function renderHealth(el, pet) {
  const meds = (pet.health.medications || []).filter((m) => m.active !== "Completed");
  const lastVisit = [...pet.health.vetVisits].sort(byDateDesc)[0];
  el.innerHTML = `
    <h2>Health summary — ${pet.profile.name || "Pet"}</h2>
    <p class="card__meta">Generated ${formatDate(new Date().toISOString())}</p>
    <ul>
      <li>Vaccinations on record: ${pet.health.vaccinations.length}</li>
      <li>Active medications: ${meds.length}${meds.length ? ` (${meds.map((m) => m.name).filter(Boolean).join(", ")})` : ""}</li>
      <li>Allergies: ${pet.health.allergies.length}</li>
      <li>Ongoing illnesses: ${(pet.health.illnesses || []).filter((i) => i.status !== "Resolved").length}</li>
      <li>Surgeries on record: ${pet.health.surgeries.length}</li>
      <li>Most recent vet visit: ${lastVisit ? `${formatDate(lastVisit.date)} — ${lastVisit.reason || ""}` : "None logged"}</li>
    </ul>
  `;
}

function renderVaccinations(el, pet) {
  const rows = [...pet.health.vaccinations].sort(byDateDesc);
  el.innerHTML = `
    <h2>Vaccination summary — ${pet.profile.name || "Pet"}</h2>
    ${
      rows.length
        ? `<table style="width:100%; border-collapse: collapse;">
            <thead><tr style="text-align:left; border-bottom: 1px solid var(--color-border);"><th style="padding:8px 4px;">Vaccine</th><th style="padding:8px 4px;">Given</th><th style="padding:8px 4px;">Next due</th></tr></thead>
            <tbody>
              ${rows.map((v) => `<tr style="border-bottom: 1px solid var(--color-border);"><td style="padding:8px 4px;">${v.vaccine || "—"}</td><td style="padding:8px 4px;">${formatDate(v.date)}</td><td style="padding:8px 4px;">${v.nextDue ? formatDate(v.nextDue) : "—"}</td></tr>`).join("")}
            </tbody>
          </table>`
        : `<p class="card__meta">No vaccinations logged yet.</p>`
    }
  `;
}

function renderExpenses(el, pet) {
  const entries = pet.expenses.entries || [];
  const now = new Date();
  const yearEntries = entries.filter((e) => new Date(e.date).getFullYear() === now.getFullYear());
  const total = yearEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const byCategory = {};
  yearEntries.forEach((e) => { byCategory[e.category || "Other"] = (byCategory[e.category || "Other"] || 0) + (Number(e.amount) || 0); });
  const bars = Object.entries(byCategory).map(([label, value]) => ({ label, value }));

  el.innerHTML = `
    <h2>Expense summary — ${pet.profile.name || "Pet"}</h2>
    <p>Total this year: <strong>$${total.toFixed(2)}</strong></p>
    <canvas id="report-expense-chart" style="width:100%; height:220px;"></canvas>
  `;
  drawBarChart(el.querySelector("#report-expense-chart"), bars, { prefix: "$" });
}

function renderGrowth(el, pet) {
  const weights = [...pet.health.weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  const points = weights.map((w) => ({ label: formatDate(w.date, { month: "short", day: "numeric" }), value: w.value }));
  el.innerHTML = `
    <h2>Growth report — ${pet.profile.name || "Pet"}</h2>
    <canvas id="report-growth-chart" style="width:100%; height:220px;"></canvas>
    <p class="card__meta">${weights.length} weight ${weights.length === 1 ? "entry" : "entries"} on record.</p>
  `;
  drawLineChart(el.querySelector("#report-growth-chart"), points, { unit: "kg" });
}

function renderTraining(el, pet) {
  const streak = trainingStreak(pet);
  el.innerHTML = `
    <h2>Training report — ${pet.profile.name || "Pet"}</h2>
    <ul>
      <li>Current streak: ${streak} day${streak === 1 ? "" : "s"}</li>
      <li>Sessions logged: ${pet.training.sessions.length}</li>
      <li>Skills tracked: ${pet.training.skills.length}</li>
      <li>Achievements: ${pet.training.achievements.length}</li>
    </ul>
    ${
      pet.training.skills.length
        ? `<table style="width:100%; border-collapse: collapse;">
            <thead><tr style="text-align:left; border-bottom: 1px solid var(--color-border);"><th style="padding:8px 4px;">Skill</th><th style="padding:8px 4px;">Rating</th></tr></thead>
            <tbody>${pet.training.skills.map((s) => `<tr style="border-bottom: 1px solid var(--color-border);"><td style="padding:8px 4px;">${s.name || "—"}</td><td style="padding:8px 4px;">${s.rating || "—"}</td></tr>`).join("")}</tbody>
          </table>`
        : ""
    }
  `;
}

registerRoute("reports", render);
