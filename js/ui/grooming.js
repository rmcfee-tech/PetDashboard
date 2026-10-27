// ui/grooming.js
// Same schema-driven pattern as Health. Adds a small "due" strip at the top
// computed from reminders.js so the Barbet-specific brushing/grooming
// cadence from the spec is visible without digging into a log.

import { registerRoute } from "../router.js";
import { renderRecordSection } from "./recordEditor.js";
import { getActivePet } from "../state.js";
import { nextGroomingDue, daysUntil } from "../reminders.js";
import { formatDate, byDateDesc } from "../utils.js";

const SECTIONS = [
  { id: "brushingLog", label: "Brushing", fields: [{ key: "coatCondition", label: "Coat condition", type: "select", options: ["Clean", "Slightly matted", "Matted", "Freshly brushed"] }] },
  { id: "bathLog", label: "Baths", fields: [{ key: "shampoo", label: "Shampoo used", type: "text" }] },
  { id: "professionalGroomLog", label: "Professional groom", fields: [{ key: "groomer", label: "Groomer / salon", type: "text" }, { key: "cost", label: "Cost", type: "number", unit: "$" }] },
  { id: "nailTrims", label: "Nail trims", fields: [{ key: "method", label: "Method", type: "select", options: ["Clippers", "Grinder", "Professional"] }] },
  { id: "earCleaning", label: "Ear cleaning", fields: [{ key: "condition", label: "Ear condition", type: "select", options: ["Clean", "Waxy", "Red/irritated", "After swimming"] }] },
  { id: "teethBrushing", label: "Teeth brushing", fields: [{ key: "product", label: "Toothpaste/product", type: "text" }] },
  { id: "blowDryerTraining", label: "Blow dryer training", fields: [{ key: "reaction", label: "Reaction", type: "select", options: ["Calm", "Nervous", "Improving", "Great"] }] },
  { id: "coatConditionNotes", label: "Coat condition", fields: [{ key: "condition", label: "Condition", type: "select", options: ["Excellent", "Good", "Needs attention", "Matted"] }] },
  { id: "mattingTracker", label: "Matting tracker", fields: [{ key: "location", label: "Location", type: "text" }, { key: "severity", label: "Severity", type: "select", options: ["Minor", "Moderate", "Severe"] }] },
];

function render(container) {
  const pet = getActivePet();
  const groomDate = nextGroomingDue(pet);
  const groomDays = groomDate ? daysUntil(groomDate) : null;
  const lastBrush = [...pet.grooming.brushingLog].sort(byDateDesc)[0];

  container.innerHTML = `
    <div class="page-heading"><h1>Grooming</h1></div>
    <div class="card-grid" style="margin-bottom: var(--space-5);">
      <div class="card">
        <p class="card__label">Next professional groom</p>
        <p class="card__value">${groomDate ? formatDate(groomDate) : "—"}</p>
        <p class="card__meta">${groomDate ? (groomDays < 0 ? `${Math.abs(groomDays)} days overdue` : `In ${groomDays} days`) : "Log a professional groom to start tracking (every 6–8 weeks for a Barbet)"}</p>
      </div>
      <div class="card">
        <p class="card__label">Last brushed</p>
        <p class="card__value">${lastBrush ? formatDate(lastBrush.date) : "—"}</p>
        <p class="card__meta">Barbets need brushing every 2–3 days to prevent matting</p>
      </div>
    </div>
    <div class="quickadd-tabs" role="tablist" id="grooming-tabs">
      ${SECTIONS.map((s, i) => `<button role="tab" data-section="${s.id}" class="${i === 0 ? "is-active" : ""}">${s.label}</button>`).join("")}
    </div>
    <div id="grooming-body"></div>
  `;

  const tabsEl = container.querySelector("#grooming-tabs");
  const bodyEl = container.querySelector("#grooming-body");

  function showSection(id) {
    const section = SECTIONS.find((s) => s.id === id);
    tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b.dataset.section === id));
    renderRecordSection(bodyEl, {
      title: section.label,
      path: ["grooming", section.id],
      fields: section.fields,
      icon: "scissors",
      addLabel: `Log ${section.label.toLowerCase()}`,
      emptyLabel: `No ${section.label.toLowerCase()} logged yet.`,
    });
  }

  tabsEl.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => showSection(btn.dataset.section)));
  showSection(SECTIONS[0].id);
}

registerRoute("grooming", render);
