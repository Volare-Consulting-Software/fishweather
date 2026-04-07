export const TOKENS = {
  HttpClient: Symbol("IHttpClient"),
  Geocoder: Symbol("IGeocoder"),
  TideProvider: Symbol("ITideProvider"),
  MoonPhaseProvider: Symbol("IMoonPhaseProvider"),
  WeatherScraper: Symbol("IWeatherScraper"),
  Logger: Symbol("ILogger"),
  Config: Symbol("ForecastServiceConfig"),
  ForecastService: Symbol("ForecastService"),
} as const;
