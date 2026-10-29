import {
  constellation,
  launches,
  shells,
  type Source,
} from "../data/stats";

const UA = "starlink-dashboard/0.1 (public figures)";
const MCDOWELL_URL = "https://planet4589.org/space/con/star/stats.html";
const PREVIOUS_URL =
  "https://ll.thespacedevs.com/2.2.0/launch/previous/?search=Starlink&limit=8";
const UPCOMING_URL =
  "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?search=Starlink&limit=8";

// Same window as `export const revalidate` on the home page.
const DATA_REVALIDATE_SECONDS = 60 * 60;

const SHELL_IDS = ["53", "43", "70", "97"] as const;

// ponytail: Gen1 summary rows omit degrees. These are the original group shells.
// A new group number stays unbinned until it is added here.
const GEN1_GROUP_SHELL: Record<number, string> = {
  1: "53",
  2: "70",
  3: "97",
  4: "53",
  5: "43",
};

const SHELL_META = [
  {
    id: "53",
    name: "53°",
    altitude: "~550 km",
    note: "Main mid-latitude shells (53.0° and 53.2°).",
  },
  {
    id: "43",
    name: "43°",
    altitude: "~560 km",
    note: "Lower-inclination planes for denser coverage at temperate latitudes.",
  },
  {
    id: "70",
    name: "70°",
    altitude: "~530 km",
    note: "High-latitude shell.",
  },
  {
    id: "97",
    name: "97°",
    altitude: "~560 km",
    note: "Near-polar sun-synchronous planes.",
  },
] as const;

const GEN_COPY: Record<
  number,
  { id: string; name: string; short: string; note: string }
> = {
  1: {
    id: "v1",
    name: "V1 / Gen1",
    short: "V1",
    note: "V1.0 and V1.5 in McDowell’s Gen1 subtotal.",
  },
  2: {
    id: "v2",
    name: "V2 Mini / Gen2",
    short: "V2 Mini",
    note: "V2 Mini and V2 Mini/Opt in McDowell’s Gen2 subtotal.",
  },
  3: {
    id: "v3",
    name: "V3 / Gen3",
    short: "V3",
    note: "McDowell’s Gen3 subtotal.",
  },
};

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const FALLBACK_SHELL_INTRO =
  "Same four inclination bins as the ground-track colours. Counts are McDowell’s planes grouped to those bins; they sum to the in-orbit total above.";

const LIVE_SHELL_INTRO =
  "Same four inclination bins as the ground-track colours. A row that names a degree is counted there. Gen1 rows that do not name one use the original groups: 1 and 4 at 53°, 2 at 70°, 3 at 97°, and 5 at 43°. Anything else is listed on its own, and the rows still add up to the in-orbit total.";

export type VersionRow = {
  id: string;
  name: string;
  short: string;
  note: string;
  inOrbit: number;
  working: number;
};

export type ShellRow = {
  id: string;
  name: string;
  altitude: string;
  note: string;
  inOrbit: number;
};

export type Census = {
  totalInOrbit: number;
  totalWorking: number;
  versions: VersionRow[];
  shells: ShellRow[];
  shellIntro: string;
  source: Source;
  shellSource: Source;
  extraSources: Source[];
  live: boolean;
};

export type LaunchRow = {
  name: string;
  dateIso: string;
  net?: boolean;
  site: string;
  payload: string;
  status: string;
};

export type LaunchLists = {
  recent: LaunchRow[];
  upcoming: LaunchRow[];
  source: Source;
  upcomingSource: Source;
  live: boolean;
};

type LlLaunch = {
  name?: string;
  net?: string;
  status?: { name?: string; abbrev?: string };
  pad?: { name?: string; location?: { name?: string } };
  mission?: { name?: string; description?: string };
};

export function shellIdForMission(name: string) {
  const deg = name.match(/(\d+(?:\.\d+)?)\s*deg/i);
  if (deg) return nearestShell(Number(deg[1]));
  const group = name.match(/\bGroup\s+(\d+)\b/i);
  if (!group) return null;
  return GEN1_GROUP_SHELL[Number(group[1])] ?? null;
}

export function tickCounts(weights: number[], totalTicks = 29) {
  const positive = weights.filter((weight) => weight > 0).length;
  if (positive === 0) return weights.map(() => 0);
  const ticks = Math.max(totalTicks, positive);
  const extra = ticks - positive;
  const sum = weights.reduce((total, weight) => total + weight, 0);
  const raw = weights.map((weight) => (weight > 0 ? (weight / sum) * extra : 0));
  const floors = raw.map((value) => Math.floor(value));
  let left = extra - floors.reduce((total, value) => total + value, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || b.index - a.index);
  for (const item of order) {
    if (left <= 0) break;
    if (weights[item.index] <= 0) continue;
    floors[item.index] += 1;
    left -= 1;
  }
  return weights.map((weight, index) => (weight > 0 ? 1 : 0) + floors[index]);
}

