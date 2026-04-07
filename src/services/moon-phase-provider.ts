import { injectable } from "tsyringe";
import { IMoonPhaseProvider } from "../interfaces";
import { MoonPhaseInfo, MoonPhaseMap } from "../types/moon";
import { getMoonPhase, getMoonPhaseForDays } from "../moon";

@injectable()
export class MoonPhaseProvider implements IMoonPhaseProvider {
  getPhase(date: Date | string): MoonPhaseInfo {
    return getMoonPhase(date);
  }

  getPhasesForDays(startDate: Date | string, numDays: number): MoonPhaseMap {
    return getMoonPhaseForDays(startDate, numDays);
  }
}
