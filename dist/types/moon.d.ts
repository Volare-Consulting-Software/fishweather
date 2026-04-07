import { MoonPhase } from "./moonPhase";
export interface MoonPhaseInfo {
    phase: MoonPhase;
    illumination: number;
    age: number;
}
export interface MoonPhaseMap {
    [date: string]: MoonPhaseInfo;
}
//# sourceMappingURL=moon.d.ts.map