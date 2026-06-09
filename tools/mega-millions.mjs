#!/usr/bin/env node
// Mega Millions frequency analyzer (CLI companion to the web tool in
// ../mega-millions/).
//
// Looks ONLY at the current 5/70 matrix (drawings since 2017-10-31) and reports
// which numbers have been drawn most often, with last-12-months / last-6-months
// windows.
//
//   node tools/mega-millions.mjs                # 5/70 era, all of it
//   node tools/mega-millions.mjs --range 12m    # last 12 months of drawings
//   node tools/mega-millions.mjs --range 6m     # last 6 months of drawings
//   node tools/mega-millions.mjs --top 20
//   node tools/mega-millions.mjs --json
//
// Data: NY State open data (Socrata), updated after every drawing. Requires
// Node >= 18 for built-in fetch(). No external dependencies.

const ENDPOINT = "https://data.ny.gov/resource/5xaw-6ayf.json";
// Start of the current 5/70 main-ball matrix. We never look before this.
const ERA_START = "2017-10-31";

function parseArgs(argv) {
  const opts = { top: 10, range: "era", json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--top") opts.top = parseInt(argv[++i], 10);
    else if (a.startsWith("--top=")) opts.top = parseInt(a.slice(6), 10);
    else if (a === "--range") opts.range = argv[++i];
    else if (a.startsWith("--range=")) opts.range = a.slice(8);
    else if (a === "--json") opts.json = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else {
      console.error(`Unknown argument: ${a}`);
      opts.help = true;
    }
  }
  if (!["era", "12m", "6m"].includes(opts.range)) {
    console.error(`--range must be one of: era, 12m, 6m`);
    opts.help = true;
  }
  return opts;
}

function usage() {
  console.log(
    `Mega Millions frequency analyzer (current 5/70 matrix only)\n\n` +
      `  node tools/mega-millions.mjs [options]\n\n` +
      `  --range era|12m|6m   era = everything since ${ERA_START} (default),\n` +
      `                       12m/6m = last 12 / 6 months of drawings\n` +
      `  --top N              how many ranked numbers to show (default 10)\n` +
      `  --json               output JSON instead of tables\n` +
      `  --help               show this help\n`
  );
}

async function fetchDraws() {
  const params = new URLSearchParams({
    $select: "draw_date,winning_numbers,mega_ball",
    $where: `draw_date >= '${ERA_START}T00:00:00'`,
    $order: "draw_date ASC",
    $limit: "50000",
  });
  const res = await fetch(`${ENDPOINT}?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText} fetching ${ENDPOINT}\n` +
        `(If you are behind a network allowlist, allow data.ny.gov.)`
    );
  }
  return res.json();
}

function parseDraws(rows) {
  return rows
    .map((r) => ({
      date: String(r.draw_date || "").slice(0, 10),
      main: String(r.winning_numbers || "")
        .trim()
        .split(/\s+/)
        .map(Number)
        .filter(Number.isFinite)
        .slice(0, 5),
      mega: Number(r.mega_ball),
    }))
    .filter((d) => d.main.length === 5);
}

function subtractMonths(isoDate, months) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

// Relative ranges anchor to the most recent drawing (data sorted ascending).
function filterByRange(draws, range) {
  if (range === "era" || draws.length === 0) return draws;
  const latest = draws[draws.length - 1].date;
  const cutoff = subtractMonths(latest, range === "6m" ? 6 : 12);
  return draws.filter((d) => d.date >= cutoff);
}

function tally(draws) {
  const main = new Map();
  const mega = new Map();
  for (const dr of draws) {
    for (const n of dr.main) main.set(n, (main.get(n) || 0) + 1);
    if (Number.isFinite(dr.mega)) mega.set(dr.mega, (mega.get(dr.mega) || 0) + 1);
  }
  return { main, mega };
}

function rank(map) {
  return [...map.entries()]
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count || a.number - b.number);
}

function topFiveLowToHigh(mainRanked) {
  return mainRanked
    .slice(0, 5)
    .map((x) => x.number)
    .sort((a, b) => a - b);
}

function printTable(title, list, draws, limit) {
  console.log(`\n${title}`);
  const maxCount = list.length ? list[0].count : 0;
  for (let i = 0; i < Math.min(limit, list.length); i++) {
    const { number, count } = list[i];
    const pct = draws ? ((count / draws) * 100).toFixed(1) : "0.0";
    const bar = "█".repeat(Math.round((count / maxCount) * 28));
    console.log(
      `  ${String(i + 1).padStart(3)}.  #${String(number).padStart(2)}  ` +
        `${String(count).padStart(4)}x  ${pct.padStart(5)}% of draws  ${bar}`
    );
  }
}

const RANGE_LABEL = { era: "since 2017 (5/70)", "12m": "last 12 months", "6m": "last 6 months" };

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return usage();

  process.stderr.write("Fetching Mega Millions draw history (5/70 era)…\n");
  const all = parseDraws(await fetchDraws());
  const draws = filterByRange(all, opts.range);

  if (draws.length === 0) {
    console.error("No drawings matched the given range.");
    process.exit(1);
  }

  const mainRanked = rank(tally(draws).main);
  const megaRanked = rank(tally(draws).mega);
  const top5 = topFiveLowToHigh(mainRanked);

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          range: opts.range,
          draws: draws.length,
          dateRange: { from: draws[0].date, to: draws[draws.length - 1].date },
          top5MostChosenLowToHigh: top5,
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
    `\nMega Millions — ${RANGE_LABEL[opts.range]}` +
      `  ·  ${draws.length} drawings  (${draws[0].date} → ${draws[draws.length - 1].date})`
  );
  console.log(`\nTop 5 most-chosen main numbers, low → high:  ${top5.join("  ")}`);

  printTable("Most-drawn main numbers (white balls):", mainRanked, draws.length, opts.top);
  printTable("Most-drawn Mega Ball:", megaRanked, draws.length, opts.top);
  console.log();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