export function parseMcdowell(html: string): Census {
  const updated = html.match(
    /Data last updated:\s*(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})/,
  );
  const month = updated ? MONTHS[updated[2].slice(0, 3).toLowerCase()] : 0;
  if (!updated || !month) throw new Error("McDowell page has no update date.");
  const publishedIso = `${updated[1]}-${String(month).padStart(2, "0")}-${updated[3].padStart(2, "0")}`;

  const marker = html.toLowerCase().indexOf("summary status");
  const from = marker >= 0 ? marker : 0;
  const start = html.toLowerCase().indexOf("<table", from);
  const end = html.toLowerCase().indexOf("</table>", start);
  if (start < 0 || end < 0) throw new Error("McDowell summary table is missing.");
  const tableRows = [...html.slice(start, end).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(
    (match) => cells(match[1]),
  );
  const header = tableRows.find(
    (row) => row.includes("Total In Orbit") && row.includes("Total Working"),
  );
  if (!header) throw new Error("McDowell summary columns are missing.");
  const inOrbitIdx = header.indexOf("Total In Orbit");
  const workingIdx = header.indexOf("Total Working");

  const versions: VersionRow[] = [];
  const shellCounts = new Map<string, number>(SHELL_IDS.map((id) => [id, 0]));
  const unbinnedNames: string[] = [];
  let unbinned = 0;
  let totalInOrbit = 0;
  let totalWorking = 0;
  let sawTotal = false;

  for (const row of tableRows) {
    const name = row[0]?.trim();
    if (!name || name === header[0]) continue;
    const inOrbit = cellNumber(row[inOrbitIdx] ?? "");
    const working = cellNumber(row[workingIdx] ?? "");
    if (inOrbit === null || working === null) continue;
    if (name === "Total") {
      totalInOrbit = inOrbit;
      totalWorking = working;
      sawTotal = true;
      continue;
    }
    const gen = name.match(/^Starlink Gen(\d+)$/);
    if (gen) {
      const n = Number(gen[1]);
      const copy = GEN_COPY[n] ?? {
        id: `v${n}`,
        name: `Gen${n}`,
        short: `Gen${n}`,
        note: `McDowell’s Gen${n} subtotal.`,
      };
      versions.push({ ...copy, inOrbit, working });
      continue;
    }
    if (/^Subtotal\b/i.test(name)) continue;
    const shell = shellIdForMission(name);
    if (shell && shellCounts.has(shell)) {
      shellCounts.set(shell, (shellCounts.get(shell) ?? 0) + inOrbit);
    } else if (inOrbit > 0) {
      unbinned += inOrbit;
      if (!unbinnedNames.includes(name)) unbinnedNames.push(name);
    }
  }

  const versionSum = versions.reduce((total, row) => total + row.inOrbit, 0);
  const shellSum =
    [...shellCounts.values()].reduce((total, count) => total + count, 0) + unbinned;
  if (
    !sawTotal ||
    totalWorking > totalInOrbit ||
    versions.length < 2 ||
    versionSum !== totalInOrbit ||
    shellSum !== totalInOrbit
  ) {
    throw new Error(
      `McDowell summary did not add up (in orbit ${totalInOrbit}, working ${totalWorking}, versions ${versionSum} across ${versions.length}, shells ${shellSum}).`,
    );
  }

  const source: Source = {
    label: "Jonathan McDowell, Starlink launch statistics",
    url: MCDOWELL_URL,
    publishedIso,
    publishedNote: "Fetched",
  };
  const shellRows: ShellRow[] = SHELL_META.map((meta) => ({
    ...meta,
    inOrbit: shellCounts.get(meta.id) ?? 0,
  }));
  if (unbinned > 0) {
    shellRows.push({
      id: "other",
      name: "Unstated",
      altitude: "",
      note:
        unbinnedNames.length === 1
          ? `${unbinnedNames[0]} does not name an inclination.`
          : `These rows do not name an inclination: ${unbinnedNames.join(", ")}.`,
      inOrbit: unbinned,
    });
  }

  return {
    totalInOrbit,
    totalWorking,
    versions,
    shells: shellRows,
    shellIntro: LIVE_SHELL_INTRO,
    source,
    shellSource: source,
    extraSources: [],
    live: true,
  };
}

