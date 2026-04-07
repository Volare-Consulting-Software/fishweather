export interface MoonPhaseInfo {
  phase: string;
  illumination: number;
  age: number;
}

export interface MoonPhaseMap {
  [date: string]: MoonPhaseInfo;
}
