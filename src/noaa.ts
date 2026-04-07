import https from "https";
import {
  GeoLocation,
  TideStation,
  TidePrediction,
  TideResult,
  GeocodeResponse,
  NoaaStation,
  NoaaStationsResponse,
  NoaaPredictionsResponse,
} from "./types";

const NOAA_API = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const NOAA_STATIONS_API =
  "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions&units=english";
const GEOCODE_API =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";

function httpGet<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`Invalid JSON from ${url}`));
          }
        });
      })
      .on("error", reject);
  });
}

export async function geocodeLocation(location: string): Promise<GeoLocation> {
  const params = new URLSearchParams({
    SingleLine: location,
    countryCode: "USA",
    category: "Populated Place",
    maxLocations: "1",
    outFields: "City,Region,RegionAbbr",
    f: "json",
  });
  const data = await httpGet<GeocodeResponse>(`${GEOCODE_API}?${params}`);
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error(`Could not geocode location: "${location}"`);
  }
  return {
    lat: candidate.location.y,
    lng: candidate.location.x,
    name: candidate.attributes.City || candidate.address,
    state: candidate.attributes.RegionAbbr || "",
  };
}

let _stationCache: NoaaStation[] | null = null;

async function getTideStations(): Promise<NoaaStation[]> {
  if (_stationCache) return _stationCache;
  const data = await httpGet<NoaaStationsResponse>(NOAA_STATIONS_API);
  _stationCache = data.stations || [];
  return _stationCache;
}

export async function findNearestTideStation(
  lat: number,
  lng: number
): Promise<TideStation> {
  const stations = await getTideStations();
  let nearest: NoaaStation | null = null;
  let minDist = Infinity;
  for (const s of stations) {
    const dist = Math.sqrt(
      Math.pow(s.lat - lat, 2) + Math.pow(s.lng - lng, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }
  if (!nearest) {
    throw new Error("No NOAA tide stations found.");
  }
  return {
    id: nearest.id,
    name: nearest.name,
    lat: nearest.lat,
    lng: nearest.lng,
  };
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function getTidePredictions(
  stationId: string,
  numDays: number = 7
): Promise<TidePrediction[]> {
  const begin = new Date();
  begin.setHours(0, 0, 0, 0);
  const end = new Date(begin);
  end.setDate(end.getDate() + numDays);

  const params = new URLSearchParams({
    begin_date: formatDate(begin),
    end_date: formatDate(end),
    station: stationId,
    product: "predictions",
    datum: "MLLW",
    time_zone: "lst_ldt",
    interval: "hilo",
    units: "english",
    format: "json",
    application: "fishweather",
  });

  const data = await httpGet<NoaaPredictionsResponse>(
    `${NOAA_API}?${params}`
  );
  if (!data.predictions) {
    throw new Error(
      data.error?.message || "No tide predictions returned from NOAA."
    );
  }

  return data.predictions.map((p) => ({
    time: p.t,
    height: parseFloat(p.v),
    type: p.type === "H" ? "High" : "Low",
  }));
}

function groupTidesByDate(
  predictions: TidePrediction[]
): Record<string, TidePrediction[]> {
  const grouped: Record<string, TidePrediction[]> = {};
  for (const p of predictions) {
    const dateStr = p.time.split(" ")[0]?.replace(
      /(\d{4})-(\d{2})-(\d{2})/,
      "$1-$2-$3"
    ) ?? "";
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr]!.push(p);
  }
  return grouped;
}

export async function getTides(
  location: string,
  numDays: number = 7
): Promise<TideResult> {
  const geo = await geocodeLocation(location);
  const station = await findNearestTideStation(geo.lat, geo.lng);
  const predictions = await getTidePredictions(station.id, numDays);
  const byDate = groupTidesByDate(predictions);
  return { station, predictions, byDate };
}
