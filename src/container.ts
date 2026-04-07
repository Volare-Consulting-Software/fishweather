import "reflect-metadata";
import { container } from "tsyringe";
import { TOKENS } from "./interfaces";
import { DEFAULT_CONFIG } from "./config";
import {
  HttpClient,
  ArcGisGeocoder,
  NoaaTideProvider,
  MoonPhaseProvider,
  FishweatherScraper,
  ConsoleLogger,
} from "./services";

container.register(TOKENS.Config, { useValue: DEFAULT_CONFIG });
container.register(TOKENS.HttpClient, { useClass: HttpClient });
container.register(TOKENS.Logger, { useClass: ConsoleLogger });
container.register(TOKENS.Geocoder, { useClass: ArcGisGeocoder });
container.register(TOKENS.TideProvider, { useClass: NoaaTideProvider });
container.register(TOKENS.MoonPhaseProvider, { useClass: MoonPhaseProvider });
container.register(TOKENS.WeatherScraper, { useClass: FishweatherScraper });

export { container };
