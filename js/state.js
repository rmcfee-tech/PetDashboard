// state.js
// Single in-memory store for the whole app. Every UI module reads from
// `getState()` and mutates only through the exported update helpers, then
// the store emits "state:changed" so any visible screen can re-render.
//
// This module has no DOM access and no storage access — it is pure state
// management, which is what keeps it easy to reason about as the app grows.

import { makeId } from "./utils.js";

let state = null;
const listeners = new Map(); // eventName -> Set<callback>

/** Default shape for a brand-new install with no saved file yet. */
export function createEmptyDocument() {
  const petId = makeId("pet");
  return {
    schemaVersion: 1,
    activePetId: petId,
    pets: [
      {
        id: petId,
        profile: {
          photoDataUrl: null, name: "", species: "dog", breed: "", sex: "",
          birthday: null, gotchaDate: null, breeder: "", microchip: "",
          registration: "", colour: "", weight: "", height: "",
          vet: { name: "", phone: "", address: "" },
          emergencyVet: { name: "", phone: "", address: "" },
          insurance: { provider: "", policyNumber: "" },
          emergencyContact: { name: "", phone: "" },
          food: { brand: "", amount: "", schedule: "" },
          favouriteToys: [], notes: "",
        },
        health: {
          vaccinations: [], medications: [], allergies: [], illnesses: [],
          injuries: [], surgeries: [], weightHistory: [], heightHistory: [],
          temperatureRecords: [], heartRateRecords: [], vetVisits: [],
          labResults: [], insuranceClaims: [],
        },
        grooming: {
          brushingLog: [], bathLog: [], professionalGroomLog: [], nailTrims: [],
          earCleaning: [], teethBrushing: [], blowDryerTraining: [],
          coatConditionNotes: [], mattingTracker: [],
          reminderRules: [
            { type: "brushing", everyDays: 3 },
            { type: "professionalGroom", everyWeeks: 7 },
          ],
        },
        training: {
          skills: [], sessions: [], achievements: [], socializationChecklist: [],
          confidenceLog: [], recallLog: [], looseLeashLog: [], retrieveLog: [],
          swimmingLog: [], impulseControlLog: [],
        },
        schedule: { dailyTasks: [], customRecurring: [], calendarEvents: [] },
        puppyDevelopment: { milestones: [], fearPeriods: [], growthStages: [], teethingLog: [] },
        cat: {
          name: "", birthday: null, introductionLog: [], sharedSpaceNotes: [],
          behaviourLog: [], stressIndicators: [],
        },
        daughter: {
          name: "", schedulePattern: "alternating-weekly", tasksCompleted: [],
          trainingSessions: [], walks: [], readingSessions: [], feedingLog: [],
          rewards: [], achievements: [],
        },
        expenses: {
          categories: ["Food", "Vet", "Insurance", "Training", "Grooming", "Equipment", "Toys", "Medication"],
          entries: [],
        },
        journal: { entries: [] },
        photos: { items: [] },
      },
    ],
    settings: {
      theme: "system",
      units: { weight: "kg", height: "cm", temperature: "C" },
      quickAddDefaults: ["weight", "taskComplete", "journal", "expense", "medication"],
    },
  };
}

/** Replace the entire in-memory document (called by storage.js after load). */
export function setState(newDoc) {
  state = newDoc;
  emit("state:changed", state);
}

/** Read-only access to the current document. */
export function getState() {
  return state;
}

/** Convenience getter for the active pet object. */
export function getActivePet() {
  if (!state) return null;
  return state.pets.find((p) => p.id === state.activePetId) || state.pets[0] || null;
}

/**
 * Apply a mutation function to the state, then notify listeners.
 * `mutator(state)` may mutate in place; it does not need to return anything.
 * This is the ONLY sanctioned way feature modules should change state.
 */
export function updateState(mutator) {
  if (!state) return;
  mutator(state);
  emit("state:changed", state);
}

/** Subscribe to an event. Returns an unsubscribe function. */
export function on(eventName, callback) {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(callback);
  return () => listeners.get(eventName)?.delete(callback);
}

/** Emit an event to all subscribers. */
export function emit(eventName, payload) {
  listeners.get(eventName)?.forEach((cb) => {
    try { cb(payload); } catch (err) { console.error(`Listener error for "${eventName}":`, err); }
  });
}
