// calendar.js
// Pure date-math for the Schedule page's month grid. No DOM, no state —
// just turns a year/month into a 6-week grid (including leading/trailing
// days from adjacent months) the way every calendar UI needs.

export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startWeekday);

  const weeks = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        date: new Date(cursor),
        iso: toISO(cursor),
        inMonth: cursor.getMonth() === month,
        isToday: isSameDay(cursor, new Date()),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function toISO(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
