// dataExport.js
// The Settings "Export backup" button saves the *entire* JSON file for
// re-opening in this app. This module is different: it lets someone pull
// out just one dataset — weight history, expenses, training sessions,
// whatever — as a clean CSV (for a spreadsheet) or JSON (for a script or
// an AI tool), without the rest of the pet's data along for the ride.

export const EXPORTABLE_DATASETS = [
  { group: "Health", id: "health.weightHistory", label: "Weight history" },
  { group: "Health", id: "health.heightHistory", label: "Height history" },
  { group: "Health", id: "health.temperatureRecords", label: "Temperature records" },
  { group: "Health", id: "health.heartRateRecords", label: "Heart rate records" },
  { group: "Health", id: "health.vaccinations", label: "Vaccinations" },
  { group: "Health", id: "health.medications", label: "Medications" },
  { group: "Health", id: "health.allergies", label: "Allergies" },
  { group: "Health", id: "health.illnesses", label: "Illnesses" },
  { group: "Health", id: "health.injuries", label: "Injuries" },
  { group: "Health", id: "health.surgeries", label: "Surgeries" },
  { group: "Health", id: "health.vetVisits", label: "Vet visits" },
  { group: "Health", id: "health.labResults", label: "Lab results" },
  { group: "Health", id: "health.insuranceClaims", label: "Insurance claims" },

  { group: "Grooming", id: "grooming.brushingLog", label: "Brushing log" },
  { group: "Grooming", id: "grooming.bathLog", label: "Bath log" },
  { group: "Grooming", id: "grooming.professionalGroomLog", label: "Professional groom log" },
  { group: "Grooming", id: "grooming.nailTrims", label: "Nail trims" },
  { group: "Grooming", id: "grooming.earCleaning", label: "Ear cleaning" },
  { group: "Grooming", id: "grooming.teethBrushing", label: "Teeth brushing" },
  { group: "Grooming", id: "grooming.mattingTracker", label: "Matting tracker" },

  { group: "Training", id: "training.skills", label: "Skills" },
  { group: "Training", id: "training.sessions", label: "Sessions" },
  { group: "Training", id: "training.achievements", label: "Achievements" },
  { group: "Training", id: "training.socializationChecklist", label: "Socialization checklist" },
  { group: "Training", id: "training.confidenceLog", label: "Confidence log" },
  { group: "Training", id: "training.recallLog", label: "Recall log" },
  { group: "Training", id: "training.looseLeashLog", label: "Loose leash log" },
  { group: "Training", id: "training.retrieveLog", label: "Retrieve log" },
  { group: "Training", id: "training.swimmingLog", label: "Swimming log" },
  { group: "Training", id: "training.impulseControlLog", label: "Impulse control log" },

  { group: "Schedule", id: "schedule.dailyTasks", label: "Daily tasks" },
  { group: "Schedule", id: "schedule.calendarEvents", label: "Calendar events" },

  { group: "Expenses", id: "expenses.entries", label: "Expense entries" },
  { group: "Journal", id: "journal.entries", label: "Journal entries" },

  { group: "Cat", id: "cat.introductionLog", label: "Introduction log" },
  { group: "Cat", id: "cat.behaviourLog", label: "Behaviour log" },
  { group: "Cat", id: "cat.stressIndicators", label: "Stress indicators" },

  { group: "Daughter", id: "daughter.tasksCompleted", label: "Tasks completed" },
  { group: "Daughter", id: "daughter.trainingSessions", label: "Training sessions" },
  { group: "Daughter", id: "daughter.walks", label: "Walks" },
  { group: "Daughter", id: "daughter.readingSessions", label: "Reading sessions" },
  { group: "Daughter", id: "daughter.feedingLog", label: "Feeding log" },
  { group: "Daughter", id: "daughter.rewards", label: "Rewards" },
  { group: "Daughter", id: "daughter.achievements", label: "Achievements" },

  { group: "Puppy Development", id: "puppyDevelopment.milestones", label: "Milestones" },
  { group: "Puppy Development", id: "puppyDevelopment.fearPeriods", label: "Fear periods" },
  { group: "Puppy Development", id: "puppyDevelopment.growthStages", label: "Growth stages" },
  { group: "Puppy Development", id: "puppyDevelopment.teethingLog", label: "Teething log" },

  { group: "Photos", id: "photos.captions", label: "Photo captions & dates (no images)" },
];

/** Resolve a dot-path dataset id against the active pet object. */
export function getDatasetRecords(pet, datasetId) {
  if (datasetId === "photos.captions") {
    return (pet.photos.items || []).map(({ id, date, caption }) => ({ id, date, caption }));
  }
  const keys = datasetId.split(".");
  let obj = pet;
  for (const k of keys) obj = obj?.[k];
  return Array.isArray(obj) ? obj : [];
}

/**
 * Convert an array of flat-ish record objects to CSV text. Attachment
 * arrays and any base64 image data are dropped — CSV is for tabular data
 * headed to a spreadsheet or AI tool, not for re-embedding photos.
 */
export function toCSV(records) {
  if (!records.length) return "";
  const skipKeys = new Set(["attachments", "dataUrl", "photoIds"]);
  const columns = [];
  records.forEach((r) => {
    Object.keys(r).forEach((k) => {
      if (!skipKeys.has(k) && !columns.includes(k)) columns.push(k);
    });
  });

  const escapeCell = (value) => {
    if (value === null || value === undefined) return "";
    const str = Array.isArray(value) ? value.join("; ") : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const lines = [columns.join(",")];
  records.forEach((r) => {
    lines.push(columns.map((c) => escapeCell(r[c])).join(","));
  });
  return lines.join("\n");
}

/** Trigger a browser download for arbitrary text content. */
export function downloadText(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** High-level entry point used by the Settings export UI. */
export function exportDataset(pet, datasetId, format) {
  const records = getDatasetRecords(pet, datasetId);
  const label = EXPORTABLE_DATASETS.find((d) => d.id === datasetId)?.label || datasetId;
  const safeName = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const petName = (pet.profile.name || "pet").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (format === "json") {
    downloadText(JSON.stringify(records, null, 2), `${petName}-${safeName}.json`, "application/json");
  } else {
    downloadText(toCSV(records), `${petName}-${safeName}.csv`, "text/csv");
  }
  return { count: records.length, label };
}
