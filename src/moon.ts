import { MoonPhaseInfo, MoonPhaseMap } from "./types";

// Moon phase calculator — pure math, no API needed.
// Uses a known new moon reference and the synodic month (29.53059 days).
const SYNODIC_MONTH = 29.53059;
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z");

export function getMoonPhase(date: Date | string): MoonPhaseInfo {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const daysSinceRef =
    (d.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);
  const cycleProgress =
    ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const age = cycleProgress;
  const illumination = Math.round(
    ((1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2) * 100
  );

  let phase: string;
  if (age < 1.85) phase = "New Moon";
  else if (age < 7.38) phase = "Waxing Crescent";
  else if (age < 9.23) phase = "First Quarter";
  else if (age < 14.77) phase = "Waxing Gibbous";
  else if (age < 16.61) phase = "Full Moon";
  else if (age < 22.15) phase = "Waning Gibbous";
  else if (age < 23.99) phase = "Last Quarter";
  else if (age < 27.68) phase = "Waning Crescent";
  else phase = "New Moon";

  return { phase, illumination, age: Math.round(age * 10) / 10 };
}

export function getMoonPhaseForDays(
  startDate: Date | string,
  numDays: number
): MoonPhaseMap {
  const phases: MoonPhaseMap = {};
  const d = new Date(startDate);
  for (let i = 0; i < numDays; i++) {
    const dateStr = d.toISOString().split("T")[0]!;
    phases[dateStr] = getMoonPhase(d);
    d.setDate(d.getDate() + 1);
  }
  return phases;
}
