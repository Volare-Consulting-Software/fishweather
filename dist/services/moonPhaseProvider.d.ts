import { IMoonPhaseProvider } from "../interfaces";
import { MoonPhaseInfo, MoonPhaseMap } from "../types/moon";
export declare class MoonPhaseProvider implements IMoonPhaseProvider {
    getPhase(date: Date | string): MoonPhaseInfo;
    getPhasesForDays(startDate: Date | string, numDays: number): MoonPhaseMap;
}
//# sourceMappingURL=moonPhaseProvider.d.ts.map