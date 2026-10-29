export type Source = {
  label: string;
  url: string;
  publishedIso: string;
  publishedNote?: string;
};

export const constellation = {
  totalInOrbit: 11190,
  totalWorking: 11176,
  versions: [
    {
      name: "V1 / Gen1",
      note: "Includes V1.0 and V1.5 shells in McDowell’s Gen1 subtotal.",
      inOrbit: 3127,
      working: 3116,
    },
    {
      name: "V2 Mini / Gen2",
      note: "McDowell’s Gen2 subtotal (V2 Mini and V2 Mini/Opt shells).",
      inOrbit: 8037,
      working: 8034,
    },
    {
      name: "V3 / Gen3",
      note: "Starship Flight 14 (Starlink Group 31-1) on 28 September 2026 deployed 26 V3 satellites. McDowell counts all 26 as working: 24 still in ascent and 2 drifting. None have reached an operational shell. Twenty earlier V3s failed to reach orbit.",
      inOrbit: 26,
      working: 26,
    },
  ],
  source: {
    label: "Jonathan McDowell, Starlink launch statistics",
    url: "https://planet4589.org/space/con/star/stats.html",
    publishedIso: "2026-10-29",
    publishedNote: "Census 01:44 UTC",
  } satisfies Source,
  sourceV3: {
    label: "SpaceX, Starship Flight 14",
    url: "https://www.spacex.com/launches/starship-flight-14/",
    publishedIso: "2026-09-28",
  } satisfies Source,
};

