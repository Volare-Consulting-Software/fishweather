import { TideStation } from "./tide";
import { ForecastRow } from "./forecast-row";

export interface ForecastResult {
  station: string;
  spotId: string;
  tideStation: TideStation | null;
  forecast: ForecastRow[];
}
