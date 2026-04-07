import { describe, it, expect } from "vitest";
import { getMoonPhase, getMoonPhaseForDays } from "../src/moon";
import { MoonPhase } from "../src/types/moon-phase";

const KNOWN_NEW_MOON_DATE = "2000-01-06";
const FULL_MOON_DATE = "2024-06-23";
const WAXING_CRESCENT_DATE = "2024-06-10";
const START_DATE = "2024-01-01";
const END_DATE_7 = "2024-01-07";

describe("getMoonPhase", () => {
  it("getMoonPhase_knownNewMoonDate_returnsNewMoonPhase", () => {
    const result = getMoonPhase(KNOWN_NEW_MOON_DATE);
    expect(result.phase).toBe(MoonPhase.NewMoon);
    expect(result.illumination).toBeLessThanOrEqual(1);
  });

  it("getMoonPhase_midLunarCycleDate_returnsFullMoon", () => {
    const result = getMoonPhase(FULL_MOON_DATE);
    expect(result.phase).toBe(MoonPhase.FullMoon);
    expect(result.illumination).toBeGreaterThan(95);
  });

  it("getMoonPhase_fewDaysAfterNewMoon_returnsWaxingCrescent", () => {
    const result = getMoonPhase(WAXING_CRESCENT_DATE);
    expect(result.phase).toBe(MoonPhase.WaxingCrescent);
    expect(result.illumination).toBeGreaterThan(0);
    expect(result.illumination).toBeLessThan(50);
  });

  it("getMoonPhase_anyDate_returnsRoundedAge", () => {
    const result = getMoonPhase(WAXING_CRESCENT_DATE);
    expect(typeof result.age).toBe("number");
    expect(result.age * 10).toBe(Math.round(result.age * 10));
  });

  it("getMoonPhase_dateObject_returnsValidPhase", () => {
    const result = getMoonPhase(new Date("2024-06-22T12:00:00Z"));
    expect(result.phase).toBe(MoonPhase.FullMoon);
  });

  it("getMoonPhase_anyDate_returnsIlluminationBetween0And100", () => {
    const result = getMoonPhase("2024-03-15");
    expect(result.illumination).toBeGreaterThanOrEqual(0);
    expect(result.illumination).toBeLessThanOrEqual(100);
  });
});

describe("getMoonPhaseForDays", () => {
  it("getMoonPhaseForDays_sevenDays_returnsMapWithSevenEntries", () => {
    const result = getMoonPhaseForDays(START_DATE, 7);
    const keys = Object.keys(result);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe(START_DATE);
    expect(keys[6]).toBe(END_DATE_7);
  });

  it("getMoonPhaseForDays_multipleDays_returnsValidMoonPhaseInfoPerEntry", () => {
    const result = getMoonPhaseForDays("2024-06-15", 3);
    for (const info of Object.values(result)) {
      expect(info).toHaveProperty("phase");
      expect(info).toHaveProperty("illumination");
      expect(info).toHaveProperty("age");
      expect(typeof info.phase).toBe("string");
      expect(info.illumination).toBeGreaterThanOrEqual(0);
      expect(info.illumination).toBeLessThanOrEqual(100);
    }
  });

  it("getMoonPhaseForDays_dateObject_returnsCorrectEntryCount", () => {
    const result = getMoonPhaseForDays(new Date(START_DATE), 3);
    expect(Object.keys(result)).toHaveLength(3);
  });
});
