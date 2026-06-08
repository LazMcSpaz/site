#!/usr/bin/env node
// Mega Millions frequency analyzer.
//
// Scrapes the full official Mega Millions draw history (every drawing since
// 2002) from New York State's open-data API and reports which numbers have
// been drawn most often.
//
//   node tools/mega-millions.mjs                # all-time, top 10
//   node tools/mega-millions.mjs --top 20       # show top 20
//   node tools/mega-millions.mjs --era          # only the current 5/70 matrix
//   node tools/mega-millions.mjs --since 2020-01-01
//   node tools/mega-millions.mjs --all          # full distribution
//   node tools/mega-millions.mjs --json         # machine-readable output
//
// Data source: https://data.ny.gov/Government-Finance/Lottery-Mega-Millions-Winning-Numbers-Beginning-20/5xaw-6ayf
// (Socrata JSON endpoint, updated after every drawing.) Requires Node >= 18
// for the built-in fetch(). No external dependencies.
//
// A note on "most often": Mega Millions has changed its number pools several
// times, so a raw all-time count is biased toward low numbers that have been
// eligible in every era. Use --era to restrict to the current matrix for a
// fair "hot numbers" view.
//
//   2002-05 .. 2005-06   5 of 52  + Mega Ball 1-52
//   2005-06 .. 2013-10   5 of 56  + Mega Ball 1-46
//   2013-10 .. 2017-10   5 of 75  + Mega Ball 1-15
//   2017-10 .. 2025-04   5 of 70  + Mega Ball 1-25
//   2025-04 .. present   5 of 70  + Mega Ball 1-24   (current)

const ENDPOINT = "https://data.ny.gov/resource/5xaw-6ayf.json";
// Start of the current 5/70 main-ball matrix (Mega Ball pool tweaked in 2025
// but the white-ball pool 1-70 is unchanged since this date).
const CURRENT_ERA_START = "2017-10-31";

function parseArgs(argv) {
  const opts = { top: 10, since: null, era: false, all: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--top") opts.top = parseInt(argv[++i], 10);
    else if (a.startsWith("--top=")) opts.top = parseInt(a.slice(6), 10);
    else if (a === "--since") opts.since = argv[++i];
    else if (a.startsWith("--since=")) opts.since = a.slice(8);
    else if (a === "--era") opts.era = true;
    else if (a === "--all") opts.all = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else {
      console.error(`Unknown argument: ${a}`);
      opts.help = true;
    }
  }
  if (opts.era && !opts.since) opts.since = CURRENT_ERA_START;
  return opts;
}

function usage() {
  console.log(
    `Mega Millions frequency analyzer\n\n` +
      `  node tools/mega-millions.mjs [options]\n\n` +
      `  --top N        how many ranked numbers to show (default 10)\n` +
      `  --era          restrict to the current 5/70 matrix (since ${CURRENT_ERA_START})\n` +
      `  --since DATE   restrict to drawings on/after DATE (YYYY-MM-DD)\n` +
      `  --all          print the full distribution, not just the top N\n` +
      `  --json         output JSON instead of tables\n` +
      `  --help         show this help\n`
  );
}

async function fetchAllDraws() {
  // The dataset is only a few thousand rows; one large page is enough, but we
  // paginate defensively in case it grows.
  const pageSize = 50000;
  let offset = 0;
  const rows = [];
  for (;;) {
    const url =
      `${ENDPOINT}?$select=draw_date,winning_numbers,mega_ball` +
      `&$order=draw_date ASC&$limit=${pageSize}&$offset=${offset}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ${res.statusText} fetching ${ENDPOINT}\n` +
          `(If you are behind a network allowlist, allow data.ny.gov.)`
      );
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

function tally(rows, since) {
  const main = new Map(); // number -> count
  const mega = new Map();
  let draws = 0;
  let firstDate = null;
  let lastDate = null;

  for (const row of rows) {
    const date = (row.draw_date || "").slice(0, 10);
    if (since && date < since) continue;
    const nums = String(row.winning_numbers || "")
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter((n) => Number.isFinite(n));
    if (nums.length < 5) continue;

    draws++;
    if (!firstDate || date < firstDate) firstDate = date;
    if (!lastDate || date > lastDate) lastDate = date;

    for (const n of nums.slice(0, 5)) main.set(n, (main.get(n) || 0) + 1);
    const mb = Number(row.mega_ball);
    if (Number.isFinite(mb)) mega.set(mb, (mega.get(mb) || 0) + 1);
  }
  return { main, mega, draws, firstDate, lastDate };
}

function ranked(map) {
  return [...map.entries()]
    .map(([n, count]) => ({ number: n, count }))
    .sort((a, b) => b.count - a.count || a.number - b.number);
}

function printTable(title, list, draws, limit) {
  console.log(`\n${title}`);
  const shown = limit ? list.slice(0, limit) : list;
  const maxCount = list.length ? list[0].count : 0;
  const barWidth = 30;
  for (let i = 0; i < shown.length; i++) {
    const { number, count } = shown[i];
    const pctOfDraws = draws ? ((count / draws) * 100).toFixed(1) : "0.0";
    const bar = "█".repeat(Math.round((count / maxCount) * barWidth));
    console.log(
      `  ${String(i + 1).padStart(3)}.  ` +
        `#${String(number).padStart(2)}  ` +
        `${String(count).padStart(4)}x  ` +
        `${pctOfDraws.padStart(5)}% of draws  ${bar}`
    );
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return usage();

  process.stderr.write("Fetching full Mega Millions draw history…\n");
  const rows = await fetchAllDraws();
  const { main: mainMap, mega, draws, firstDate, lastDate } = tally(
    rows,
    opts.since
  );

  if (draws === 0) {
    console.error("No drawings matched the given filters.");
    process.exit(1);
  }

  const mainRanked = ranked(mainMap);
  const megaRanked = ranked(mega);

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          draws,
          dateRange: { from: firstDate, to: lastDate },
          since: opts.since,
          mainNumbers: mainRanked,
          megaBall: megaRanked,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(
    `\nMega Millions — ${draws} drawings  (${firstDate} → ${lastDate})` +
      (opts.since ? `   [filtered since ${opts.since}]` : "")
  );

  const limit = opts.all ? 0 : opts.top;
  printTable("Most-drawn main numbers (white balls):", mainRanked, draws, limit);
  printTable("Most-drawn Mega Ball:", megaRanked, draws, limit);

  if (!opts.since) {
    console.log(
      `\nNote: pools changed over the years, so all-time counts favor low\n` +
        `numbers eligible in every era. Re-run with --era for the current 5/70 matrix.`
    );
  }
  console.log();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