export const launches = {
  recent: [
    {
      name: "Starlink Group 15-16",
      dateIso: "2026-10-27T07:25:51Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-15",
      dateIso: "2026-10-23T22:48:44Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-25",
      dateIso: "2026-10-13T00:28:11Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 31-1 (Starship Flight 14)",
      dateIso: "2026-09-28T12:48:59Z",
      site: "Starbase, Texas",
      payload: "26\u00a0Starlink V3 satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-27",
      dateIso: "2026-09-20T01:47:00Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
    {
      name: "Starlink Group 15-24",
      dateIso: "2026-09-06T14:26:54Z",
      site: "Vandenberg SFB, California",
      payload: "27\u00a0satellites",
      status: "Launch successful",
    },
  ],
  upcoming: [
    {
      name: "Starlink Group 15-18",
      dateIso: "2026-10-31T03:48:00Z",
      site: "Vandenberg SFB, SLC-4E",
      payload: "27\u00a0satellites",
      status: "Go for launch",
    },
    {
      name: "Starlink Group 15-21",
      dateIso: "2026-11-06T02:21:00Z",
      site: "Vandenberg SFB, SLC-4E",
      payload: "27\u00a0satellites",
      status: "Go for launch",
    },
  ],
  source: {
    label: "The Space Devs Launch Library 2 API",
    url: "https://ll.thespacedevs.com/2.2.0/launch/previous/?search=Starlink&limit=6",
    publishedIso: "2026-10-29",
    publishedNote: "Fetched",
  } satisfies Source,
  upcomingSource: {
    label: "The Space Devs Launch Library 2 (upcoming) and SpaceX mission page",
    url: "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?search=Starlink&limit=8",
    publishedIso: "2026-10-29",
    publishedNote: "Fetched; SpaceX lists the same two Starlink windows",
  } satisfies Source,
};

export const finance = {
  revenueLabel: "Connectivity revenue, trailing twelve months",
  profitLabel: "Connectivity operating income, trailing twelve months",
  customersLabel: "Starlink subscribers (service lines)",
  caveat:
    "Solid line is prospectus history. After March 2026 the dashed line holds the last reported growth rate still. That is not a SpaceX forecast. Revenue and profit after year-end 2025 are trailing twelve months: 2025 plus Q1 2026 minus Q1 2025. The connectivity unit is primarily Starlink.",
  source: {
    label: "CNBC, reporting SpaceX IPO prospectus",
    url: "https://www.cnbc.com/2026/05/21/spacex-starlink-growth-profit-nasdaq-ipo.html",
    publishedIso: "2026-05-21",
  } satisfies Source,
  sourceFiling: {
    label: "SpaceX free writing prospectus, connectivity tables",
    url: "https://www.sec.gov/Archives/edgar/data/1181412/000162828026040610/spacexfwp.htm",
    publishedIso: "2026-03-31",
    publishedNote:
      "Prospectus tables for 2023–2025 and the quarter ended 31 March 2026",
  } satisfies Source,
  snapshots: [
    {
      year: 2023,
      month: 12,
      revenue: 3_869_000_000,
      profit: 469_000_000,
      customers: 2_300_000,
    },
    {
      year: 2024,
      month: 12,
      revenue: 7_599_000_000,
      profit: 2_006_000_000,
      customers: 4_400_000,
    },
    {
      year: 2025,
      month: 12,
      revenue: 11_387_000_000,
      profit: 4_423_000_000,
      customers: 8_900_000,
    },
    {
      year: 2026,
      month: 3,
      revenue: 12_169_000_000,
      profit: 4_578_000_000,
      customers: 10_300_000,
    },
  ],
  range: { startYear: 2023, startMonth: 12, endYear: 2030, endMonth: 12 },
};

export const coverage = {
  official: "150+\u00a0countries, territories, and other markets",
  prospectus: "Over 160\u00a0countries; available on all seven continents",
  sourceOfficial: {
    label: "Starlink availability map",
    url: "https://starlink.com/map",
    publishedIso: "2026-10-29",
    publishedNote: "Fetched",
  } satisfies Source,
  sourceProspectus: {
    label: "CNBC, reporting SpaceX IPO prospectus",
    url: "https://www.cnbc.com/2026/05/21/spacex-starlink-growth-profit-nasdaq-ipo.html",
    publishedIso: "2026-05-21",
  } satisfies Source,
};

export const shells = {
  rows: [
    {
      id: "53",
      name: "53°",
      altitude: "~550 km",
      note: "Main mid-latitude shells (53.0° and 53.2°).",
      inOrbit: 5108,
    },
    {
      id: "43",
      name: "43°",
      altitude: "~560 km",
      note: "Lower-inclination planes for denser coverage at temperate latitudes.",
      inOrbit: 3608,
    },
    {
      id: "70",
      name: "70°",
      altitude: "~530 km",
      note: "High-latitude shell.",
      inOrbit: 951,
    },
    {
      id: "97",
      name: "97°",
      altitude: "~560 km",
      note: "Near-polar sun-synchronous planes.",
      inOrbit: 1523,
    },
  ],
  source: {
    label: "Jonathan McDowell, Starlink launch statistics",
    url: "https://planet4589.org/space/con/star/stats.html",
    publishedIso: "2026-10-29",
    publishedNote:
      "inclination bins grouped to the four shells used on the map",
  } satisfies Source,
};

export const directToCell = {
  headline: "Text, with data rolling out on partner networks",
  note: "V2 Mini satellites carry a Direct to Cell payload. SpaceX lists text now, data and IoT from 2025, and native voice still coming. T-Mobile already sells app data over T-Satellite. KDDI has au Starlink Direct messaging; Starlink Mobile V2 voice is aimed at late 2027.",
  partners: [
    { name: "T-Mobile", market: "United States", status: "Live (text + apps)" },
    { name: "Rogers", market: "Canada", status: "Live (text)" },
    { name: "Optus", market: "Australia", status: "Live (text)" },
    { name: "Telstra", market: "Australia", status: "Partner" },
    { name: "One NZ", market: "New Zealand", status: "Live (text)" },
    { name: "KDDI", market: "Japan", status: "Live (text)" },
    { name: "Salt", market: "Switzerland", status: "Partner" },
    { name: "Entel Chile", market: "Chile", status: "Partner" },
    { name: "Entel Peru", market: "Peru", status: "Partner" },
    { name: "Kyivstar", market: "Ukraine", status: "Partner" },
  ],
  source: {
    label: "SpaceX, Direct to Cell",
    url: "https://www.starlink.com/business/direct-to-cell",
    publishedIso: "2026-10-29",
    publishedNote: "Fetched",
  } satisfies Source,
};