export function parseLaunches(
  body: unknown,
  mode: "recent" | "upcoming",
  nowMs = Date.now(),
): LaunchRow[] {
  const results = (body as { results?: LlLaunch[] } | null)?.results ?? [];
  const rows: LaunchRow[] = [];
  for (const row of results) {
    const mission = row.mission?.name?.trim();
    const tail = row.name?.split("|").pop()?.trim();
    const name = mission || tail || "";
    if (!/starlink/i.test(name)) continue;
    if (!row.net || Number.isNaN(Date.parse(row.net))) continue;
    const when = Date.parse(row.net);
    const success = row.status?.abbrev === "Success";
    if (mode === "recent" && (when > nowMs || !success)) continue;
    if (mode === "upcoming" && (success || when < nowMs - 6 * 60 * 60 * 1000)) {
      continue;
    }
    const described = `${name} ${row.mission?.description ?? ""}`;
    rows.push({
      name,
      dateIso: row.net,
      net: mode === "upcoming",
      site: row.pad?.location?.name || row.pad?.name || "Pad not listed",
      payload: payloadLabel(described),
      status: row.status?.name || (mode === "upcoming" ? "Scheduled" : "Launched"),
    });
  }
  rows.sort((a, b) =>
    mode === "recent"
      ? Date.parse(b.dateIso) - Date.parse(a.dateIso)
      : Date.parse(a.dateIso) - Date.parse(b.dateIso),
  );
  return rows;
}

export async function loadCensus(): Promise<Census> {
  try {
    const res = await fetch(MCDOWELL_URL, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      next: { revalidate: DATA_REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`McDowell HTTP ${res.status}`);
    const census = parseMcdowell(await res.text());
    if (census.totalInOrbit < 1000) {
      throw new Error("McDowell total looks too small.");
    }
    return census;
  } catch (error) {
    console.error(
      "McDowell census unavailable, using the saved snapshot.",
      error instanceof Error ? error.message : error,
    );
    return fallbackCensus();
  }
}

export async function loadLaunches(): Promise<LaunchLists> {
  try {
    const [recentRes, upcomingRes] = await Promise.all([
      fetch(PREVIOUS_URL, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: DATA_REVALIDATE_SECONDS },
      }),
      fetch(UPCOMING_URL, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: DATA_REVALIDATE_SECONDS },
      }),
    ]);
    if (!recentRes.ok || !upcomingRes.ok) {
      throw new Error(
        `Launch Library HTTP ${recentRes.status}/${upcomingRes.status}`,
      );
    }
    const recent = parseLaunches(await recentRes.json(), "recent").slice(0, 6);
    const upcoming = parseLaunches(await upcomingRes.json(), "upcoming").slice(0, 6);
    if (recent.length === 0) throw new Error("Launch Library returned no recent Starlink flights.");
    const publishedIso = new Date().toISOString().slice(0, 10);
    return {
      recent,
      upcoming,
      source: {
        label: "The Space Devs Launch Library 2 API",
        url: PREVIOUS_URL,
        publishedIso,
        publishedNote: "Fetched",
      },
      upcomingSource: {
        label: "The Space Devs Launch Library 2 API",
        url: UPCOMING_URL,
        publishedIso,
        publishedNote: "Fetched",
      },
      live: true,
    };
  } catch (error) {
    console.error(
      "Launch Library unavailable, using the saved snapshot.",
      error instanceof Error ? error.message : error,
    );
    return {
      recent: launches.recent,
      upcoming: launches.upcoming,
      source: launches.source,
      upcomingSource: launches.upcomingSource,
      live: false,
    };
  }
}

function fallbackCensus(): Census {
  const shorts = [
    { id: "v1", short: "V1" },
    { id: "v2", short: "V2 Mini" },
    { id: "v3", short: "V3" },
  ];
  return {
    totalInOrbit: constellation.totalInOrbit,
    totalWorking: constellation.totalWorking,
    versions: constellation.versions.map((row, index) => ({
      id: shorts[index]?.id ?? `v${index + 1}`,
      short: shorts[index]?.short ?? row.name,
      name: row.name,
      note: row.note,
      inOrbit: row.inOrbit,
      working: row.working,
    })),
    shells: shells.rows.map((row) => ({ ...row })),
    shellIntro: FALLBACK_SHELL_INTRO,
    source: constellation.source,
    shellSource: shells.source,
    extraSources: [constellation.sourceV3],
    live: false,
  };
}

function nearestShell(deg: number) {
  return SHELL_IDS.reduce((best, shell) =>
    Math.abs(Number(shell) - deg) < Math.abs(Number(best) - deg) ? shell : best,
  );
}

function cells(rowHtml: string) {
  const out: string[] = [];
  for (const match of rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)) {
    out.push(stripTags(match[1]));
  }
  return out;
}

function stripTags(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cellNumber(value: string) {
  if (!value || value.includes("[")) return null;
  const cleaned = value.replace(/,/g, "").trim();
  if (!/^\d+$/.test(cleaned)) return null;
  return Number(cleaned);
}

function payloadLabel(text: string) {
  const count =
    text.match(/(\d+)\s+Starlink(?:\s+V\d+)?\s+satellites/i)?.[1] ??
    text.match(/batch of\s+(\d+)/i)?.[1] ??
    text.match(/(?:^|[^A-Za-z0-9])(\d+)\s+satellites/i)?.[1];
  const v3 = /\bV3\b/i.test(text);
  if (count && v3) return `${count}\u00a0Starlink V3 satellites`;
  if (count) return `${count}\u00a0satellites`;
  return v3 ? "Starlink V3 satellites" : "Starlink satellites";
}
