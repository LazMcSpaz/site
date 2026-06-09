// Mega Millions frequency tool — runs entirely in the browser (GitHub Pages).
//
// Data: NY State open data (Socrata), the official Mega Millions history.
// Socrata serves CORS headers, so the browser can fetch it directly — no
// server, no build step, no API key.

const ENDPOINT = "https://data.ny.gov/resource/5xaw-6ayf.json";

// The current 5/70 main-ball matrix began on 2017-10-31. We never look at
// drawings before this date, per the requirement.
const ERA_START = "2017-10-31";

// ---- data ----------------------------------------------------------------

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
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
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

// ---- pure analysis (unit-testable) --------------------------------------

function subtractMonths(isoDate, months) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

// range: "era" | "12m" | "6m". Relative ranges are anchored to the most
// recent drawing in the data (sorted ascending).
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

// Top 5 most-chosen main numbers, then arranged lowest -> highest.
function topFiveLowToHigh(mainRanked) {
  return mainRanked
    .slice(0, 5)
    .map((x) => x.number)
    .sort((a, b) => a - b);
}

// Export for Node-based tests; ignored in the browser.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { subtractMonths, filterByRange, tally, rank, topFiveLowToHigh };
}

// ---- rendering -----------------------------------------------------------

function ball(n, cls = "") {
  return `<span class="ball ${cls}">${n}</span>`;
}

function renderRankList(el, ranked, draws, limit) {
  const max = ranked.length ? ranked[0].count : 0;
  const rows = ranked.slice(0, limit).map((r, i) => {
    const pct = draws ? ((r.count / draws) * 100).toFixed(1) : "0.0";
    const w = max ? (r.count / max) * 100 : 0;
    return `<tr>
      <td class="rank">${i + 1}</td>
      <td>${ball(r.number)}</td>
      <td class="count">${r.count}×</td>
      <td class="barcell"><span class="bar" style="width:${w}%"></span></td>
      <td class="pct">${pct}%</td>
    </tr>`;
  });
  el.innerHTML = `<table>${rows.join("")}</table>`;
}

let allDraws = [];
let currentRange = "era";

function render() {
  const draws = filterByRange(allDraws, currentRange);
  const { main, mega } = tally(draws);
  const mainRanked = rank(main);
  const megaRanked = rank(mega);

  const top5 = topFiveLowToHigh(mainRanked);
  document.getElementById("top5").innerHTML = top5
    .map((n) => ball(n, "big"))
    .join("");

  const range = draws.length
    ? `${draws[0].date} → ${draws[draws.length - 1].date}`
    : "—";
  document.getElementById("summary").textContent = `${draws.length} drawings  ·  ${range}`;

  renderRankList(document.getElementById("mainList"), mainRanked, draws.length, 15);
  renderRankList(document.getElementById("megaList"), megaRanked, draws.length, 15);
}

function setRange(range, btn) {
  currentRange = range;
  document
    .querySelectorAll(".toggle button")
    .forEach((b) => b.classList.toggle("active", b === btn));
  render();
}

async function init() {
  const status = document.getElementById("status");
  try {
    status.textContent = "Loading official draw history…";
    allDraws = parseDraws(await fetchDraws());
    status.style.display = "none";
    document.getElementById("app").style.display = "block";
    render();
  } catch (err) {
    status.innerHTML =
      `Could not load data: ${err.message}.<br>` +
      `The data source is <code>data.ny.gov</code>; check your connection and retry.`;
  }
}

// Wire up toggles + kick off (only in the browser).
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll(".toggle button")
      .forEach((b) => b.addEventListener("click", () => setRange(b.dataset.range, b)));
    init();
  });
}
