import { MoonPhase } from "./moon-phase";

export interface MoonPhaseInfo {
  phase: MoonPhase;
  illumination: number;
  age: number;
}

export interface MoonPhaseMap {
  [date: string]: MoonPhaseInfo;
}
