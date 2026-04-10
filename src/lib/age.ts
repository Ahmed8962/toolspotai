export function parseISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function diffYMD(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months--;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

export function totalDaysBetween(from: Date, to: Date) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function birthdayInYear(dob: Date, year: number) {
  const m = dob.getMonth();
  const d = dob.getDate();
  const lastDay = new Date(year, m + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  return new Date(year, m, day);
}

export function nextBirthday(dob: Date, from: Date) {
  const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = birthdayInYear(dob, from.getFullYear());
  if (next.getTime() < fromDay.getTime()) {
    next = birthdayInYear(dob, from.getFullYear() + 1);
  }
  return next;
}

export function daysUntilNextBirthday(dob: Date, from: Date) {
  const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const next = nextBirthday(dob, from);
  return totalDaysBetween(fromDay, next);
}
