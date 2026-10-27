// ui/health.js
// Health is the largest section in the spec (13 subsections), so it's built
// entirely on top of recordEditor.js: each subsection is just a schema.
// A horizontal tab strip switches between them, keeping every subsection
// reachable in one tap from the Health page (two from anywhere in the app).

import { registerRoute } from "../router.js";
import { renderRecordSection } from "./recordEditor.js";

const SECTIONS = [
  {
    id: "vaccinations", label: "Vaccinations", icon: "heart",
    fields: [
      { key: "vaccine", label: "Vaccine", type: "text" },
      { key: "nextDue", label: "Next due", type: "date" },
    ],
  },
  {
    id: "medications", label: "Medications", icon: "heart",
    fields: [
      { key: "name", label: "Medication", type: "text" },
      { key: "dosage", label: "Dosage", type: "text" },
      { key: "frequency", label: "Frequency", type: "select", options: ["Daily", "Weekly", "Monthly", "As needed"] },
      { key: "active", label: "Status", type: "select", options: ["Active", "Completed"] },
    ],
  },
  {
    id: "allergies", label: "Allergies", icon: "heart",
    fields: [
      { key: "allergen", label: "Allergen", type: "text" },
      { key: "severity", label: "Severity", type: "select", options: ["Mild", "Moderate", "Severe"] },
    ],
  },
  {
    id: "illnesses", label: "Illnesses", icon: "heart",
    fields: [
      { key: "condition", label: "Condition", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Ongoing", "Resolved"] },
    ],
  },
  {
    id: "injuries", label: "Injuries", icon: "heart",
    fields: [
      { key: "description", label: "Injury", type: "text" },
      { key: "bodyPart", label: "Body part", type: "text" },
    ],
  },
  {
    id: "surgeries", label: "Surgeries", icon: "heart",
    fields: [
      { key: "procedure", label: "Procedure", type: "text" },
      { key: "vetClinic", label: "Clinic", type: "text" },
    ],
  },
  {
    id: "weightHistory", label: "Weight", icon: "target",
    fields: [{ key: "value", label: "Weight", type: "number", unit: "kg" }],
  },
  {
    id: "heightHistory", label: "Height", icon: "target",
    fields: [{ key: "value", label: "Height", type: "number", unit: "cm" }],
  },
  {
    id: "temperatureRecords", label: "Temperature", icon: "target",
    fields: [{ key: "value", label: "Temperature", type: "number", unit: "°C" }],
  },
  {
    id: "heartRateRecords", label: "Heart rate", icon: "target",
    fields: [{ key: "value", label: "Heart rate", type: "number", unit: "bpm" }],
  },
  {
    id: "vetVisits", label: "Vet visits", icon: "calendar",
    fields: [
      { key: "reason", label: "Reason", type: "text" },
      { key: "clinic", label: "Clinic", type: "text" },
    ],
  },
  {
    id: "labResults", label: "Lab results", icon: "heart",
    fields: [
      { key: "testName", label: "Test", type: "text" },
      { key: "result", label: "Result", type: "text" },
    ],
  },
  {
    id: "insuranceClaims", label: "Insurance claims", icon: "dollar",
    fields: [
      { key: "claimNumber", label: "Claim #", type: "text" },
      { key: "amount", label: "Amount", type: "number", unit: "$" },
      { key: "status", label: "Status", type: "select", options: ["Submitted", "Approved", "Denied", "Paid"] },
    ],
  },
];

function render(container) {
  container.innerHTML = `
    <div class="page-heading"><h1>Health</h1></div>
    <div class="quickadd-tabs" role="tablist" id="health-tabs">
      ${SECTIONS.map((s, i) => `<button role="tab" data-section="${s.id}" class="${i === 0 ? "is-active" : ""}">${s.label}</button>`).join("")}
    </div>
    <div id="health-body"></div>
  `;

  const tabsEl = container.querySelector("#health-tabs");
  const bodyEl = container.querySelector("#health-body");

  function showSection(id) {
    const section = SECTIONS.find((s) => s.id === id);
    tabsEl.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b.dataset.section === id));
    renderRecordSection(bodyEl, {
      title: section.label,
      path: ["health", section.id],
      fields: section.fields,
      icon: section.icon,
      addLabel: `Add ${section.label.toLowerCase()}`,
      emptyLabel: `No ${section.label.toLowerCase()} logged yet.`,
    });
  }

  tabsEl.querySelectorAll("button").forEach((btn) =>
    btn.addEventListener("click", () => showSection(btn.dataset.section))
  );

  showSection(SECTIONS[0].id);
}

registerRoute("health", render);
