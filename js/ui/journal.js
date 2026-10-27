// ui/journal.js
// Journal reuses recordEditor.js: "text" is the entry body (shown as the
// list row title, truncated), mood and tags are quick-filter metadata.
// Search already covers the entry body, mood, and tags since recordEditor
// searches the full record — no separate search UI needed here.

import { registerRoute } from "../router.js";
import { renderRecordSection } from "./recordEditor.js";

function render(container) {
  container.innerHTML = `
    <div class="page-heading"><h1>Journal</h1></div>
    <div id="journal-body"></div>
  `;

  renderRecordSection(container.querySelector("#journal-body"), {
    title: "Journal",
    path: ["journal", "entries"],
    fields: [
      { key: "text", label: "What happened?", type: "textarea" },
      { key: "mood", label: "Mood", type: "select", options: ["Happy", "Calm", "Playful", "Anxious", "Tired", "Sick"] },
      { key: "tags", label: "Tags (comma-separated)", type: "text" },
    ],
    icon: "book",
    addLabel: "Write entry",
    emptyLabel: "No journal entries yet — use Quick Add or the button above.",
  });
}

registerRoute("journal", render);
