import { TidePrediction, TideStation } from "./tide";

export interface ForecastRow {
  day: string;
  date: string;
  period: string;
  windSpeed: number;
  windDirDeg: number;
  windDirCompass: string;
  waveHeight: number;
  gust: number;
  tempF: number;
  cloudPct: number;
  precipPct: number;
  moonPhase: string;
  moonIllumination: number;
  tides: TidePrediction[];
}

export interface ForecastResult {
  station: string;
  spotId: string;
  tideStation: TideStation | null;
  forecast: ForecastRow[];
}
