import { IHttpClient } from "../interfaces";
import { ForecastServiceConfig } from "../config";
import { GeoLocation } from "../types/geo";
export declare class ArcGisGeocoder {
    private readonly httpClient;
    private readonly config;
    constructor(httpClient: IHttpClient, config: ForecastServiceConfig);
    geocode(location: string): Promise<GeoLocation>;
}
//# sourceMappingURL=geocoder.d.ts.map