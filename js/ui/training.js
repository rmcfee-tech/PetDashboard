// ui/training.js
// Same schema-driven tab pattern. "sessions" drives the dashboard's
// training streak (a session logged today counts), so logging a session
// here is what keeps that card alive.

import { registerRoute } from "../router.js";
import { renderRecordSection } from "./recordEditor.js";
import { getActivePet } from "../state.js";
import { trainingStreak } from "../reminders.js";

const RATING_OPTIONS = ["1 - Just starting", "2 - Developing", "3 - Reliable", "4 - Strong", "5 - Mastered"];

const SECTIONS = [
  { id: "skills", label: "Skills", fields: [{ key: "name", label: "Skill", type: "text" }, { key: "rating", label: "Rating", type: "select", options: RATING_OPTIONS }] },
  { id: "sessions", label: "Sessions", fields: [{ key: "focus", label: "Focus", type: "text" }, { key: "durationMinutes", label: "Duration", type: "number", unit: "min" }] },
  { id: "achievements", label: "Achievements", fields: [{ key: "title", label: "Achievement", type: "text" }] },
  { id: "socializationChecklist", label: "Socialization", fields: [{ key: "item", label: "Experience", type: "text" }, { key: "status", label: "Status", type: "select", options: ["Not yet", "Introduced", "Comfortable"] }] },
  { id: "confidenceLog", label: "Confidence", fields: [{ key: "context", label: "Context", type: "text" }, { key: "rating", label: "Rating", type: "select", options: RATING_OPTIONS } ] },
  { id: "recallLog", label: "Recall", fields: [{ key: "environment", label: "Environment", type: "select", options: ["Indoors", "Backyard", "Park (low distraction)", "Park (high distraction)"] }, { key: "success", label: "Success", type: "select", options: ["Yes", "Partial", "No"] }] },
  { id: "looseLeashLog", label: "Loose leash", fields: [{ key: "rating", label: "Rating", type: "select", options: RATING_OPTIONS }] },
  { id: "retrieveLog", label: "Retrieve", fields: [{ key: "rating", label: "Rating", type: "select", options: RATING_OPTIONS }] },
  { id: "swimmingLog", label: "Swimming", fields: [{ key: "comfortLevel", label: "Comfort level", type: "select", options: ["Avoids water", "Wading", "Swimming with encouragement", "Swims confidently"] }] },
  { id: "impulseControlLog", label: "Impulse control", fields: [{ key: "context", label: "Context (e.g. doorways, food)", type: "text" }, { key: "rating", label: "Rating", type: "select", options: RATING_OPTIONS }] },
];

function render(container) {
  const pet = getActivePet();
  const streak = trainingStreak(pet);

  container.innerHTML = `
    <div class="page-heading"><h1>Training</h1></div>
    <div class="card" style="margin-bottom: var(--space-5);">
      <p class="card__label">Current streak</p>
      <p class="card__value">${streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "—"}</p>
      <p class="card__meta">Log a session today to keep it going</p>
    </div>
    <div class="quickadd-tabs" role="tablist" id="training-tabs">
      ${SECTIONS.map((s, i) => `<button role="tab" data-section="${s.id}" class="${i === 0 ? "is-active" : ""}">${s.label}</button>`).join("")}
    </div>
    <div id="training-body"></div>
  `;

  const tabsEl = container.querySelector("#training-tabs");
  const bodyEl = container.querySelector("#training-body");

  function showSection(id) {
    const section = SECTIONS.find((s) => s.id === id);
    tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b.dataset.section === id));
    renderRecordSection(bodyEl, {
      title: section.label,
      path: ["training", section.id],
      fields: section.fields,
      icon: "target",
      addLabel: `Log ${section.label.toLowerCase()}`,
      emptyLabel: `No ${section.label.toLowerCase()} logged yet.`,
    });
  }

  tabsEl.querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => showSection(btn.dataset.section)));
  showSection(SECTIONS[0].id);
}

registerRoute("training", render);
