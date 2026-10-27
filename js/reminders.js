// reminders.js
// Pure calculation functions the Dashboard (and later Grooming/Schedule)
// use to surface what's due. No DOM, no state mutation — everything here
// takes a pet object and returns a plain result so it's easy to test and
// easy to reuse once Grooming/Schedule get their full UIs in Stage 4.

/** Soonest upcoming vaccination due date, or null if none are tracked. */
export function nextVaccinationDue(pet) {
  const upcoming = (pet.health.vaccinations || [])
    .filter((v) => v.nextDue)
    .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
  return upcoming[0] || null;
}

/** Active (non-completed) medications. */
export function activeMedications(pet) {
  return (pet.health.medications || []).filter((m) => m.active !== "Completed");
}

/** Soonest upcoming vet visit with a future date, if any are logged as future. */
export function upcomingVetVisit(pet) {
  const today = new Date();
  const future = (pet.health.vetVisits || [])
    .filter((v) => v.date && new Date(v.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return future[0] || null;
}

/**
 * Estimate next professional grooming date from the reminder rule and the
 * most recent professional groom log entry. Returns null if there's no
 * grooming history yet to project forward from.
 */
export function nextGroomingDue(pet) {
  const rule = (pet.grooming.reminderRules || []).find((r) => r.type === "professionalGroom");
  const log = [...(pet.grooming.professionalGroomLog || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last = log[0];
  if (!last || !rule) return null;
  const next = new Date(last.date);
  next.setDate(next.getDate() + (rule.everyWeeks || 7) * 7);
  return next.toISOString().slice(0, 10);
}

/** Days between today and an ISO date string (negative if in the past). */
export function daysUntil(isoDate) {
  if (!isoDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

/** Simple training streak: consecutive days (including today) with a logged session. */
export function trainingStreak(pet) {
  const dates = new Set((pet.training.sessions || []).map((s) => s.date));
  if (dates.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (dates.has(iso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Sum of expense entries within the current calendar month. */
export function monthlySpend(pet) {
  const now = new Date();
  const total = (pet.expenses.entries || [])
    .filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  return total;
}
