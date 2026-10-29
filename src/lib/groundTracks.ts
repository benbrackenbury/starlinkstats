import type { OMMJsonObject } from "satellite.js";
import {
  degreesLat,
  degreesLong,
  eciToGeodetic,
  gstime,
  json2satrec,
  propagate,
  type SatRec,
} from "@/lib/sgp4";
import sample from "@/data/celestrak-starlink-sample.json";

export type TrackSegment = { points: string };

export const SHELLS = ["43", "53", "70", "97"] as const;
export type ShellId = (typeof SHELLS)[number];

export type GroundTrack = {
  name: string;
  catalogId: number;
  inclinationDeg: number;
  epoch: string;
  shell: ShellId;
  periodMin: number;
  omm: OMMJsonObject;
  segments: TrackSegment[];
};

export type GroundTrackSet = {
  fetchedUtc: string;
  fetchedLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  subsetNote: string;
  tracks: GroundTrack[];
};

export type GeoPosition = {
  lon: number;
  lat: number;
  altKm: number;
};

export type LiveFix = GeoPosition & {
  headingDeg: number;
};

const STEPS = 72;
const SHELL_TARGETS: ShellId[] = ["43", "53", "70", "97"];

export function lonToX(lon: number) {
  return lon + 180;
}

export function latToY(lat: number) {
  return 90 - lat;
}

export function shellForInclination(inclinationDeg: number): ShellId {
  return SHELL_TARGETS.reduce((best, shell) =>
    Math.abs(Number(shell) - inclinationDeg) <
    Math.abs(Number(best) - inclinationDeg)
      ? shell
      : best,
  );
}

export function formatLat(lat: number) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}`;
}

export function formatLon(lon: number) {
  return `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? "E" : "W"}`;
}

export function satrecFromOmm(omm: OMMJsonObject): SatRec {
  return json2satrec(omm);
}

export function positionFromSatrec(
  satrec: SatRec,
  date: Date,
): GeoPosition | null {
  const pv = propagate(satrec, date);
  if (!pv?.position) return null;
  const geo = eciToGeodetic(pv.position, gstime(date));
  return {
    lon: degreesLong(geo.longitude),
    lat: degreesLat(geo.latitude),
    altKm: geo.height,
  };
}

export function headingDeg(from: GeoPosition, to: GeoPosition) {
  let dx = lonToX(to.lon) - lonToX(from.lon);
  if (dx > 180) dx -= 360;
  if (dx < -180) dx += 360;
  const dy = latToY(to.lat) - latToY(from.lat);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export function segmentsFromLonLat(
  points: { lon: number; lat: number }[],
): TrackSegment[] {
  const segments: TrackSegment[] = [];
  let current: string[] = [];
  let prevLon: number | null = null;

  for (const point of points) {
    if (prevLon !== null && Math.abs(point.lon - prevLon) > 180) {
      if (current.length > 1) segments.push({ points: current.join(" ") });
      current = [];
    }
    current.push(
      `${lonToX(point.lon).toFixed(2)},${latToY(point.lat).toFixed(2)}`,
    );
    prevLon = point.lon;
  }
  if (current.length > 1) segments.push({ points: current.join(" ") });
  return segments;
}

export function samplePositions(
  satrec: SatRec,
  start: Date,
  durationMs: number,
  steps: number,
): GeoPosition[] {
  const points: GeoPosition[] = [];
  if (steps <= 0) return points;
  for (let i = 0; i <= steps; i += 1) {
    const date = new Date(start.getTime() + (durationMs * i) / steps);
    const geo = positionFromSatrec(satrec, date);
    if (geo) points.push(geo);
  }
  return points;
}

function epochDate(epoch: string) {
  return new Date(epoch.endsWith("Z") ? epoch : `${epoch}Z`);
}

function trackForOmm(omm: OMMJsonObject): GroundTrack | null {
  const satrec = json2satrec(omm);
  const start = epochDate(omm.EPOCH);
  const meanMotion = Number(omm.MEAN_MOTION);
  const periodMs = (1440 / meanMotion) * 60 * 1000;
  const points: { lon: number; lat: number }[] = [];

  for (let i = 0; i <= STEPS; i += 1) {
    const date = new Date(start.getTime() + (periodMs * i) / STEPS);
    const geo = positionFromSatrec(satrec, date);
    if (!geo) return null;
    points.push({ lon: geo.lon, lat: geo.lat });
  }

  return {
    name: omm.OBJECT_NAME,
    catalogId: Number(omm.NORAD_CAT_ID),
    inclinationDeg: Number(omm.INCLINATION),
    epoch: omm.EPOCH,
    shell: shellForInclination(Number(omm.INCLINATION)),
    periodMin: 1440 / meanMotion,
    omm,
    segments: segmentsFromLonLat(points),
  };
}

const TRACK_UA = "starlink-dashboard/0.1 (ground tracks)";

async function oneFreshObject(saved: OMMJsonObject) {
  try {
    const res = await fetch(
      `https://celestrak.org/NORAD/elements/gp.php?CATNR=${saved.NORAD_CAT_ID}&FORMAT=JSON`,
      {
        headers: { "User-Agent": TRACK_UA, Accept: "application/json" },
        next: { revalidate: 60 * 60 },
      },
    );
    if (!res.ok) {
      console.error(`CelesTrak GP ${saved.NORAD_CAT_ID} HTTP ${res.status}`);
      return null;
    }
    const body = (await res.json()) as OMMJsonObject[];
    const row = Array.isArray(body) ? body[0] : null;
    if (!row || Number(row.NORAD_CAT_ID) !== Number(saved.NORAD_CAT_ID)) {
      console.error(`CelesTrak GP ${saved.NORAD_CAT_ID} did not match.`);
      return null;
    }
    return row;
  } catch (error) {
    console.error(
      `CelesTrak GP ${saved.NORAD_CAT_ID} failed.`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function freshSampleObjects() {
  const saved = sample.objects as OMMJsonObject[];
  const rows = await Promise.all(saved.map((omm) => oneFreshObject(omm)));
  if (rows.some((row) => row === null)) return null;
  return rows as OMMJsonObject[];
}

function tracksFrom(objects: OMMJsonObject[]) {
  return objects
    .map(trackForOmm)
    .filter((track): track is GroundTrack => track !== null);
}

export async function getGroundTracks(): Promise<GroundTrackSet> {
  const saved = sample.objects as OMMJsonObject[];
  const fresh = await freshSampleObjects();
  const freshTracks = fresh ? tracksFrom(fresh) : [];
  const usedFresh = fresh !== null && freshTracks.length === fresh.length;
  const fetchedAt = new Date();

  return {
    fetchedUtc: usedFresh ? fetchedAt.toISOString() : sample.fetchedUtc,
    fetchedLabel: usedFresh
      ? new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(fetchedAt)
      : sample.fetchedLabel,
    sourceLabel: sample.sourceLabel,
    sourceUrl: sample.sourceUrl,
    subsetNote: sample.subsetNote,
    tracks: usedFresh ? freshTracks : tracksFrom(saved),
  };
}
