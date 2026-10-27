// ui/expenses.js
// Entries reuse recordEditor.js (category + amount + description schema).
// Totals and the category bar chart are computed fresh on every render
// directly from pet.expenses.entries — no separate aggregate state to keep
// in sync, which matters since entries can be added from Quick Add too.

import { registerRoute } from "../router.js";
import { renderRecordSection } from "./recordEditor.js";
import { getActivePet, updateState } from "../state.js";
import { scheduleAutosave } from "../storage.js";
import { drawBarChart } from "../charts.js";
import { showToast } from "./toast.js";

function render(container) {
  const pet = getActivePet();
  const entries = pet.expenses.entries || [];
  const now = new Date();

  const monthTotal = sumWhere(entries, (e) => sameMonth(e.date, now));
  const yearTotal = sumWhere(entries, (e) => new Date(e.date).getFullYear() === now.getFullYear());

  const byCategory = {};
  entries.filter((e) => sameMonth(e.date, now)).forEach((e) => {
    byCategory[e.category || "Other"] = (byCategory[e.category || "Other"] || 0) + (Number(e.amount) || 0);
  });
  const bars = Object.entries(byCategory).map(([label, value]) => ({ label, value }));

  container.innerHTML = `
    <div class="page-heading">
      <h1>Expenses</h1>
      <button class="btn btn--secondary btn--sm" data-manage-categories>Categories</button>
    </div>
    <div class="card-grid" style="margin-bottom: var(--space-5);">
      <div class="card">
        <p class="card__label">This month</p>
        <p class="card__value">$${monthTotal.toFixed(2)}</p>
      </div>
      <div class="card">
        <p class="card__label">This year</p>
        <p class="card__value">$${yearTotal.toFixed(2)}</p>
      </div>
      <div class="card card--wide">
        <p class="card__label">This month by category</p>
        <canvas id="expense-chart" style="width:100%; height:180px;"></canvas>
      </div>
    </div>
    <div id="expenses-body"></div>
  `;

  drawBarChart(container.querySelector("#expense-chart"), bars, { prefix: "$" });

  container.querySelector("[data-manage-categories]").addEventListener("click", () => openCategoryManager(container));

  renderRecordSection(container.querySelector("#expenses-body"), {
    title: "Expenses",
    path: ["expenses", "entries"],
    fields: [
      { key: "category", label: "Category", type: "select", options: pet.expenses.categories },
      { key: "amount", label: "Amount", type: "number", unit: "$" },
      { key: "description", label: "Description", type: "text" },
    ],
    icon: "dollar",
    addLabel: "Add expense",
    emptyLabel: "No expenses logged yet.",
  });
}

function sumWhere(entries, predicate) {
  return entries.filter(predicate).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

function sameMonth(dateStr, ref) {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function openCategoryManager(pageContainer) {
  const pet = getActivePet();
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Manage categories">
      <div class="sheet__handle"></div>
      <div class="sheet__header"><h2 class="sheet__title">Categories</h2></div>
      <div class="field">
        <label class="field__label" for="cat-list">One per line</label>
        <textarea id="cat-list" rows="8">${pet.expenses.categories.join("\n")}</textarea>
      </div>
      <div class="btn-row"><button class="btn btn--primary btn--full" data-save>Save</button></div>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.querySelector("[data-save]").addEventListener("click", () => {
    const categories = backdrop.querySelector("#cat-list").value.split("\n").map((s) => s.trim()).filter(Boolean);
    updateState((state) => {
      const p = state.pets.find((pp) => pp.id === state.activePetId);
      p.expenses.categories = categories;
    });
    scheduleAutosave();
    showToast("Categories updated");
    backdrop.remove();
    render(pageContainer);
  });
}

registerRoute("expenses", render);
