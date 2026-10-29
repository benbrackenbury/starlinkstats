import assert from "node:assert/strict";
import { parseLaunches, parseMcdowell, shellIdForMission, tickCounts } from "./live-stats";

const html = `
<p>Data last updated: 2026 Oct 29 0144:51
<table>
<tr><th>Mission</th><th>Total In Orbit</th><th>Total Working</th></tr>
<tr><td colspan="3"><b>Starlink Gen1</b></td></tr>
<tr><td>Starlink Group 1 Early</td><td>10</td><td>9</td></tr>
<tr><td>Starlink Group 2 V1.5</td><td>4</td><td>4</td></tr>
<tr><td>Subtotal Starlink Gen1</td><td></td><td></td></tr>
<tr><td>Starlink Gen1</td><td>14</td><td>13</td></tr>
<tr><td>Starlink V2 Mini Shell 1, 53 deg</td><td>20</td><td>20</td></tr>
<tr><td>Starlink V2 Mini Shell 2, 43 deg</td><td>5</td><td>5</td></tr>
<tr><td>Starlink Gen2</td><td>25</td><td>25</td></tr>
<tr><td>Starlink V3 Simulators</td><td>[58]</td><td>0</td></tr>
<tr><td>Starlink V3</td><td>2</td><td>1</td></tr>
<tr><td>Starlink Gen3</td><td>2</td><td>1</td></tr>
<tr><td>Total</td><td>41</td><td>39</td></tr>
</table>
`;

const census = parseMcdowell(html);
assert.equal(census.totalInOrbit, 41);
assert.equal(census.totalWorking, 39);
assert.equal(census.source.publishedIso, "2026-10-29");
assert.deepEqual(
  census.versions.map((row) => [row.id, row.inOrbit, row.working]),
  [
    ["v1", 14, 13],
    ["v2", 25, 25],
    ["v3", 2, 1],
  ],
);
assert.deepEqual(
  census.shells.map((row) => [row.id, row.inOrbit]),
  [
    ["53", 30],
    ["43", 5],
    ["70", 4],
    ["97", 0],
    ["other", 2],
  ],
);

assert.equal(shellIdForMission("Starlink Group 4 V1.5 Launches"), "53");
assert.equal(
  shellIdForMission("Starlink Group 5 V1.5 Launches 43 deg (Gen2)"),
  "43",
);
assert.equal(shellIdForMission("Starlink V2 Mini Shell 4, 97.6 deg"), "97");
assert.equal(shellIdForMission("Starlink V3"), null);

assert.deepEqual(tickCounts([10, 20, 1]), [9, 18, 2]);
assert.deepEqual(tickCounts([0, 0]), [0, 0]);

const now = Date.parse("2026-10-29T12:00:00Z");
const launches = {
  results: [
    {
      name: "Falcon 9 Block 5 | Starlink Group 15-16",
      net: "2026-10-27T07:25:51Z",
      status: { name: "Launch Successful", abbrev: "Success" },
      pad: { location: { name: "Vandenberg SFB, CA, USA" } },
      mission: {
        name: "Starlink Group 15-16",
        description: "A batch of 27 satellites for the Starlink mega-constellation.",
      },
    },
    {
      name: "Falcon 9 Block 5 | Starlink Group 15-18",
      net: "2026-10-31T03:48:00Z",
      status: { name: "Go for Launch", abbrev: "Go" },
      pad: { name: "Space Launch Complex 4E" },
      mission: {
        name: "Starlink Group 15-18",
        description: "A batch of 27 satellites.",
      },
    },
    {
      name: "Falcon 9 Block 5 | Transporter",
      net: "2026-10-20T00:00:00Z",
      status: { name: "Launch Successful", abbrev: "Success" },
      mission: { name: "Transporter 12", description: "Rideshare." },
    },
  ],
};

assert.deepEqual(parseLaunches(launches, "recent", now), [
  {
    name: "Starlink Group 15-16",
    dateIso: "2026-10-27T07:25:51Z",
    net: false,
    site: "Vandenberg SFB, CA, USA",
    payload: "27\u00a0satellites",
    status: "Launch Successful",
  },
]);
assert.equal(parseLaunches(launches, "upcoming", now)[0]?.name, "Starlink Group 15-18");
assert.equal(parseLaunches(launches, "upcoming", now)[0]?.net, true);

const flight14 = parseLaunches(
  {
    results: [
      {
        net: "2026-09-28T12:48:00Z",
        status: { name: "Launch Successful", abbrev: "Success" },
        pad: { location: { name: "SpaceX Starbase, TX, USA" } },
        mission: {
          name: "Starlink Group 31-1 (Starship Flight 14)",
          description:
            "3rd flight of Starship V3. Starship will deliver 26 Starlink V3 satellites to orbit.",
        },
      },
    ],
  },
  "recent",
  now,
);
assert.equal(flight14[0]?.payload, "26\u00a0Starlink V3 satellites");

assert.throws(() => parseMcdowell("<p>no table"));
