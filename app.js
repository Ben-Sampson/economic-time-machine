/* 2026 Macro Analogs: dashboard logic. Plain JS, no build step.
   Data: data/*.json written by build_data.py (falls back to data/bundle.js on file://). */
(function () {
  "use strict";

  // ------------------------------------------------------------ config
  // Palette: slate background, sage primary; muted multi-series tones
  const SAGE = "#8fbc98", TEAL = "#6fa7ad", WGRAY = "#a8a097", SAND = "#d8c393", ROSE = "#cc8f8f", SLATE = "#9aa8bd", MAUVE = "#b49fb8";
  const C26 = SAGE, CY = SAND, CY2 = TEAL, GOLD = SAND, GREEN = SAGE, PINK = ROSE, GREY = "#a4aba6";
  const REC_FILL = "rgba(204,143,143,0.10)";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const TARGET = 2026;

  // Indicators shown in the time machine / history / snapshot
  const IND = {
    Inflation_12m: { label: "Inflation", long: "Inflation (CPI, 12-month)", unit: "%", dec: 1, chg: "pp", src: "BLS via FRED (CPIAUCSL)", explain: "How fast consumer prices rose over the past year." },
    Unemployment: { label: "Unemployment", long: "Unemployment rate", unit: "%", dec: 1, chg: "pp", src: "BLS via FRED (UNRATE)", explain: "Share of the labor force looking for work." },
    FedFunds: { label: "Fed funds rate", long: "Fed funds rate", unit: "%", dec: 2, chg: "pp", src: "Federal Reserve Board via FRED (FEDFUNDS)", explain: "The Fed's main short-term interest rate." },
    Yield_10Y: { label: "10-year yield", long: "10-year Treasury yield", unit: "%", dec: 2, chg: "pp", src: "Federal Reserve Board via FRED (GS10)", explain: "Long-term U.S. borrowing cost; it drives mortgage rates." },
    YieldCurve_10Y2Y: { label: "Yield curve", long: "Yield curve (10Y minus 2Y)", unit: " pts", dec: 2, chg: "pp", src: "St. Louis Fed via FRED (T10Y2Y), monthly average", explain: "Below zero (\"inverted\") has often come before recessions.", zero: true },
    SP_Real_YoY: { label: "Real S&P 500 (yearly change)", long: "Real S&P 500, % change vs a year earlier", unit: "%", dec: 0, chg: "pp", src: "Robert Shiller's data (inflation-adjusted S&P 500), 12-month % change only", explain: "How much stocks rose or fell over 12 months after inflation (price only).", zero: true, signed: true },
    CAPE_Annual: { label: "Stock valuation (CAPE)", long: "Stock valuation: Shiller CAPE, annual average", unit: "×", dec: 1, chg: "pct", src: "Robert Shiller's data, annual averages only", explain: "Stock prices vs 10 years of inflation-adjusted earnings. Higher = pricier. Shown as yearly averages.", annual: true },
    Oil_YoY: { label: "Oil (yearly change)", long: "Oil price, % change vs a year earlier", unit: "%", dec: 0, chg: "pp", src: "WTI via FRED (WTISPLC), 12-month % change", explain: "How much crude oil rose or fell over 12 months.", zero: true, signed: true },
    Gold: { label: "Gold", long: "Gold price ($ per ounce)", unit: "", prefix: "$", dec: 0, chg: "pct", src: "World Bank Pink Sheet (CC BY 4.0)", explain: "Price of an ounce of gold in U.S. dollars." },
    DollarIndex: { label: "Dollar", long: "U.S. dollar (broad trade-weighted index)", unit: "", dec: 1, chg: "pct", src: "Federal Reserve Board via FRED (TWEXBGSMTH; TWEXBMTH spliced before 2006)", explain: "The dollar vs trading partners' currencies. Higher = stronger." },
    HomePrice_YoY: { label: "Home prices (yearly change)", long: "Home prices, % change vs a year earlier", unit: "%", dec: 1, chg: "pp", src: "S&P CoreLogic Case-Shiller U.S. National via FRED (CSUSHPISA), % change only", explain: "How much U.S. home prices rose or fell over 12 months.", zero: true, signed: true },
    M2_YoY: { label: "Money supply growth (M2)", long: "M2 money supply, % change vs a year earlier", unit: "%", dec: 1, chg: "pp", src: "Federal Reserve Board via FRED (M2SL), 12-month % change", explain: "How fast the money supply grew over 12 months.", zero: true, signed: true },
  };
  const COMPARE_KEYS = ["Inflation_12m", "Unemployment", "FedFunds", "Yield_10Y", "YieldCurve_10Y2Y", "SP_Real_YoY", "Oil_YoY", "Gold", "DollarIndex"];
  const HISTORY_KEYS = COMPARE_KEYS.concat(["CAPE_Annual", "HomePrice_YoY", "M2_YoY"]);
  // Long-history annual series (1900+) — keys map into longAnnual.years
  const LONG_HIST = [
    { key: "inflation", label: "Inflation", long: "Inflation (Shiller CPI YoY)", unit: "%", zero: true, src: "Shiller CPI (derived YoY)" },
    { key: "unemployment", label: "Unemployment", long: "Unemployment rate", unit: "%", src: "Census HSUS D86 (est. pre-1948) / BLS UNRATE" },
    { key: "gold_yoy", label: "Gold YoY", long: "Gold, yearly change", unit: "%", zero: true, src: "Official U.S. price → World Bank Pink Sheet" },
    { key: "gold", label: "Gold ($)", long: "Gold price ($/oz)", unit: "$", src: "Official U.S. price → World Bank Pink Sheet" },
    { key: "m2_yoy", label: "M2 YoY", long: "M2 money supply, yearly change", unit: "%", zero: true, src: "Census HSUS X415 → FRED M2SL" },
    { key: "real_sp_yoy", label: "Real S&P YoY", long: "Real S&P 500, yearly change", unit: "%", zero: true, src: "Shiller (derived YoY only)" },
    { key: "cape", label: "CAPE", long: "Shiller CAPE (annual)", unit: "×", src: "Shiller (annual only)" },
    { key: "short_rate", label: "Short rate", long: "Short-term interest rate", unit: "%", src: "NBER commercial paper (chart citation) → FEDFUNDS" },
    { key: "long_rate", label: "Long rate", long: "Long-term interest rate", unit: "%", src: "Shiller long rate" },
    { key: "fed_debt_yoy", label: "Debt YoY", long: "Federal debt, yearly change", unit: "%", zero: true, src: "Treasury GFDEBTN via FRED" },
    { key: "recession_share", label: "Recession share", long: "Share of months in recession", unit: "", src: "NBER via FRED USREC (shading)" },
  ];
  const ERA_FILTERS = [
    { id: "core", label: "Since 1950 (core)" },
    { id: "all_1900", label: "All years since 1900" },
    { id: "classical_gold_standard", label: "Gold standard" },
    { id: "gold_reserve_act_wartime", label: "1934–45" },
    { id: "bretton_woods", label: "Bretton Woods" },
    { id: "fiat", label: "Fiat" },
  ];
  const SNAP_KEYS = ["Inflation_12m", "Unemployment", "FedFunds", "Yield_10Y", "YieldCurve_10Y2Y", "CAPE", "WTI_Oil", "Gold", "DollarIndex"];

  // Scoring features (annual.json) in plain English
  const FEAT = {
    inflation_12m: { name: "inflation", label: "Inflation", unit: "%", dec: 1, step: 0.1 },
    unemployment: { name: "unemployment", label: "Unemployment", unit: "%", dec: 1, step: 0.1 },
    fed_funds: { name: "the Fed funds rate", label: "Fed funds rate", unit: "%", dec: 2, step: 0.05 },
    yield_10y: { name: "the 10-year yield", label: "10-year yield", unit: "%", dec: 2, step: 0.05 },
    yield_curve: { name: "the yield curve", label: "Yield curve (10Y−2Y)", unit: " pts", dec: 2, step: 0.05 },
    cape: { name: "stock valuations", label: "Stock valuation (CAPE, avg)", unit: "×", dec: 1, step: 0.5 },
    real_sp_yoy: { name: "stock momentum", label: "Real S&P 500, yearly change", unit: "%", dec: 0, step: 1, signed: true },
    oil_yoy: { name: "oil", label: "Oil, yearly change", unit: "%", dec: 0, step: 1, signed: true },
    dollar_yoy: { name: "the dollar", label: "Dollar, yearly change", unit: "%", dec: 1, step: 0.5, signed: true },
    gold_yoy: { name: "gold", label: "Gold, yearly change", unit: "%", dec: 0, step: 1, signed: true },
    home_price_yoy: { name: "home prices", label: "Home prices, yearly change", unit: "%", dec: 1, step: 0.5, signed: true },
    recession_share: { name: "recession status", label: "Months in recession", unit: "%", dec: 0, step: 0.05, pct: true },
    m2_yoy: { name: "money-supply growth", label: "Money supply (M2), yearly change", unit: "%", dec: 1, step: 0.5, signed: true },
  };
  const MAIN_DIALS = ["inflation_12m", "unemployment", "fed_funds", "yield_10y", "yield_curve", "oil_yoy", "cape"];

  // ------------------------------------------------------------ helpers
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const isNum = (v) => typeof v === "number" && isFinite(v);
  const fx = (v, d) => isNum(v) ? v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "–";
  const signed = (v, d, unit = "") => {
    if (!isNum(v)) return "–";
    if (d === 0 && v !== 0 && Math.abs(v) < 0.5) d = 1;   // avoid a misleading "+0%"
    return (v > 0 ? "+" : v < 0 ? "−" : "±") + fx(Math.abs(v), d) + unit;
  };
  const cls = (v) => !isNum(v) ? "flat" : v > 0 ? "up" : v < 0 ? "down" : "flat";
  const monthName = (ym) => ym ? MONTHS[+ym.slice(5, 7) - 1] + " " + ym.slice(0, 4) : "";
  const tOf = (ym) => +ym.slice(0, 4) + (+ym.slice(5, 7) - 1) / 12;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function fmtInd(key, v) {
    const m = IND[key]; if (!m || !isNum(v)) return "–";
    return m.signed ? signed(v, m.dec, m.unit) : (m.prefix || "") + fx(v, m.dec) + m.unit;
  }
  function whenVisible(node, fn) {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: "300px" });
    io.observe(node);
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  async function loadData() {
    const names = ["series", "annual", "what_next", "analogs", "money", "eras", "long_annual", "analogs_long", "compare_library", "expansion", "wars"];
    try {
      if (location.protocol === "file:") throw new Error("file");
      const got = await Promise.all(names.map((n) => fetch("data/" + n + ".json", { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(n); return r.json(); })));
      return { series: got[0], annual: got[1], whatNext: got[2], analogs: got[3], money: got[4],
        eras: got[5], longAnnual: got[6], analogsLong: got[7], compareLibrary: got[8], expansion: got[9], wars: got[10] };
    } catch (e) {
      await loadScript("data/bundle.js");
      return window.MACRO_DATA;
    }
  }

  // ------------------------------------------------------------ Chart.js setup
  const HAS_CHART = typeof window.Chart !== "undefined";
  const charts = {};
  if (HAS_CHART) {
    Chart.defaults.color = GREY;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
    Chart.defaults.animation.duration = 350;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(17,20,22,0.96)";
    Chart.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,0.15)";
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.maintainAspectRatio = false;
    // shading plugin: options.plugins.bands = { bands:[[x0,x1],...], color, highlights:[{from,to,color,label}] }
    Chart.register({
      id: "bands",
      beforeDatasetsDraw(chart, _a, opts) {
        const x = chart.scales.x; if (!x || !opts) return;
        const { ctx, chartArea: ca } = chart;
        ctx.save();
        const draw = (a, b, color) => {
          let p0 = x.getPixelForValue(a), p1 = x.getPixelForValue(b);
          p0 = Math.max(p0, ca.left); p1 = Math.min(p1, ca.right);
          if (p1 > p0) { ctx.fillStyle = color; ctx.fillRect(p0, ca.top, p1 - p0, ca.bottom - ca.top); }
          return [p0, p1];
        };
        (opts.eras || []).forEach((e) => {
          const [p0, p1] = draw(e.from, e.to, e.color);
          if (e.short && p1 - p0 > 56) {
            ctx.fillStyle = "rgba(231,233,230,0.55)"; ctx.font = "600 10px " + Chart.defaults.font.family; ctx.textAlign = "left";
            if (ctx.measureText(e.short).width + 10 <= p1 - p0) ctx.fillText(e.short, p0 + 5, ca.bottom - 6);
          }
        });
        (opts.bands || []).forEach(([a, b]) => draw(a, b, REC_FILL));
        (opts.yearBands || []).forEach((yb) => draw(yb.from, yb.to, yb.color));
        (opts.highlights || []).forEach((h) => {
          const [p0, p1] = draw(h.from, h.to, h.color);
          if (h.label && p1 > p0) {
            ctx.fillStyle = h.text || "#fff"; ctx.font = "600 11px " + Chart.defaults.font.family; ctx.textAlign = "center";
            ctx.fillText(h.label, (p0 + p1) / 2, ca.top + 12);
          }
        });
        (opts.markers || []).forEach((m) => {
          const px = x.getPixelForValue(m.t);
          if (px < ca.left || px > ca.right) return;
          ctx.strokeStyle = m.color || "rgba(216,195,147,0.85)"; ctx.lineWidth = 1.5; ctx.setLineDash(m.dash || [4, 3]);
          ctx.beginPath(); ctx.moveTo(px, ca.top); ctx.lineTo(px, ca.bottom); ctx.stroke(); ctx.setLineDash([]);
          if (m.label) {
            ctx.fillStyle = m.text || SAND; ctx.font = "600 10px " + Chart.defaults.font.family; ctx.textAlign = "left";
            ctx.fillText(m.label, Math.min(px + 4, ca.right - 60), ca.top + 12);
          }
        });
        ctx.restore();
      },
    });
  }
  function axisPct(v) { return v + "%"; }

  // ------------------------------------------------------------ state
  let D, idx = {}, recBands = [], histRows = [], selectedYear = null, nextH = 12, rankFilter = "core", histLong = false, cmpId = null, cmpYear = 2007, cmpMode = "auto";

  function series(key) { return (D.series.series[key]) || (D.money && D.money.series[key]) || null; }
  function val(key, ym) { const s = series(key); const i = idx[ym]; return s && i != null ? s[i] : null; }
  function yearMonths(key, y) { return MONTHS.map((_, m) => val(key, y + "-" + String(m + 1).padStart(2, "0"))); }
  const analogRow = (y) => D.analogs.rows.find((r) => r.year === y);
  const nextRow = (y) => (D.whatNext.rows || {})[String(y)] || null;

  // ------------------------------------------------------------ sentences
  function closestFeatures(gaps, n = 2) {
    return Object.entries(gaps || {})
      .filter(([f, v]) => isNum(v) && f !== "recession_share" && FEAT[f])
      .sort((a, b) => Math.abs(a[1]) - Math.abs(b[1])).slice(0, n).map(([f]) => f);
  }
  function lastTimeSentence(year, gaps, scenario) {
    const w = nextRow(year) || {};
    if (w.callout) return w.callout;
    const f = closestFeatures(gaps).map((k) => FEAT[k].name);
    const who = f.length === 2 ? f[0] + " and " + f[1] : f[0] || "the economy";
    const verb = f.length === 2 ? "looked like" : "looked like";
    let s = "Last time " + who + " " + verb + (scenario ? " your 2026" : " they do now") + " <strong>(" + year + ")</strong>, ";
    if (isNum(w.sp_real_12m)) {
      s += "the S&amp;P 500 (real) did <strong class='" + cls(w.sp_real_12m) + "'>" + signed(w.sp_real_12m, 0, "%") + "</strong> over the next 12 months";
      s += isNum(w.sp_real_24m) ? " and <strong class='" + cls(w.sp_real_24m) + "'>" + signed(w.sp_real_24m, 0, "%") + "</strong> over 24." : ". The 24-month result isn't in yet.";
    } else s += "but what came next hasn't happened yet.";
    return cap(s);
  }
  function recessionBadge(w, h = 24) {
    const v = h === 12 ? w && w.recession_12m : w && w.recession_24m;
    if (v === true) return "<span class='badge badge-yes'>Recession within " + h + " months</span>";
    if (v === false) return "<span class='badge badge-no'>No recession within " + h + " months</span>";
    return "<span class='badge badge-na'>Recession: not known yet</span>";
  }

  // ------------------------------------------------------------ HERO + CALLOUTS
  function renderHero() {
    const A = D.analogs, top = histRows[0];
    if (A.is_placeholder) { $("placeholderBanner").classList.remove("hidden"); $("navPlaceholder").classList.remove("hidden"); }
    if (!top) return;
    $("heroYear").textContent = top.year;
    $("heroScore").textContent = fx(top.similarity_score, 0);
    requestAnimationFrame(() => $("heroRing").style.setProperty("--p", top.similarity_score));
    const w = nextRow(top.year) || {};
    $("heroNext").innerHTML =
      "<div class='hn'><div class='hn-k'>Real S&amp;P, next 12 mo</div><div class='hn-v " + cls(w.sp_real_12m) + "'>" + signed(w.sp_real_12m, 0, "%") + "</div></div>" +
      "<div class='hn'><div class='hn-k'>Next 24 mo</div><div class='hn-v " + cls(w.sp_real_24m) + "'>" + signed(w.sp_real_24m, 0, "%") + "</div></div>" +
      "<div class='hn'><div class='hn-k'>Recession ≤ 24 mo</div><div class='hn-v'>" + (w.recession_24m === true ? "Yes" : w.recession_24m === false ? "No" : "–") + "</div></div>" +
      "<p class='hero-next-cap'>What happened after December " + top.year + ". History, not a forecast.</p>";
    const ol = $("heroRunners"); ol.innerHTML = "";
    histRows.slice(1, 4).forEach((r, i) => {
      const li = el("li"); const b = el("button", "", "<span class='r-rank'>#" + (i + 2) + "</span><span class='r-year'>" + r.year + "</span><span class='r-score'>" + fx(r.similarity_score, 0) + " / 100</span>");
      b.type = "button"; b.setAttribute("aria-label", "Compare 2026 with " + r.year);
      b.onclick = () => selectYear(r.year, true); li.appendChild(b); ol.appendChild(li);
    });
    const recent = D.analogs.rows.filter((r) => r.recent && isNum(r.similarity_score)).sort((a, b) => b.similarity_score - a.similarity_score);
    if (recent.length) {
      $("heroSanity").innerHTML = "<b>Recent years (sanity check):</b> " + recent.map((r) => r.year + " scores " + fx(r.similarity_score, 0)).join(", ") +
        ". Neighbors always look alike, and their two-year aftermath hasn't happened yet, so they're left out of the headline.";
    }
  }

  function renderCallouts() {
    const box = $("callouts"); box.innerHTML = "";
    if (D.analogs.is_placeholder || D.whatNext.is_placeholder) $("calloutsExample").classList.remove("hidden");
    histRows.slice(0, 3).forEach((r, i) => {
      const w = nextRow(r.year) || {};
      const c = el("article", "callout" + (i === 0 ? " first" : ""));
      const tags = closestFeatures(r.gaps, 3).map((f) => "<span class='tag'>" + FEAT[f].label.replace(/ \(.*\)/, "") + "</span>").join("");
      c.innerHTML =
        "<div class='co-top'><div class='co-year'>" + r.year + "</div><div class='co-rank'>#" + (i + 1) + " match<br>" + fx(r.similarity_score, 0) + " / 100</div></div>" +
        "<p class='co-text'>" + lastTimeSentence(r.year, r.gaps) + "</p>" +
        "<div class='co-nums'><div class='co-num'><div class='k'>Next 12 months</div><div class='v " + cls(w.sp_real_12m) + "'>" + signed(w.sp_real_12m, 0, "%") + "</div></div>" +
        "<div class='co-num'><div class='k'>Next 24 months</div><div class='v " + cls(w.sp_real_24m) + "'>" + signed(w.sp_real_24m, 0, "%") + "</div></div></div>" +
        "<div class='match-tags' aria-label='Closest-matching indicators'>" + tags + "</div>" +
        "<div class='co-foot'>" + recessionBadge(w) + "<button class='linkbtn' type='button'>Explore " + r.year + " &rarr;</button></div>";
      c.querySelector(".linkbtn").onclick = () => selectYear(r.year, true);
      box.appendChild(c);
    });
  }

  // ------------------------------------------------------------ TIME MACHINE
  function buildYearPicker() {
    const sel = $("yearSelect");
    for (let y = TARGET - 1; y >= 1950; y--) { const o = el("option", "", String(y)); o.value = y; sel.appendChild(o); }
    sel.onchange = () => selectYear(+sel.value);
    $("prevYear").onclick = () => selectYear(Math.max(1950, selectedYear - 1));
    $("nextYear").onclick = () => selectYear(Math.min(TARGET - 1, selectedYear + 1));
    const chips = $("analogChips");
    histRows.slice(0, 6).forEach((r, i) => {
      const b = el("button", "chip", "<span class='chip-rank'>#" + (i + 1) + "</span>" + r.year); b.type = "button"; b.dataset.year = r.year;
      b.onclick = () => selectYear(r.year); chips.appendChild(b);
    });
  }

  function buildMiniGrid() {
    const grid = $("miniGrid");
    COMPARE_KEYS.forEach((key) => {
      const m = IND[key];
      const card = el("div", "mini");
      card.innerHTML = "<div class='mini-head'><span class='mini-title'>" + m.label + "</span><span class='mini-vals' id='mv-" + key + "'></span></div>" +
        "<div class='chart-box'><canvas id='mc-" + key + "' aria-label='" + m.long + ": 2026 vs selected year'></canvas></div><div class='mini-empty hidden' id='me-" + key + "'></div>";
      card.title = m.explain;
      grid.appendChild(card);
      if (!HAS_CHART) return;
      charts["mini-" + key] = new Chart($("mc-" + key), {
        type: "line",
        data: { datasets: [
          { label: "2026", data: [], borderColor: C26, backgroundColor: C26, borderWidth: 3, pointRadius: 0, pointHoverRadius: 4, tension: 0.3, spanGaps: true, order: 0 },
          { label: "year", data: [], borderColor: CY, backgroundColor: CY, borderWidth: 2.25, pointRadius: 0, pointHoverRadius: 4, tension: 0.3, spanGaps: true, order: 1 },
        ] },
        options: {
          parsing: false, interaction: { mode: "index", intersect: false },
          layout: { padding: { top: 4, right: 4 } },
          scales: {
            x: { type: "linear", min: 1, max: 12, grid: { display: false }, ticks: { stepSize: 1, autoSkip: true, maxTicksLimit: 6, callback: (v) => MONTHS[v - 1] ? MONTHS[v - 1][0] : "" } },
            y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { maxTicksLimit: 4, callback: (v) => (m.prefix || "") + (Math.abs(v) >= 1000 ? (v / 1000) + "k" : v) + (m.unit === "%" ? "%" : "") } },
          },
          plugins: {
            tooltip: { callbacks: { title: (it) => MONTHS[it[0].parsed.x - 1], label: (it) => " " + it.dataset.label + ": " + fmtInd(key, it.parsed.y) } },
            bands: { bands: [] },
          },
        },
      });
    });
  }

  function updateMiniGrid(y) {
    COMPARE_KEYS.forEach((key) => {
      const a = yearMonths(key, TARGET), b = yearMonths(key, y);
      const pts = (arr) => arr.map((v, i) => isNum(v) ? { x: i + 1, y: v } : null).filter(Boolean);
      const last = (arr) => { for (let i = arr.length - 1; i >= 0; i--) if (isNum(arr[i])) return arr[i]; return null; };
      const avg = (arr) => { const v = arr.filter(isNum); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
      $("mv-" + key).innerHTML = "<b class='v26'>" + fmtInd(key, last(a)) + "</b> vs <b class='vy'>" + fmtInd(key, avg(b)) + "</b> <span class='muted'>avg</span>";
      const empty = !b.some(isNum);
      const e = $("me-" + key); e.textContent = empty ? "No " + IND[key].label.toLowerCase() + " data for " + y : ""; e.classList.toggle("hidden", !empty);
      const ch = charts["mini-" + key]; if (!ch) return;
      ch.data.datasets[0].data = pts(a);
      ch.data.datasets[1].data = pts(b); ch.data.datasets[1].label = String(y);
      ch.options.plugins.bands.bands = recBands.filter(([s, e2]) => e2 > y && s < y + 1).map(([s, e2]) => [Math.max(s, y) - y + 1 - 0.5, Math.min(e2, y + 1) - y + 1 - 0.5]);
      ch.update();
    });
  }

  function selectYear(y, scroll) {
    selectedYear = y;
    if (!$("yearSelect").querySelector("option[value='" + y + "']")) { const o = el("option", "", String(y)); o.value = y; o.dataset.extra = "1"; $("yearSelect").appendChild(o); }
    $("yearSelect").value = y;
    $("legendYear").textContent = y; $("legendYear2").textContent = y;
    document.querySelectorAll("#analogChips .chip").forEach((c) => c.classList.toggle("active", +c.dataset.year === y));
    updateMiniGrid(y);
    renderNext(y);
    renderGaps(y);
    if (charts.history) updateHistory();
    if (charts.rank) charts.rank.update("none");
    if (scroll) $("machine").scrollIntoView({ behavior: "smooth" });
  }

  // ------------------------------------------------------------ WHAT HAPPENED NEXT
  function stat(k, v, d) { return "<div class='stat'><div class='stat-k'>" + k + "</div><div class='stat-v " + (v.cls || "") + "'>" + v.txt + "</div><div class='stat-d'>" + (d || "") + "</div></div>"; }
  // horizons: % changes in M2, gold and the S&P 500 at +12/+24/+120 months (data/what_next_horizons.csv)
  const HZ_LABEL = { 12: "1 year after", 24: "2 years after", 120: "Decade after" };
  const hzYear = (y) => (((D.whatNext || {}).horizons || {}).years || {})[String(y)] || null;
  const hzCell = (y, h) => { const z = hzYear(y); return z && z.h ? z.h[String(h)] || null : null; };
  const addMonths = (ym, k) => { const t = +ym.slice(0, 4) * 12 + (+ym.slice(5, 7) - 1) + k; return Math.floor(t / 12) + "-" + String((t % 12) + 1).padStart(2, "0"); };
  const fmtBn = (v) => !isNum(v) ? "–" : v >= 1000 ? "$" + fx(v / 1000, 2) + "T" : "$" + fx(v, v < 100 ? 1 : 0) + "B";
  const fmtOz = (v) => !isNum(v) ? "–" : "$" + fx(v, v < 100 ? 2 : 0) + "/oz";
  const longYear = (y) => (((D.longAnnual || {}).years) || []).find((r) => +r.year === y) || null;
  function hzPeriod(z, e) {
    if (!z || !e) return "";
    return z.basis === "monthly" ? monthName(z.base) + " → " + monthName(e.end) : z.base + " avg → " + e.end + " avg";
  }
  function hzCard(kind, label, color, big, from, sub) {
    return "<div class='hz' style='--hzc:" + color + "'><div class='hz-k'>" + label + "</div>" + big +
      (from ? "<div class='hz-from'>" + from + "</div>" : "") + "<div class='hz-sub'>" + (sub || "") + "</div></div>";
  }
  function hzBig(c) { return "<div class='hz-v " + cls(c.pct) + "'>" + signed(c.pct, 1, "%") + "</div>"; }
  function hzMissing(c, e, z) {
    if (!c || c.status === "pending") return ["<div class='hz-v na'>Not known yet</div>", (e ? (z.basis === "monthly" ? monthName(e.end) : e.end) : "That date") + " hasn't happened yet."];
    if (c.status === "break") return ["<div class='hz-v na'>Not comparable</div>", c.note ? cap(c.note) + "." : ""];
    if (c.status === "no_data") return ["<div class='hz-v na'>No data</div>", c.note ? cap(c.note) + "." : ""];
    return ["<div class='hz-v na'>–</div>", ""];
  }
  function renderHzCallouts(y, h) {
    const z = hzYear(y), e = hzCell(y, h), box = $("hzCallouts");
    if (!z || !e) { box.innerHTML = "<div class='hz' style='grid-column:1/-1'><div class='hz-k'>Not available</div><div class='hz-sub'>No horizon data for " + y + ".</div></div>"; return; }
    const per = hzPeriod(z, e);
    // M2
    let m2;
    if (e.m2.status === "ok") {
      m2 = hzCard("m2", "Money supply (M2)", SLATE, hzBig(e.m2), fmtBn(e.m2.from_bn) + " → " + fmtBn(e.m2.to_bn),
        per + (e.m2.basis === "annual" && z.basis === "monthly" ? "<br>" + cap(e.m2.note) + "." : e.m2.note && z.basis === "annual" ? "<br>Census HSUS X 415, annual." : ""));
    } else { const [b, s] = hzMissing(e.m2, e, z); m2 = hzCard("m2", "Money supply (M2)", SLATE, b, "", s); }
    // gold
    let gold;
    if (e.gold.status === "ok") {
      gold = hzCard("gold", "Gold price", SAND, hzBig(e.gold), fmtOz(e.gold.from) + " → " + fmtOz(e.gold.to),
        per + (e.gold.note ? "<br>" + cap(e.gold.note) + "." : ""));
    } else { const [b, s] = hzMissing(e.gold, e, z); gold = hzCard("gold", "Gold price", SAND, b, "", s); }
    // S&P
    let sp;
    if (e.sp_nom.status === "ok") {
      sp = hzCard("sp", "S&amp;P 500", SAGE, hzBig(e.sp_nom), "",
        per + " · nominal<br>After inflation: <b class='" + cls(e.sp_real.pct) + "'>" + signed(e.sp_real.pct, 1, "%") + "</b> · price only, % change only (Shiller data)");
    } else { const [b, s] = hzMissing(e.sp_nom, e, z); sp = hzCard("sp", "S&amp;P 500", SAGE, b, "", s); }
    box.innerHTML = m2 + gold + sp;
  }
  function hzStats(y, h) {
    const z = hzYear(y), e = hzCell(y, h), box = $("nextStats");
    const span = h / 12;
    const items = [];
    if (z && z.basis === "monthly") {
      const base = z.base, end = e ? e.end : addMonths(base, h);
      const d = (key) => { const a = val(key, base), b = val(key, end); return isNum(a) && isNum(b) ? b - a : null; };
      const pp = (v, dec) => ({ txt: signed(v, dec, " pts"), cls: "" });
      items.push(stat("Unemployment", pp(d("Unemployment"), 1), "change in the jobless rate"));
      items.push(stat("Inflation", pp(d("Inflation_12m"), 1), "change in 12-month CPI inflation"));
      items.push(stat("Fed funds rate", pp(d("FedFunds"), 2), "change in the Fed's rate"));
      items.push(stat("10-year yield", pp(d("Yield_10Y"), 2), "change in long-term rates"));
      if (h === 120) {
        const recs = (D.series.recessions || []).filter(([a]) => a > base && a <= end);
        const known = end <= D.series.dates[D.series.dates.length - 1];
        items.push(stat("Recessions that began", { txt: known ? String(recs.length) : "–" }, recs.length ? recs.map(([a]) => monthName(a)).join(", ") : known ? "none in the decade" : "decade not finished"));
      } else {
        const w = nextRow(y) || {};
        const v = h === 12 ? w.recession_12m : w.recession_24m;
        items.push(stat("Recession within " + h + " mo", { txt: v === true ? "Yes" : v === false ? "No" : "–" }, v === true && w.recession_start ? "began " + monthName(w.recession_start) : ""));
      }
    } else if (z) {
      const a = longYear(y), b = longYear(y + span);
      const d = (k) => a && b && isNum(a[k]) && isNum(b[k]) ? b[k] - a[k] : null;
      const pp = (v, dec) => ({ txt: signed(v, dec, " pts"), cls: "" });
      items.push(stat("Unemployment", pp(d("unemployment"), 1), "annual average" + (a && a.unemployment_is_estimate ? " (HSUS estimate)" : "")));
      items.push(stat("Inflation", pp(d("inflation"), 1), "annual CPI inflation"));
      items.push(stat("Short-term rate", pp(d("short_rate"), 2), "commercial paper (NBER) before 1954"));
      items.push(stat("Long-term rate", pp(d("long_rate"), 2), "long government bond yield"));
      const yrs = []; for (let k = 1; k <= span; k++) { const r = longYear(y + k); if (r && (r.recession_share || 0) > 0) yrs.push(y + k); }
      items.push(stat("Years with a recession", { txt: yrs.length + " of " + span }, yrs.length ? yrs.join(", ") : "none"));
    }
    box.innerHTML = items.join("");
  }
  function renderNext(y) {
    const h = nextH, z = hzYear(y), e = hzCell(y, h);
    $("nextTitle").textContent = "After " + y + ", what happened next?";
    if (z && e) {
      $("nextSub").textContent = (z.basis === "monthly" ? "From " + monthName(z.base) + " to " + monthName(e.end) + " (" + (h === 120 ? "10 years" : h + " months") + ")." :
        "Annual averages, " + y + " to " + e.end + " (monthly data for this era aren't in our panel).") + " Rates change in percentage points (pts); M2, gold and stocks in %.";
    } else $("nextSub").textContent = "";
    renderHzCallouts(y, h);
    hzStats(y, h);
    renderNextChart(y, h);
    renderNextTable(y);
  }
  function renderNextChart(y, h) {
    const z = hzYear(y);
    const span = h === 120 ? 120 : 24;
    const monthly = !z || z.basis === "monthly";
    $("nextChartTitle").innerHTML = (span === 120 ? "The 10 years after " : "The 24 months after ") + (monthly ? "December " + y : y + " <span class='muted'>(annual averages)</span>");
    $("nextChartAxis").innerHTML = "Left axis: rates, %. Right axis: gold and M2, % change since " + (monthly ? "Dec " + y : y) + ". ◆ S&amp;P 500 % change at " + (span === 120 ? "+12, +24 and +120" : "+12 and +24") + " months (no monthly path: licence). Rose bands = recession.";
    if (!HAS_CHART) return;
    const ds = [];
    const lineDs = (label, color, pts, opt) => Object.assign({ label, borderColor: color, backgroundColor: color, borderWidth: 1.75, pointRadius: monthly ? 0 : 2.5, tension: monthly ? 0.25 : 0, data: pts, yAxisID: "y", spanGaps: false }, opt || {});
    let bands = [];
    if (monthly) {
      const base = (z && z.base) || y + "-12";
      const ks = Array.from({ length: span + 1 }, (_, k) => k);
      const pts = (fn) => ks.map((k) => { const v = fn(addMonths(base, k)); return isNum(v) ? { x: k, y: v } : null; }).filter(Boolean);
      const lv = (key) => (ym) => { const L = (D.money || {}).levels || {}; const i = idx[ym]; return L[key] && i != null ? L[key][i] : null; };
      const goldAt = (ym) => { const v = val("Gold", ym); return isNum(v) ? v : (ym < "1960-01" && ym >= "1934-02" ? 35 : null); };
      const chg = (fn) => { const b0 = fn(base); return (ym) => { const v = fn(ym); return isNum(v) && isNum(b0) && b0 ? (v / b0 - 1) * 100 : null; }; };
      ds.push(lineDs("Gold, % since base", SAND, pts(chg(goldAt)), { borderWidth: 3.25, yAxisID: "y2", order: 0 }));
      ds.push(lineDs("M2, % since base", SLATE, pts(chg(lv("M2"))), { borderWidth: 3.25, yAxisID: "y2", order: 0 }));
      ds.push(lineDs("Unemployment", SAGE, pts((ym) => val("Unemployment", ym))));
      ds.push(lineDs("Inflation", MAUVE, pts((ym) => val("Inflation_12m", ym))));
      ds.push(lineDs("Fed funds", TEAL, pts((ym) => val("FedFunds", ym))));
      ds.push(lineDs("10-year yield", WGRAY, pts((ym) => val("Yield_10Y", ym)), { borderDash: [5, 4] }));
      const t0 = tOf(base);
      bands = recBands.filter(([s, e]) => e > t0 && s < t0 + span / 12).map(([s, e]) => [Math.max(0, (s - t0) * 12), Math.min(span, (e - t0) * 12)]);
    } else {
      const n = span / 12, a = longYear(y);
      const ks = Array.from({ length: n + 1 }, (_, k) => k);
      const pts = (fn) => ks.map((k) => { const r = longYear(y + k); const v = r ? fn(r, y + k) : null; return isNum(v) ? { x: k * 12, y: v } : null; }).filter(Boolean);
      const chg = (key, okFn) => (r, yr) => a && isNum(a[key]) && isNum(r[key]) && a[key] && (!okFn || okFn(yr)) ? (r[key] / a[key] - 1) * 100 : null;
      ds.push(lineDs("Gold, % since base", SAND, pts(chg("gold")), { borderWidth: 3.25, yAxisID: "y2", order: 0 }));
      ds.push(lineDs("M2, % since base", SLATE, pts(chg("m2_bn", (yr) => yr < 1959)), { borderWidth: 3.25, yAxisID: "y2", order: 0 }));
      ds.push(lineDs("Unemployment", SAGE, pts((r) => r.unemployment)));
      ds.push(lineDs("Inflation", MAUVE, pts((r) => r.inflation)));
      ds.push(lineDs("Short rate", TEAL, pts((r) => r.short_rate)));
      ds.push(lineDs("Long rate", WGRAY, pts((r) => r.long_rate), { borderDash: [5, 4] }));
      const x = (t) => (t - y - 0.5) * 12;
      bands = longRecessionBands().concat(recBands.filter(([s]) => s >= 1950).map(([s, e]) => ({ from: s, to: e })))
        .map((b) => Array.isArray(b) ? b : [b.from, b.to]).filter(([s, e]) => e > y && s < y + n + 1)
        .map(([s, e]) => [Math.max(0, x(s)), Math.min(span, x(e))]).filter(([s, e]) => e > s);
    }
    const spPts = [12, 24, 120].filter((k) => k <= span).map((k) => { const c = hzCell(y, k); return c && c.sp_nom && isNum(c.sp_nom.pct) ? { x: k, y: c.sp_nom.pct } : null; }).filter(Boolean);
    ds.push({ type: "scatter", label: "S&P 500 (nominal), % at +12/+24" + (span === 120 ? "/+120" : "") + " mo", data: spPts, yAxisID: "y2", pointStyle: "rectRot", pointRadius: 7, pointHoverRadius: 9,
      backgroundColor: "#e7e9e6", borderColor: "#16191c", borderWidth: 1.5, order: -1, clip: false });
    if (charts.next) charts.next.destroy();
    const baseLbl = monthly ? "Dec " + y : String(y);
    // align the zero lines of the two y axes (rates % on the left, % change on the right)
    const ext = (axis) => { const v = ds.filter((d) => (d.yAxisID || "y") === axis).flatMap((d) => d.data.map((p) => p.y)).filter(isNum); return [Math.min(0, ...v), Math.max(0, ...v)]; };
    const pad = (lo, hi) => { const r = (hi - lo) || 1; return [lo < 0 ? lo - 0.08 * r : 0, hi + 0.08 * r]; };
    let [l0, l1] = pad(...ext("y")), [r0, r1] = pad(...ext("y2"));
    const f = Math.max(-l0 / (l1 - l0), -r0 / (r1 - r0));
    if (f > 0 && f < 1) { if (-l0 / (l1 - l0) < f) l0 = -f * l1 / (1 - f); else r0 = -f * r1 / (1 - f); }
    const spLabels = { id: "spLabels", afterDatasetsDraw(c) {
      const i = c.data.datasets.findIndex((d) => d.type === "scatter"); if (i < 0) return;
      const m = c.getDatasetMeta(i); if (m.hidden) return; const ctx = c.ctx; ctx.save();
      ctx.font = "700 11px " + Chart.defaults.font.family; ctx.fillStyle = "#e7e9e6";
      const boxes = [];
      m.data.forEach((pt, k) => { const v = c.data.datasets[i].data[k].y; const t = "S&P " + signed(v, 1, "%");
        const w = ctx.measureText(t).width; const right = pt.x + 12 + w > c.chartArea.right;
        const x0 = right ? pt.x - 12 - w : pt.x + 12, yb = pt.y + (v >= 0 ? -10 : 16);
        if (boxes.some((b) => x0 < b[1] && x0 + w > b[0] && Math.abs(yb - b[2]) < 14)) return;   // skip overlapping labels (narrow screens)
        boxes.push([x0, x0 + w, yb]); ctx.textAlign = "left"; ctx.fillText(t, x0, yb); });
      ctx.restore(); } };
    const xLbl = (v) => v === 0 ? baseLbl : span === 120 ? (v % 12 === 0 ? "+" + v / 12 + " yr" : "") : "+" + v + " mo";
    const narrow = ($("nextChart").parentNode.clientWidth || 800) < 520;
    const endTick = (fmt) => (v, i, arr) => {   // hide non-round min/max labels created by the zero alignment
      if ((i === 0 || i === arr.length - 1) && arr.length > 3) { const st = Math.abs(arr[2].value - arr[1].value); if (st && Math.abs(v / st - Math.round(v / st)) > 1e-6) return ""; }
      return fmt(v);
    };
    charts.next = new Chart($("nextChart"), {
      type: "line", data: { datasets: ds }, plugins: [spLabels],
      options: {
        parsing: false, interaction: { mode: "nearest", axis: "x", intersect: false }, layout: { padding: { right: 4, top: 6 } },
        scales: {
          x: { type: "linear", min: 0, max: span, grid: { display: false }, ticks: { stepSize: span === 120 ? (narrow ? 24 : 12) : 6, maxRotation: 0, callback: xLbl } },
          y: { position: "left", min: l0, max: l1, grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.05)" }, ticks: { maxTicksLimit: 6, callback: endTick((v) => Math.round(v * 10) / 10 + "%") }, title: { display: !narrow, text: "rates, %", color: "#7b837e", font: { size: 11 } } },
          y2: { position: "right", min: r0, max: r1, grid: { display: false }, ticks: { maxTicksLimit: 6, callback: endTick((v) => (v > 0 ? "+" : "") + Math.round(v) + "%") }, title: { display: !narrow, text: "change since " + baseLbl, color: "#7b837e", font: { size: 11 } } },
        },
        plugins: { legend: { display: true, position: "top", align: "start", labels: { boxWidth: narrow ? 8 : 12, boxHeight: 3, padding: narrow ? 6 : 10, font: { size: narrow ? 10 : 12 },
            generateLabels: (c) => Chart.defaults.plugins.legend.labels.generateLabels(c).map((l) => Object.assign(l, { text: l.text.replace(", % since base", "").replace(/ \(nominal\), % at .*/, " (◆)") })) } }, bands: { bands },
          tooltip: { callbacks: { title: (it) => { const v = it[0].parsed.x; return v === 0 ? baseLbl : span === 120 && v % 12 === 0 ? "+" + v / 12 + " years" : "+" + v + " months"; },
            label: (it) => " " + it.dataset.label.replace(", % since base", "").replace(/, % at .*/, "") + ": " + (it.dataset.yAxisID === "y2" ? signed(it.parsed.y, 1, "%") + " since " + baseLbl : fx(it.parsed.y, 2) + "%") } } },
      },
    });
  }

  function renderNextTable(y) {
    const h = nextH;
    const rows = histRows.slice(0, 5).slice();
    if (!rows.some((r) => r.year === y) && y < TARGET) rows.push({ year: y, similarity_score: (analogRowAny(y) || {}).similarity_score, _sel: true });
    const hl = h === 120 ? "10 yr" : h + " mo";
    $("nextTableTitle").innerHTML = "Across the top analog years · " + HZ_LABEL[h].toLowerCase() + " <span class='muted'>(from December of each year; before 1950, annual averages)</span>";
    let html = "<thead><tr><th>Year</th><th>Similarity</th><th>M2 " + hl + "</th><th>Gold " + hl + "</th><th>S&amp;P " + hl + "</th><th>Real S&amp;P " + hl + "</th><th>" + (h === 120 ? "Recessions began" : "Recession ≤ " + h + " mo") + "</th></tr></thead><tbody>";
    const pc = (c, d) => c && c.status === "ok" && isNum(c.pct) ? "<td class='" + cls(c.pct) + "'>" + signed(c.pct, d, "%") + "</td>" : "<td class='muted'>" + (c && c.status === "pending" ? "not yet" : c && c.status === "break" ? "n/c" : "–") + "</td>";
    rows.forEach((r) => {
      const w = nextRow(r.year) || {}, e = hzCell(r.year, h) || {};
      let rec = "–";
      if (h === 120) {
        const z = hzYear(r.year);
        if (z && z.basis === "monthly" && e.end && e.end <= D.series.dates[D.series.dates.length - 1]) rec = String((D.series.recessions || []).filter(([a]) => a > z.base && a <= e.end).length);
      } else {
        const v = h === 12 ? w.recession_12m : w.recession_24m;
        rec = v === true ? "<span class='badge badge-yes'>Yes</span>" : v === false ? "<span class='badge badge-no'>No</span>" : "–";
      }
      html += "<tr data-year='" + r.year + "' class='" + (r.year === y ? "sel" : "") + "'><td><b>" + r.year + "</b>" + (r._sel ? " <span class='muted small'>(selected)</span>" : "") + "</td><td>" + fx(r.similarity_score, 0) + "</td>" +
        pc(e.m2, 1) + pc(e.gold, 1) + pc(e.sp_nom, 1) + pc(e.sp_real, 1) + "<td>" + rec + "</td></tr>";
    });
    $("nextTable").innerHTML = html + "</tbody>";
    $("nextTable").querySelectorAll("tr[data-year]").forEach((tr) => tr.onclick = () => selectYear(+tr.dataset.year));
    const top5 = histRows.slice(0, 5);
    const rng = (k) => { const v = top5.map((r) => (hzCell(r.year, h) || {})[k]).filter((c) => c && c.status === "ok" && isNum(c.pct)).map((c) => c.pct).sort((a, b) => a - b); return v; };
    const sp = rng("sp_nom"), g = rng("gold"), m = rng("m2");
    const txt = (v) => v.length ? "<strong>" + signed(v[0], 0, "%") + "</strong> to <strong>" + signed(v[v.length - 1], 0, "%") + "</strong>" : "–";
    if (sp.length) {
      let s = "Across the top 5 matches, " + HZ_LABEL[h].toLowerCase() + ": S&amp;P 500 " + txt(sp) + ", gold " + txt(g) + ", M2 " + txt(m) + " (" + sp.length + " of 5 with a finished " + (h === 120 ? "decade" : "window") + ").";
      if (h !== 120) { const rec = top5.map((r) => nextRow(r.year) || {}).filter((w) => w.recession_24m === true).length; s += " " + rec + " of 5 were followed by a recession within two years."; }
      $("nextSummary").innerHTML = s + " Same-looking years, very different endings.";
    } else $("nextSummary").innerHTML = "";
  }

  // ------------------------------------------------------------ SNAPSHOT
  function sparkSVG(vals, color) {
    const v = vals.map((x) => (isNum(x) ? x : null)); const nums = v.filter(isNum); if (nums.length < 2) return "";
    const min = Math.min(...nums), max = Math.max(...nums), W = 200, H = 36, pad = 3;
    const pts = v.map((x, i) => x == null ? null : [(i / (v.length - 1)) * W, H - pad - ((x - min) / (max - min || 1)) * (H - 2 * pad)]).filter(Boolean);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const last = pts[pts.length - 1];
    return "<svg class='spark' viewBox='0 0 " + W + " " + H + "' preserveAspectRatio='none' aria-hidden='true'><path d='" + d + "' fill='none' stroke='" + color + "' stroke-width='2' vector-effect='non-scaling-stroke'/><circle cx='" + last[0] + "' cy='" + last[1] + "' r='3' fill='" + color + "'/></svg>";
  }
  function renderSnapshot() {
    const box = $("snapshotCards"), S = Object.assign({}, D.series.snapshot);
    const ci = D.annual.features.indexOf("cape");
    if (ci >= 0) {
      const yrs = D.annual.years.filter((y) => isNum(D.annual.values[y][ci]));
      const vals = yrs.map((y) => D.annual.values[y][ci]);
      S.CAPE = { month: null, label: TARGET + " avg so far", value: D.annual.values[TARGET][ci], prev_month: String(TARGET - 1), prev_value: D.annual.values[TARGET - 1][ci],
        avg: vals.reduce((a, b) => a + b, 0) / vals.length, spark: vals.slice(-30) };
    }
    SNAP_KEYS.forEach((key) => {
      const s = S[key]; if (!s) return;
      let label, valHtml, chg, explain, src;
      if (key === "WTI_Oil") {
        label = "Oil (WTI)"; valHtml = "$" + fx(s.value, 0) + "<span class='snap-unit'>/bbl</span>";
        const p = isNum(s.prev_value) ? (s.value / s.prev_value - 1) * 100 : null;
        chg = "<b>" + signed(p, 0, "%") + "</b> vs " + monthName(s.prev_month); explain = "Price of a barrel of U.S. crude. Sparkline: yearly % change."; src = "FRED (WTISPLC)";
      } else if (key === "CAPE") {
        label = "Stock valuation (CAPE)"; valHtml = fx(s.value, 1) + "<span class='snap-unit'>×</span>";
        chg = "<b>" + signed((s.value / s.prev_value - 1) * 100, 0, "%") + "</b> vs " + s.prev_month + " avg";
        explain = "Price of stocks vs 10 years of earnings. Long-run average: " + fx(s.avg, 0) + "×. Annual averages only."; src = "Robert Shiller (annual averages)";
      } else {
        const m = IND[key]; label = m.long.replace(/ \(.*\)/, ""); if (key === "Inflation_12m") label = "CPI inflation";
        valHtml = (m.prefix || "") + fx(s.value, m.dec) + "<span class='snap-unit'>" + (m.unit.trim() || "") + "</span>";
        const d = isNum(s.prev_value) ? (m.chg === "pct" ? (s.value / s.prev_value - 1) * 100 : s.value - s.prev_value) : null;
        chg = "<b>" + (m.chg === "pct" ? signed(d, 1, "%") : signed(d, 2, " pts")) + "</b> vs " + monthName(s.prev_month); explain = m.explain; src = m.src;
      }
      const card = el("article", "snap");
      card.innerHTML = "<div class='snap-top'><span class='snap-label'>" + label + "</span><span class='snap-month'>" + (s.label || monthName(s.month)) + "</span></div>" +
        "<div class='snap-val'>" + valHtml + "</div><div class='snap-chg'>" + chg + "</div>" + sparkSVG(s.spark || [], C26) +
        "<p class='snap-explain'>" + explain + "</p>";
      card.title = "Source: " + src;
      box.appendChild(card);
    });
  }

  // ------------------------------------------------------------ RANKING + GAPS
  function initRankFilter() {
    const box = $("rankFilter"); if (!box) return;
    box.innerHTML = "";
    ERA_FILTERS.forEach((f) => {
      const b = el("button", "chip" + (f.id === rankFilter ? " active" : ""), f.label);
      b.type = "button"; b.dataset.filter = f.id; b.setAttribute("role", "tab");
      b.onclick = () => { rankFilter = f.id; box.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b)); renderRanking(); };
      box.appendChild(b);
    });
  }
  function rankRows() {
    if (rankFilter === "core") {
      return D.analogs.rows.filter((r) => isNum(r.similarity_score)).slice(0, 20).map((r) => ({ ...r, score_kind: "core" }));
    }
    const L = D.analogsLong || {};
    if (!L.available) return [];
    let rows;
    if (rankFilter === "all_1900") rows = L.rows.slice();
    else rows = (L.by_era[rankFilter] || []).slice();
    return rows.filter((r) => isNum(r.similarity_score)).slice(0, 20).map((r) => ({
      ...r, recent: r.year >= 2024, historical_rank: r.era_rank || r.rank, score_kind: "long",
    }));
  }
  function bestHistorical(rows) {
    return rows.find((r) => !r.recent && isNum(r.similarity_score));
  }
  function renderRanking() {
    if (!HAS_CHART) return;
    const rows = rankRows();
    const long = rankFilter !== "core";
    const best = bestHistorical(rows);
    $("rankTitle").innerHTML = (long ? "Top years · long-history score (9 features)" : "Top 20 years by similarity") +
      (D.analogs.is_placeholder ? " <span class='pill pill-warn'>Example data</span>" : "") +
      " <span class='muted'>(sand = year in the time machine · grey = recent, sanity check only)</span>";
    const eraLabel = (ERA_FILTERS.find((f) => f.id === rankFilter) || {}).label || "";
    if (long && best) {
      $("rankEraBest").innerHTML = "Best match in <b>" + eraLabel + "</b>: <b>" + best.year + "</b> (similarity " + fx(best.similarity_score, 1) +
        "). " + (best.year === 1929 ? "2026’s closest gold-standard-era match is 1929 — see the Monetary eras section for what happened next." : "Tap the bar to load it into the time machine.") +
        " <span class='muted'>Long-history score uses 9 features; the 1950+ core score is unchanged.</span>";
    } else if (long) {
      $("rankEraBest").innerHTML = "<span class='muted'>Long-history score uses 9 features available since ~1900. The 1950+ core score (13 features) is unchanged.</span>";
    } else {
      $("rankEraBest").innerHTML = "";
    }
    if (charts.rank) charts.rank.destroy();
    charts.rank = new Chart($("rankChart"), {
      type: "bar",
      data: { labels: rows.map((r) => String(r.year)), datasets: [{ data: rows.map((r) => r.similarity_score), borderRadius: 6, borderSkipped: false, barPercentage: 0.8,
        backgroundColor: (ctx) => { const r = rows[ctx.dataIndex]; if (!r) return SAGE; if (r.recent) return "rgba(168,160,151,0.35)"; if (r.year === selectedYear) return SAND; return "rgba(143,188,152,0.75)"; } }] },
      options: {
        indexAxis: "y", animation: { duration: 600 },
        scales: { x: { min: 0, max: 100, grid: { color: "rgba(255,255,255,0.05)" } }, y: { grid: { display: false }, ticks: { autoSkip: false, font: { weight: 600 } } } },
        plugins: { tooltip: { callbacks: { label: (it) => { const r = rows[it.dataIndex]; return " Similarity " + fx(r.similarity_score, 1) + (r.recent ? " (recent year, sanity check)" : (r.historical_rank ? " · #" + r.historical_rank : "")); } } } },
        onClick: (_e, els) => { if (els.length) selectYear(rows[els[0].index].year, true); },
        onHover: (e, els) => { e.native.target.style.cursor = els.length ? "pointer" : "default"; },
      },
    });
    // gaps: prefer core gaps; fall back to long-history gaps
    if (selectedYear) renderGaps(selectedYear);
  }
  function analogRowAny(y) {
    return analogRow(y) || ((D.analogsLong || {}).rows || []).find((r) => r.year === y) || null;
  }
  function renderGaps(y) {
    $("gapYear").textContent = y;
    if (!HAS_CHART) return;
    const r = analogRowAny(y); const gaps = (r && r.gaps) || {};
    const featLabel = (f) => (FEAT[f] ? FEAT[f].label : f).replace(/ \(.*\)/, "").replace(", yearly change", " (yoy)").replace(/_/g, " ");
    const keys = Object.keys(gaps).filter((f) => isNum(gaps[f]) && f !== "recession_share").sort((a, b) => Math.abs(gaps[a]) - Math.abs(gaps[b]));
    const labels = keys.map(featLabel), data = keys.map((f) => gaps[f]);
    const colors = data.map((v) => Math.abs(v) < 0.5 ? GREEN : Math.abs(v) < 1 ? GOLD : PINK);
    if (!charts.gap) {
      charts.gap = new Chart($("gapChart"), {
        type: "bar", data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, borderSkipped: false, barPercentage: 0.75 }] },
        options: { indexAxis: "y", scales: { x: { suggestedMin: -2, suggestedMax: 2, grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.05)" }, title: { display: true, text: "← lower than 2026   ·   z-score gap   ·   higher than 2026 →" } }, y: { grid: { display: false }, ticks: { autoSkip: false } } },
          plugins: { tooltip: { callbacks: { label: (it) => " " + signed(it.parsed.x, 2) + " standard deviations" } } } },
      });
    } else {
      Object.assign(charts.gap.data, { labels }); Object.assign(charts.gap.data.datasets[0], { data, backgroundColor: colors }); charts.gap.update();
    }
    if (!keys.length) $("gapYear").textContent = y + " (no scored gaps)";
  }

  // ------------------------------------------------------------ HISTORY
  let histKey = "Inflation_12m", histFrom = 1950, longKey = "inflation";
  function eraBands() { return ((D.eras || {}).bands || []).map((e) => ({ from: e.from, to: e.to, color: e.color, short: e.short })); }
  function nixonMarker() { const n = (D.eras || {}).nixon; return n ? [{ t: n.t, label: "Aug 1971: gold window closed" }] : []; }
  function longYears() { return ((D.longAnnual || {}).years || []); }
  function longRecessionBands() {
    // annual recession share → tinted year bands (pre-1950 only; 1950+ use monthly bands)
    return longYears().filter((r) => +r.year < 1950 && isNum(r.recession_share) && r.recession_share > 0)
      .map((r) => ({ from: +r.year, to: +r.year + 1, color: "rgba(204,143,143," + (0.05 + 0.12 * r.recession_share).toFixed(3) + ")" }));
  }
  function renderHistoryTabs() {
    const tabs = $("historyTabs");
    tabs.innerHTML = "";
    if (histFrom < 1950) {
      LONG_HIST.forEach((m) => {
        if (!longYears().some((r) => isNum(r[m.key]))) return;
        const b = el("button", "chip" + (m.key === longKey ? " active" : ""), m.label); b.type = "button"; b.setAttribute("role", "tab");
        b.onclick = () => { longKey = m.key; tabs.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b)); updateHistory(); };
        tabs.appendChild(b);
      });
    } else {
      HISTORY_KEYS.forEach((k) => {
        if (!series(k) && !IND[k].annual) return;
        const b = el("button", "chip" + (k === histKey ? " active" : ""), IND[k].label); b.type = "button"; b.setAttribute("role", "tab");
        b.onclick = () => { histKey = k; tabs.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b)); updateHistory(); };
        tabs.appendChild(b);
      });
    }
    document.querySelectorAll("#rangeToggle button").forEach((b) => b.onclick = () => {
      const was = histFrom < 1950;
      histFrom = +b.dataset.from; document.querySelectorAll("#rangeToggle button").forEach((x) => x.classList.toggle("active", x === b));
      if (was !== (histFrom < 1950)) renderHistoryTabs();
      updateHistory();
    });
    renderEraLegend();
  }
  function renderEraLegend() {
    const box = $("eraLegend"); if (!box) return;
    box.innerHTML = eraBands().map((e) => "<span><i style='background:" + e.color.replace(/0\.1\d?\)/, "0.6)") + "'></i>" + e.short + "</span>").join("") +
      "<span><i style='background:rgba(204,143,143,0.45)'></i>Recession</span><span><i style='background:none;border-left:2px dashed " + SAND + ";width:0;height:12px'></i>Aug 1971</span>";
  }
  function updateHistory() {
    if (!HAS_CHART) return;
    const longMode = histFrom < 1950;
    let data = [], title, explain, note = "", annualPts = false, zero = false, fmt;
    if (longMode) {
      const m = LONG_HIST.find((x) => x.key === longKey) || LONG_HIST[0];
      longYears().forEach((r) => { if (isNum(r[m.key])) data.push({ x: +r.year + 0.5, y: r[m.key] }); });
      title = m.long; annualPts = true; zero = !!m.zero;
      fmt = (v) => m.unit === "$" ? "$" + fx(v, 0) : m.unit === "×" ? fx(v, 1) + "×" : m.unit === "%" ? fx(v, 1) + "%" : fx(v, 2);
      explain = "Annual averages, 1900–2026. Source: " + m.src + "." + (m.key === "unemployment" ? " Pre-1948 values are Census Historical Statistics estimates." : "") +
        (m.key === "gold" || m.key === "gold_yoy" ? " Before 1971 the official dollar price of gold was fixed by law ($20.67, then $35 from 1934), so it only moved when the law changed." : "") +
        (m.key === "short_rate" ? " Pre-1954 short rate: NBER commercial-paper series via FRED (chart with citation; no download)." : "");
      const first = data.length ? Math.floor(data[0].x) : 1900;
      note = first > 1900 ? "(data from " + first + ")" : "";
    } else {
      const m = IND[histKey], dates = D.series.dates;
      if (m.annual) {
        const ci = D.annual.features.indexOf("cape");
        D.annual.years.forEach((y) => { const v = D.annual.values[y][ci]; if (isNum(v)) data.push({ x: +y + 0.5, y: v }); });
        annualPts = true;
      } else series(histKey).forEach((v, i) => { if (isNum(v)) data.push({ x: tOf(dates[i]), y: v }); });
      const first = data.length ? data[0].x : 1950;
      title = m.long; zero = !!m.zero; fmt = (v) => fmtInd(histKey, v);
      note = first > 1950.5 ? "(data from " + Math.floor(first) + ")" : "";
      explain = m.explain + " Source: " + m.src + ".";
    }
    $("historyTitle").textContent = title;
    $("historyNote").textContent = note;
    $("historyExplain").textContent = explain;
    const hl = [{ from: TARGET, to: TARGET + 1, color: "rgba(143,188,152,0.20)", label: "2026", text: C26 }];
    if (selectedYear) hl.push({ from: selectedYear, to: selectedYear + 1, color: "rgba(216,195,147,0.22)", label: String(selectedYear), text: CY });
    const xmax = TARGET + 1;
    const plug = { eras: eraBands(), bands: recBands, yearBands: longMode ? longRecessionBands() : [], highlights: hl, markers: nixonMarker() };
    if (charts.history) charts.history.destroy();
    charts.history = new Chart($("historyChart"), {
      type: "line",
      data: { datasets: [{ data, borderColor: C26, borderWidth: 1.75, pointRadius: annualPts ? 2 : 0, pointHoverRadius: 3, tension: 0, spanGaps: false, stepped: annualPts && !longMode ? "middle" : false }] },
      options: {
        parsing: false, normalized: true, interaction: { mode: "nearest", axis: "x", intersect: false },
        scales: { x: { type: "linear", min: histFrom, max: xmax, grid: { display: false }, ticks: { callback: (v) => Number.isInteger(v) ? v : "", maxTicksLimit: 12 } },
          y: { type: longMode && longKey === "gold" ? "logarithmic" : "linear", ticks: { includeBounds: false }, grid: { color: (c) => (zero && c.tick.value === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)") } } },
        plugins: { bands: plug,
          tooltip: { callbacks: { title: (it) => { const t = it[0].parsed.x; const y = Math.floor(t + 1e-6); return annualPts ? y + " average" : MONTHS[Math.round((t - y) * 12)] + " " + y; }, label: (it) => " " + fmt(it.parsed.y) } } },
      },
    });
    if (!(longMode && longKey === "gold")) {
      const vis = data.filter((p) => p.x >= histFrom).map((p) => p.y);
      if (vis.length) { const lo = Math.min(...vis), hi = Math.max(...vis), pad = (hi - lo) * 0.06 || 1; charts.history.options.scales.y.min = lo - pad; charts.history.options.scales.y.max = hi + pad; charts.history.update("none"); }
    }
  }


  // ------------------------------------------------------------ BUILD YOUR OWN 2026
  let B = null;
  function initBuilder() {
    const A = D.annual, F = A.features;
    const actual = A.values[String(A.target_year)];
    B = { F, actual: actual.slice(), cur: actual.slice(), inputs: {}, lastTop: null };
    const mk = (f, host) => {
      const i = F.indexOf(f); if (i < 0) return;
      const meta = FEAT[f] || { label: f, unit: "", dec: 2, step: 0.1 };
      const hist = Object.values(A.values).map((v) => v[i]).filter(isNum);
      let lo = Math.min(...hist), hi = Math.max(...hist);
      const span = hi - lo; lo = lo - span * 0.05; hi = hi + span * 0.05;
      if (f === "recession_share") { lo = 0; hi = 1; }
      lo = Math.floor(lo / meta.step) * meta.step; hi = Math.ceil(hi / meta.step) * meta.step;
      const a = actual[i] == null ? (lo + hi) / 2 : actual[i];
      const show = (v) => meta.pct ? fx(v * 100, 0) + "%" : (meta.signed ? signed(v, meta.dec, meta.unit) : fx(v, meta.dec) + meta.unit);
      const row = el("div", "dial");
      const id = "dial-" + f;
      row.innerHTML = "<div class='dial-top'><label class='dial-label' for='" + id + "'>" + meta.label + "</label><span class='dial-val' id='" + id + "-v'>" + show(a) + "</span>" +
        "<button class='dial-reset' type='button' id='" + id + "-r' disabled title='Reset to actual 2026'>&#8634; 2026</button></div>" +
        "<div class='dial-track'><input type='range' id='" + id + "' min='" + lo + "' max='" + hi + "' step='" + meta.step + "' value='" + a + "'><span class='dial-actual' style='left:" + ((a - lo) / (hi - lo) * 100) + "%'></span></div>" +
        "<div class='dial-meta'><span>" + show(lo) + "</span><span>actual 2026: " + show(a) + "</span><span>" + show(hi) + "</span></div>";
      host.appendChild(row);
      const inp = row.querySelector("input"), out = row.querySelector(".dial-val"), rb = row.querySelector(".dial-reset");
      const paint = () => { inp.style.setProperty("--fill", ((inp.value - lo) / (hi - lo) * 100) + "%"); };
      const set = (v, silent) => {
        inp.value = v; B.cur[i] = +v; out.textContent = show(+v); paint();
        const changed = Math.abs(+v - a) > meta.step / 2; out.classList.toggle("changed", changed); rb.disabled = !changed;
        if (!silent) scheduleScore();
      };
      inp.addEventListener("input", () => set(inp.value));
      rb.onclick = () => set(a);
      B.inputs[f] = { set, actual: a, lo, hi };
      paint();
    };
    MAIN_DIALS.forEach((f) => mk(f, $("dials")));
    F.filter((f) => !MAIN_DIALS.includes(f)).forEach((f) => mk(f, $("dialsMore")));
    $("resetAll").onclick = () => { Object.values(B.inputs).forEach((d) => d.set(d.actual, true)); scheduleScore(); };

    const presets = [
      { name: "Actual 2026", v: {} },
      { name: "1970s stagflation", v: { inflation_12m: 10, unemployment: 7, fed_funds: 10, yield_10y: 9, yield_curve: -0.5, oil_yoy: 60, cape: 9, gold_yoy: 50, real_sp_yoy: -20 } },
      { name: "Dot-com mania", v: { inflation_12m: 2.5, unemployment: 4, fed_funds: 5.5, yield_10y: 6, yield_curve: 0.1, oil_yoy: 40, cape: 42, real_sp_yoy: 20 } },
      { name: "Deep recession", v: { inflation_12m: 1, unemployment: 9, fed_funds: 0.25, yield_10y: 3, yield_curve: 2.5, oil_yoy: -35, cape: 18, real_sp_yoy: -25, recession_share: 0.75 } },
      { name: "Money-printing boom", v: { inflation_12m: 5, unemployment: 4, fed_funds: 0.25, yield_10y: 1.8, yield_curve: 1.2, oil_yoy: 50, cape: 36, m2_yoy: 18, gold_yoy: 15, real_sp_yoy: 20, home_price_yoy: 15 } },
    ];
    const pbox = $("presets");
    presets.forEach((p) => {
      const b = el("button", "chip" + (p.name === "Actual 2026" ? " active" : ""), p.name); b.type = "button";
      b.onclick = () => {
        pbox.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b));
        Object.entries(B.inputs).forEach(([f, d]) => d.set(f in p.v ? Math.min(d.hi, Math.max(d.lo, p.v[f])) : d.actual, true));
        scheduleScore();
      };
      pbox.appendChild(b);
    });
    $("builderOut").addEventListener("click", () => $("builderOut").classList.toggle("expanded"));
    $("boNote").innerHTML = "Same method as the main ranking: annual averages, z-scores using fixed 1950–2026 means and spreads, weighted distance (" +
      (A.weights_source.indexOf("analog_weights") >= 0 ? "weights from the scoring step, currently equal" : "equal weights") + "). " +
      "Recent years (" + D.analogs.recent_years_excluded_from_headline.join(", ") + ") are skipped because their aftermath isn't known yet. Dials not shown stay at 2026's actual values.";
    scoreNow();
  }
  let raf = 0;
  function scheduleScore() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; scoreNow(); }); }
  function scoreBuilder(vec) {
    const A = D.annual, F = A.features, W = A.weights;
    const feats = F.filter((f) => W[f] > 0);
    const z = (f, v) => (v - A.means[f]) / A.sds[f];
    const zt = {}; feats.forEach((f) => { const v = vec[F.indexOf(f)]; zt[f] = isNum(v) ? z(f, v) : null; });
    const total = feats.reduce((s, f) => s + W[f], 0);
    const out = [];
    for (const ys in A.values) {
      const y = +ys; if (y === A.target_year) continue;
      const v = A.values[ys]; let wu = 0, ss = 0; const gaps = {};
      feats.forEach((f) => { const x = v[F.indexOf(f)]; if (isNum(x) && zt[f] != null) { const g = z(f, x) - zt[f]; wu += W[f]; ss += W[f] * g * g; gaps[f] = g; } });
      if (!wu) continue;
      out.push({ year: y, d: Math.sqrt(ss / wu), ok: wu / total >= A.min_weight_share, gaps });
    }
    const dmax = Math.max(...out.filter((r) => r.ok).map((r) => r.d));
    out.forEach((r) => r.sim = r.ok ? 100 * (1 - r.d / dmax) : null);
    return out.filter((r) => r.ok).sort((a, b) => a.d - b.d);
  }
  function scoreNow() {
    const recent = new Set(D.analogs.recent_years_excluded_from_headline || []);
    const ranked = scoreBuilder(B.cur).filter((r) => !recent.has(r.year));
    const top = ranked.slice(0, 3); if (!top.length) return;
    const t = top[0];
    const topEl = $("boTop");
    if (B.lastTop !== t.year) {
      topEl.innerHTML = "<span class='bo-year pop'>" + t.year + "</span><span class='bo-score'><b>" + fx(t.sim, 0) + "</b> / 100</span>";
      B.lastTop = t.year;
    } else topEl.querySelector(".bo-score").innerHTML = "<b>" + fx(t.sim, 0) + "</b> / 100";
    $("boList").innerHTML = top.map((r, i) => "<li class='bo-row'><span class='n'>#" + (i + 1) + "</span><span class='y'>" + r.year + "</span><span class='bo-bar'><i style='width:" + Math.max(2, r.sim) + "%'></i></span><span class='s'>" + fx(r.sim, 0) + "</span></li>").join("");
    const w = nextRow(t.year) || {};
    $("boCallout").innerHTML = lastTimeSentence(t.year, t.gaps, true) + " " + recessionBadge(w);
    $("boMini").innerHTML = "After " + t.year + ": real S&amp;P <b class='" + cls(w.sp_real_12m) + "'>" + signed(w.sp_real_12m, 0, "%") + "</b> (12 mo), <b class='" + cls(w.sp_real_24m) + "'>" + signed(w.sp_real_24m, 0, "%") + "</b> (24 mo) · recession ≤24 mo: <b>" + (w.recession_24m === true ? "yes" : w.recession_24m === false ? "no" : "–") + "</b>";
  }

  // ------------------------------------------------------------ MONEY & HARD ASSETS
  const MONEY_SERIES = [
    { key: "M2_YoY", label: "M2 money supply", color: SAGE, on: true },
    { key: "FedBalanceSheet_YoY", label: "Fed balance sheet", color: TEAL, on: true },
    { key: "Gold_YoY", label: "Gold", color: SAND, on: true },
    { key: "Oil_YoY", label: "Oil", color: WGRAY, on: false },
    { key: "HomePrice_YoY", label: "Home prices", color: SLATE, on: false },
    { key: "MonetaryBase_YoY", label: "Monetary base", color: MAUVE, on: false },
    { key: "FedDebt_YoY", label: "Federal debt", color: ROSE, on: false },
  ];
  let moneyFrom = 2000;
  function renderMoney() {
    const M = D.money || {};
    if (!M.available) { $("moneyComing").classList.remove("hidden"); $("moneyBody").classList.add("hidden"); return; }
    renderFindings();
    // latest stats
    const st = $("moneyStats");
    const lastOf = (key) => { const s = series(key); if (!s) return null; for (let i = s.length - 1; i >= 0; i--) if (isNum(s[i])) return { v: s[i], m: D.series.dates[i] }; return null; };
    [["M2_YoY", "M2 money supply"], ["RealM2_Growth", "Real M2 (after inflation)"], ["FedBalanceSheet_YoY", "Fed balance sheet"], ["MonetaryBase_YoY", "Monetary base"], ["FedDebt_YoY", "Federal debt"]].forEach(([k, label]) => {
      const l = lastOf(k); if (!l) return;
      st.insertAdjacentHTML("beforeend", stat(label, { txt: signed(l.v, 1, "%"), cls: cls(l.v) }, "vs a year earlier · " + monthName(l.m)));
    });
    // toggles
    const tg = $("moneyToggles");
    MONEY_SERIES.forEach((s) => {
      if (!series(s.key)) return;
      const b = el("button", "chip" + (s.on ? " active" : ""), "<i class='sw' style='background:" + s.color + ";width:12px;margin-right:6px;vertical-align:middle'></i>" + s.label); b.type = "button";
      b.setAttribute("aria-pressed", s.on);
      b.onclick = () => { s.on = !s.on; b.classList.toggle("active", s.on); b.setAttribute("aria-pressed", s.on); updateMoneyChart(); };
      tg.appendChild(b);
    });
    document.querySelectorAll("#moneyRange button").forEach((b) => b.onclick = () => {
      moneyFrom = +b.dataset.from; document.querySelectorAll("#moneyRange button").forEach((x) => x.classList.toggle("active", x === b)); updateMoneyChart();
    });
    whenVisible($("moneyChart"), updateMoneyChart);
    initCycles();
  }
  function updateMoneyChart() {
    if (!HAS_CHART) return;
    const dates = D.series.dates;
    const ds = MONEY_SERIES.filter((s) => s.on && series(s.key)).map((s) => ({
      label: s.label, borderColor: s.color, backgroundColor: s.color, borderWidth: s.key === "M2_YoY" ? 2.5 : 1.75, pointRadius: 0, tension: 0.2,
      data: series(s.key).map((v, i) => isNum(v) && tOf(dates[i]) >= moneyFrom ? { x: tOf(dates[i]), y: v } : null).filter(Boolean),
    }));
    if (!charts.money) {
      charts.money = new Chart($("moneyChart"), {
        type: "line", data: { datasets: ds },
        options: {
          parsing: false, normalized: true, interaction: { mode: "index", intersect: false },
          scales: { x: { type: "linear", min: moneyFrom, max: TARGET + 1, grid: { display: false }, ticks: { callback: (v) => Number.isInteger(v) ? v : "", maxTicksLimit: 10 } },
            y: { suggestedMin: -20, suggestedMax: 40, grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)" }, ticks: { callback: axisPct } } },
          plugins: { legend: { display: true, position: "top", align: "start", labels: { boxWidth: 12, boxHeight: 3, usePointStyle: false } }, bands: { bands: recBands, eras: eraBands(), markers: nixonMarker() },
            tooltip: { callbacks: { title: (it) => { const t = it[0].parsed.x; const y = Math.floor(t + 1e-6); return MONTHS[Math.round((t - y) * 12)] + " " + y; }, label: (it) => " " + it.dataset.label + ": " + signed(it.parsed.y, 1, "%") } } },
        },
      });
    } else { charts.money.data.datasets = ds; charts.money.options.scales.x.min = moneyFrom; charts.money.update(); }
  }

  function renderFindings() {
    const E = (D.money.cycles || {}).easing || [], H = (D.money.cycles || {}).hiking || [];
    const box = $("findings"); box.innerHTML = "";
    const cur = E.find((c) => String(c.status || "").startsWith("ongoing"));
    const done = (arr) => arr.filter((c) => !String(c.status || "").startsWith("ongoing") && (c.months || 0) >= 6);
    const yr = (c) => c.start.slice(0, 4) + "–" + (c.end || "").slice(2, 4);
    const card = (k, big, txt) => box.insertAdjacentHTML("beforeend", "<article class='finding'><div class='finding-k'>" + k + "</div><div class='finding-big'>" + big + "</div><p>" + txt + "</p></article>");
    if (cur) {
      const y0 = val("Yield_10Y", cur.start), y1 = val("Yield_10Y", cur.end);
      const others = done(E).filter((c) => isNum(c.yield_10y_chg_during_pp));
      const maxOther = others.reduce((m, c) => (c.yield_10y_chg_during_pp > m.v ? { v: c.yield_10y_chg_during_pp, c } : m), { v: -Infinity });
      if (isNum(cur.yield_10y_chg_during_pp))
        card("Bonds aren't buying the cuts", signed(cur.yield_10y_chg_during_pp, 1, " pts"),
          "The 10-year yield has <strong>risen</strong> since the Fed started easing in " + monthName(cur.start) + " (" + fx(y0, 2) + "% → " + fx(y1, 2) + "%). In no earlier easing cycle of 6+ months did it rise more than <strong>" + signed(maxOther.v, 2, " pts") + "</strong>.");
      const g0 = val("Gold", cur.start), g1 = val("Gold", cur.end);
      const gOthers = done(E).concat(E.filter((c) => c !== cur && (c.months || 0) < 6)).filter((c) => c !== cur && isNum(c.gold_chg_during_pct));
      const gMax = gOthers.reduce((m, c) => (c.gold_chg_during_pct > m.v ? { v: c.gold_chg_during_pct, c } : m), { v: -Infinity });
      if (isNum(cur.gold_chg_during_pct))
        card("Gold's best easing on record", signed(cur.gold_chg_during_pct, 0, "%"),
          "Gold went from $" + fx(g0, 0) + " to $" + fx(g1, 0) + " during this easing, the biggest gain in any easing cycle since 1960. The previous high: about <strong>" + signed(gMax.v, 0, "%") + "</strong> in " + (gMax.c ? yr(gMax.c) : "–") + ".");
    }
    const big = done(H).filter((c) => c.recession_within_24m_after_end != null && c.recession_within_24m_after_end !== "");
    const m2min = H.filter((c) => isNum(c.m2_yoy_chg_during_pp)).reduce((m, c) => (c.m2_yoy_chg_during_pp < m.v ? { v: c.m2_yoy_chg_during_pp, c } : m), { v: Infinity });
    if (m2min.c) {
      const nRec = big.filter((c) => +c.recession_within_24m_after_end === 1).length;
      const c = m2min.c, noRec = +c.recession_within_24m_after_end === 0;
      card("The money squeeze that didn't bite", signed(m2min.v, 1, " pts"),
        "The " + yr(c) + " hikes caused the sharpest collapse in M2 growth on record" + (noRec ? ", yet <strong>no recession</strong> followed within 24 months" : "") + ". By contrast, <strong>" + nRec + " of " + big.length + "</strong> substantial hiking cycles were followed by one.");
    }
  }

  let cycleKind = "easing";
  function initCycles() {
    const C = D.money.cycles || {};
    if (!((C.easing || []).length || (C.hiking || []).length)) { $("cyclesCard").innerHTML = "<span class='pill pill-warn'>Data coming</span> <span class='muted'>Fed-cycle tables not found yet.</span>"; return; }
    document.querySelectorAll("#cycleKind button").forEach((b) => b.onclick = () => {
      cycleKind = b.dataset.kind; document.querySelectorAll("#cycleKind button").forEach((x) => { x.classList.toggle("active", x === b); x.setAttribute("aria-selected", x === b); }); fillCycles();
    });
    $("cycleShort").onchange = fillCycles;
    $("cycleSelect").onchange = renderCycle;
    fillCycles();
  }
  function cycleList() {
    const all = (D.money.cycles[cycleKind] || []).slice();
    return $("cycleShort").checked ? all : all.filter((c) => (c.months || 0) >= 6 || String(c.status || "").startsWith("ongoing"));
  }
  function fillCycles() {
    const sel = $("cycleSelect"); sel.innerHTML = "";
    cycleList().slice().reverse().forEach((c) => {
      const ongoing = String(c.status || "").startsWith("ongoing");
      const o = el("option", "", monthName(c.start) + " → " + (ongoing ? "now" : monthName(c.end)) + " · " + signed(c.size_pp, 2, " pts") + (ongoing ? " (ongoing)" : ""));
      o.value = c.start; sel.appendChild(o);
    });
    renderCycle();
  }
  function renderCycle() {
    const c = cycleList().find((x) => x.start === $("cycleSelect").value); if (!c) return;
    const ongoing = String(c.status || "").startsWith("ongoing");
    const s = (k, label, unit, d, note) => stat(label, { txt: signed(c[k], d, unit), cls: cls(c[k]) }, note);
    $("cycleStats").innerHTML =
      stat("Fed funds", { txt: fx(c.fedfunds_start, 2) + "% → " + fx(c.fedfunds_end, 2) + "%" }, c.months + " months" + (ongoing ? ", still going" : "")) +
      s("yield_10y_chg_during_pp", "10-year yield, during", " pts", 2, "after 12 mo: " + signed(c.yield_10y_chg_12m_after_pp, 2, " pts")) +
      s("m2_yoy_chg_during_pp", "M2 growth, during", " pts", 1, "after 12 mo: " + signed(c.m2_yoy_chg_12m_after_pp, 1, " pts")) +
      s("gold_chg_during_pct", "Gold, during", "%", 0, "after 12 mo: " + signed(c.gold_chg_12m_after_pct, 0, "%")) +
      s("wti_oil_chg_during_pct", "Oil, during", "%", 0, "after 12 mo: " + signed(c.wti_oil_chg_12m_after_pct, 0, "%")) +
      s("sp_real_chg_during_pct", "Real S&amp;P 500, during", "%", 0, "after 12 mo: " + signed(c.sp_real_chg_12m_after_pct, 0, "%")) +
      "<div class='stat stat-wide'><div class='stat-k'>Recession</div><span>" +
      (+c.recession_during_cycle === 1 ? "<span class='badge badge-yes'>During cycle</span> " : "") +
      (c.recession_within_24m_after_end === 1 ? "<span class='badge badge-yes'>Within 24 mo after</span>" : c.recession_within_24m_after_end === 0 ? "<span class='badge badge-no'>None within 24 mo after</span>" : "<span class='badge badge-na'>After: not known yet</span>") + "</span></div>";
    $("cycleNote").textContent = (c.note ? "Note: " + c.note + ". " : "") + "Shaded: the cycle. Lines run from 12 months before to 12 months after. Gold is indexed to 100 at the cycle start (right axis).";
    if (!HAS_CHART) return;
    const t0 = tOf(c.start), t1 = tOf(c.end || D.series.dates[D.series.dates.length - 1]);
    const lo = t0 - 1, hi = Math.min(t1 + 1, TARGET + 0.75);
    const dates = D.series.dates;
    const pick = (key, f) => { const s = series(key); return s ? s.map((v, i) => { const t = tOf(dates[i]); return isNum(v) && t >= lo && t <= hi ? { x: t, y: f ? f(v) : v } : null; }).filter(Boolean) : []; };
    const g0 = val("Gold", c.start);
    const ds = [
      { label: "Fed funds %", data: pick("FedFunds"), borderColor: C26, borderWidth: 2.5, yAxisID: "y" },
      { label: "10-year yield %", data: pick("Yield_10Y"), borderColor: WGRAY, borderWidth: 2, yAxisID: "y" },
      { label: "M2 growth %", data: pick("M2_YoY"), borderColor: CY2, borderWidth: 1.5, borderDash: [5, 4], yAxisID: "y" },
      { label: "Gold (start = 100)", data: isNum(g0) ? pick("Gold", (v) => v / g0 * 100) : [], borderColor: GOLD, borderWidth: 2, yAxisID: "y2" },
    ].map((d) => Object.assign({ pointRadius: 0, tension: 0.2, backgroundColor: d.borderColor }, d));
    const hl = [{ from: t0, to: t1 + 1 / 12, color: cycleKind === "easing" ? "rgba(143,188,152,0.12)" : "rgba(216,195,147,0.12)" }];
    if (!charts.cycle) {
      charts.cycle = new Chart($("cycleChart"), {
        type: "line", data: { datasets: ds },
        options: {
          parsing: false, interaction: { mode: "index", intersect: false },
          scales: { x: { type: "linear", min: lo, max: hi, grid: { display: false }, ticks: { callback: (v) => Number.isInteger(v) ? v : "", maxTicksLimit: 8 } },
            y: { position: "left", ticks: { callback: axisPct }, grid: { color: "rgba(255,255,255,0.05)" } },
            y2: { position: "right", grid: { display: false }, ticks: { color: GOLD } } },
          plugins: { legend: { display: true, position: "top", align: "start", labels: { boxWidth: 12, boxHeight: 3 } }, bands: { bands: recBands, highlights: hl },
            tooltip: { callbacks: { title: (it) => { const t = it[0].parsed.x; const y = Math.floor(t + 1e-6); return MONTHS[Math.round((t - y) * 12)] + " " + y; }, label: (it) => " " + it.dataset.label + ": " + fx(it.parsed.y, 1) } } },
        },
      });
    } else {
      const ch = charts.cycle; ch.data.datasets = ds; ch.options.scales.x.min = lo; ch.options.scales.x.max = hi; ch.options.plugins.bands.highlights = hl; ch.update();
    }
  }


  // ------------------------------------------------------------ QR CODE + PRESENT MODE
  const CFG = window.SITE_CONFIG || { SITE_URL: location.href.split(/[?#]/)[0], SITE_URL_IS_PLACEHOLDER: true };
  function qrSVG(text) {
    if (typeof window.qrcode !== "function") return null;
    const q = window.qrcode(0, "M"); q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }
  function initQR() {
    const url = CFG.SITE_URL;
    const svg = qrSVG(url);
    const ph = CFG.SITE_URL_IS_PLACEHOLDER;
    const urlText = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const fill = (id) => { const n = $(id); if (!n) return; n.innerHTML = svg || "<span class='muted small'>QR library didn't load</span>"; if (ph) n.insertAdjacentHTML("beforeend", "<span class='qr-ph'>placeholder URL</span>"); };
    fill("qrSmall"); fill("qrLarge");
    $("qrUrl").textContent = urlText + (ph ? "  (placeholder: set SITE_URL in config.js)" : "");
    $("qrUrlBig").textContent = urlText;
    const open = () => { $("qrOverlay").classList.remove("hidden"); document.body.classList.add("no-scroll"); };
    const close = () => { $("qrOverlay").classList.add("hidden"); document.body.classList.remove("no-scroll"); };
    $("qrOpen").onclick = open; $("qrBig").onclick = open; $("qrOverlay").onclick = close;
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    const params = new URLSearchParams(location.search);
    if (params.get("present") === "1" || params.get("qr") === "1" || location.hash === "#present") open();
  }

  // ------------------------------------------------------------ THE PRINTING PRESS
  const T = (bn, d = 1) => isNum(bn) ? "$" + fx(bn / 1000, d) + "T" : "–";
  function counterCard(k, target, fmt, sub, big) {
    return "<article class='counter" + (big ? " counter-big" : "") + (big === "debt" ? " counter-debt" : "") + "'><div class='counter-k'>" + k + "</div><div class='counter-v' data-target='" + target + "' data-fmt='" + fmt + "'>" + formatCounter(fmt, target) + "</div><p class='counter-sub'>" + sub + "</p></article>";
  }
  function formatCounter(fmt, v) {
    if (fmt === "x") return fx(v, 1) + "×";
    if (fmt === "T") return "$" + fx(v / 1000, 1) + "T";
    if (fmt === "pct") return "+" + fx(v, 1) + "%";
    return fx(v, 0);
  }
  function animateCounters(root) {
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.querySelectorAll(".counter-v").forEach((n, i) => {
      const target = +n.dataset.target, fmt = n.dataset.fmt;
      if (reduce) { n.textContent = formatCounter(fmt, target); return; }
      const dur = 1400 + i * 120, t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); n.textContent = formatCounter(fmt, target * e); if (p < 1) requestAnimationFrame(step); };
      n.textContent = formatCounter(fmt, 0); requestAnimationFrame(step);
    });
  }
  function renderPress() {
    const M = D.money || {}, H = M.headline || {};
    if (!M.levels || !H.fed_2008) { $("pressComing").classList.remove("hidden"); $("pressBody").classList.add("hidden"); return; }
    const f08 = H.fed_2008, f20 = H.fed_2020, ft = H.fed_total, mp = H.m2_peak_yoy, m08 = H.m2_since_2008, m20 = H.m2_since_2020, d08 = H.debt_since_2008, d20 = H.debt_since_2020;
    $("counters").innerHTML =
      counterCard("Fed balance sheet, 2008 crisis", f08.multiple, "x", T(f08.before, 2) + " (" + monthName(f08.before_month) + ") → " + T(f08.peak, 2) + " (" + monthName(f08.peak_month) + ")", true) +
      counterCard("Fed balance sheet, 2020 pandemic", f20.multiple, "x", T(f20.before, 2) + " (" + monthName(f20.before_month) + ") → " + T(f20.peak, 2) + " (" + monthName(f20.peak_month) + "): <b>+" + T(f20.added, 1) + "</b> in " + monthsBetween(f20.before_month, f20.peak_month) + " months", true) +
      counterCard("Pre-Lehman to peak", ft.multiple, "x", "Fed balance sheet " + T(ft.from, 2) + " → " + T(ft.peak, 2) + ". Today: " + T(ft.latest, 2) + " (" + monthName(ft.latest_month) + ")") +
      counterCard("Peak money-supply growth", mp.pct, "pct", "M2 grew " + fx(mp.pct, 1) + "% in the year to " + monthName(mp.month) + ", the fastest since records began in 1960") +
      counterCard("M2 dollars added since 2008", m08.added, "T", T(m08.from) + " (Dec 2007) → " + T(m08.to) + " (" + monthName(m08.to_month) + "), " + fx(m08.multiple, 1) + "×") +
      counterCard("M2 dollars added since 2020", m20.added, "T", T(m20.from) + " (Dec 2019) → " + T(m20.to) + ": +" + fx(m20.pct, 0) + "% in " + fx(monthsBetween("2019-12", m20.to_month) / 12, 1) + " years") +
      (d08 ? counterCard("Federal debt added since 2008", d08.added, "T", T(d08.from) + " (Dec 2007) → " + T(d08.to) + " (" + monthName(d08.to_month) + "), " + fx(d08.multiple, 1) + "×") : "") +
      (d20 ? counterCard("Federal debt added since 2020", d20.added, "T", T(d20.from) + " (Dec 2019) → " + T(d20.to) + ": +" + fx(d20.pct, 0) + "%", "debt") : "");
    whenVisible($("counters"), () => animateCounters($("counters")));
    document.querySelectorAll("#pressMode button").forEach((b) => b.onclick = () => {
      pressMode = b.dataset.mode; document.querySelectorAll("#pressMode button").forEach((x) => x.classList.toggle("active", x === b)); updatePressChart();
    });
    whenVisible($("pressChart"), updatePressChart);
    renderProjection(histRows[0] ? histRows[0].year : 2007);
  }
  function monthsBetween(a, b) { return (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7)); }
  let pressMode = "level";
  const PRESS_SERIES = [
    { key: "FedDebt", yoy: "FedDebt_YoY", label: "Federal debt", color: ROSE },
    { key: "M2", yoy: "M2_YoY", label: "M2 money supply", color: SAGE },
    { key: "FedBalanceSheet", yoy: "FedBalanceSheet_YoY", label: "Fed balance sheet", color: TEAL },
    { key: "MonetaryBase", yoy: "MonetaryBase_YoY", label: "Monetary base", color: SAND },
  ];
  function updatePressChart() {
    if (!HAS_CHART) return;
    const L = D.money.levels || {}, dates = D.series.dates, lvl = pressMode === "level";
    const from = lvl ? 2000 : 1960;
    const ds = PRESS_SERIES.filter((s) => lvl ? L[s.key] : series(s.yoy)).map((s) => ({
      label: s.label, borderColor: s.color, backgroundColor: s.color, borderWidth: s.key === "FedBalanceSheet" ? 3 : 2, pointRadius: 0, tension: 0.15, spanGaps: s.key === "FedDebt",
      data: (lvl ? L[s.key] : series(s.yoy)).map((v, i) => { const t = tOf(dates[i]); return isNum(v) && t >= from ? { x: t, y: lvl ? v / 1000 : v } : null; }).filter(Boolean),
    }));
    $("pressChartTitle").innerHTML = lvl ? "Printing during crises <span class='muted'>(US$ trillions)</span>" : "Printing during crises <span class='muted'>(% growth vs a year earlier)</span>";
    const hl = [{ from: 2008 + 8 / 12, to: 2008 + 9 / 12, color: "rgba(0,0,0,0)", label: "Lehman", text: WGRAY }, { from: 2020 + 2 / 12, to: 2020 + 3 / 12, color: "rgba(0,0,0,0)", label: "COVID", text: WGRAY }];
    const opts = {
      parsing: false, normalized: true, interaction: { mode: "index", intersect: false },
      scales: { x: { type: "linear", min: from, max: TARGET + 1, grid: { display: false }, ticks: { callback: (v) => Number.isInteger(v) ? v : "", maxTicksLimit: 10 } },
        y: { grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)" }, ticks: { callback: (v) => lvl ? "$" + v + "T" : v + "%" } } },
      plugins: { legend: { display: true, position: "top", align: "start", labels: { boxWidth: 12, boxHeight: 3 } }, bands: { bands: recBands, highlights: hl },
        tooltip: { callbacks: { title: (it) => { const t = it[0].parsed.x; const y = Math.floor(t + 1e-6); return MONTHS[Math.round((t - y) * 12)] + " " + y; }, label: (it) => " " + it.dataset.label + ": " + (lvl ? "$" + fx(it.parsed.y, 2) + "T" : signed(it.parsed.y, 1, "%")) } } },
    };
    if (charts.press) { charts.press.destroy(); }
    charts.press = new Chart($("pressChart"), { type: "line", data: { datasets: ds }, options: opts });
  }
  function renderProjection(y) {
    const P = (D.money || {}).projection_growth; if (!P) return;
    const chips = $("projChips");
    if (!chips.childElementCount) histRows.slice(0, 5).forEach((r, i) => {
      const b = el("button", "chip", "<span class='chip-rank'>#" + (i + 1) + "</span>" + r.year); b.type = "button"; b.dataset.year = r.year;
      b.onclick = () => renderProjection(r.year); chips.appendChild(b);
    });
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", +c.dataset.year === y));
    const g = P.years[String(y)] || {}, today = P.today || {};
    $("projTitle").innerHTML = "If 2026 follows " + y + "&hellip;";
    const rows = [
      { k: "FedBalanceSheet", label: "Fed balance sheet" },
      { k: "M2", label: "M2 money supply" },
      { k: "MonetaryBase", label: "Monetary base" },
    ];
    const endMonth = (m) => monthName((+m.slice(0, 4) + 2) + m.slice(4));
    $("projGrid").innerHTML = rows.map((r) => {
      const t = today[r.k], gr = g[r.k];
      if (!t) return "";
      if (!isNum(gr)) {
        return "<div class='proj-item proj-na'><div class='proj-k'>" + r.label + "</div><div class='proj-v'>n/a</div><p class='proj-sub'>" +
          (r.k === "FedBalanceSheet" ? "The Fed balance sheet series (WALCL) starts in Dec 2002, so there's no " + y + "–" + (y + 2) + " comparison. M2 and the monetary base are used instead." : "No data for " + y + "–" + (y + 2) + ".") + "</p></div>";
      }
      const add = t.level * gr / 100;
      return "<div class='proj-item' title='" + T(t.level, 2) + " × " + fx(gr, 1) + "% = " + (add >= 0 ? "+" : "−") + T(Math.abs(add), 2) + "'><div class='proj-k'>" + r.label + "</div>" +
        "<div class='proj-v " + (add >= 0 ? "" : "down") + "'>" + (add >= 0 ? "+" : "−") + T(Math.abs(add), 1) + "</div>" +
        "<p class='proj-sub'>" + T(t.level, 2) + " today (" + monthName(t.month) + ") → <b>" + T(t.level + add, 2) + "</b> by " + endMonth(t.month) + "<br>" + y + "–" + (y + 2) + " growth: " + signed(gr, 1, "%") + "</p></div>";
    }).join("");
    const tip = "Implied added dollars = today's level × (level in Dec " + (y + 2) + " ÷ level in Dec " + y + " − 1). Example: Fed balance sheet " +
      (isNum(g.FedBalanceSheet) && today.FedBalanceSheet ? T(today.FedBalanceSheet.level, 2) + " × " + fx(g.FedBalanceSheet, 1) + "%." : "not available before Dec 2002.");
    $("projFormula").querySelector(".tip").textContent = tip;
    $("projFormula").querySelector(".info").setAttribute("title", tip);
    $("projNote").textContent = "Historical arithmetic, not a forecast. It shows what repeating " + y + "–" + (y + 2) + "'s money growth would mean at today's size. Today's levels: Fed balance sheet = monthly average of weekly WALCL; M2 = M2SL; monetary base = BOGMBASE (all Federal Reserve Board via FRED).";
  }


  // ------------------------------------------------------------ MONETARY ERAS
  function renderEras() {
    const E = D.eras || {};
    if (!E.available) { $("eras").classList.add("hidden"); return; }
    $("eraTimeline").innerHTML = (E.bands || []).map((b) =>
      "<article class='era-band' data-era='" + b.id + "'><div class='era-years'>" + b.years + "</div><h3>" + b.label + "</h3><p>" + b.note + "</p></article>"
    ).join("");
    const n = E.nixon || {};
    $("eraNixon").innerHTML = "<span class='era-nixon-mark'>" + (n.date || "1971-08-15").replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_,y,m,d) => MONTHS[+m-1] + " " + +d + ", " + y) +
      "</span> Nixon closes the gold window. The dollar is no longer convertible into gold at a fixed price.";
    $("eraContrasts").innerHTML = (E.contrasts || []).map((c) => {
      const vol = (v) => isNum(v) ? "<div class='vol'>volatility " + fx(v, 1) + "</div>" : "";
      const unit = c.unit === "% of years" ? "%" : c.unit;
      return "<article class='era-card'><div class='era-card-k'>" + c.label + "</div><div class='era-card-pair'>" +
        "<div><div class='lbl'>Before 1971</div><div class='val'>" + fx(c.before, c.id === "recessions" ? 0 : 1) + (unit === "%" ? "%" : unit ? " " + unit : "") + "</div>" + vol(c.before_vol) + "</div>" +
        "<div class='after'><div class='lbl'>Fiat era</div><div class='val'>" + fx(c.after, c.id === "recessions" ? 0 : 1) + (unit === "%" ? "%" : unit ? " " + unit : "") + "</div>" + vol(c.after_vol) + "</div>" +
        "</div><p>" + c.note + "</p></article>";
    }).join("");
    $("eraNote").textContent = E.note || "";
    // 1929 callout
    const tops = ((D.analogsLong || {}).tops) || {};
    const gold = tops.classical_gold_standard || (((D.analogsLong || {}).by_era || {}).classical_gold_standard || [])[0];
    const y = gold ? gold.year : 1929;
    $("eraGoldYear").textContent = y;
    $("eraGoldSub").innerHTML = "Similarity " + fx(gold ? gold.similarity_score : 66.8, 1) + " on the long-history score (" +
      (gold ? gold.n_features : 9) + " features). Runners-up in the gold-standard era: " +
      ((((D.analogsLong || {}).by_era || {}).classical_gold_standard || []).slice(1, 3).map((r) => r.year).join(", ") || "1928, 1901") + ".";
    const wn = ((D.longAnnual || {}).what_next || {})[String(y)] || {};
    const cell = (k, v, cls) => "<div class='en'><div class='en-k'>" + k + "</div><div class='en-v " + (cls || "") + "'>" + v + "</div></div>";
    const bits = [];
    if (isNum(wn.real_sp_yoy_next_year)) bits.push(cell("Real S&P, next year", signed(wn.real_sp_yoy_next_year, 1, "%"), wn.real_sp_yoy_next_year < 0 ? "down" : ""));
    if (isNum(wn.real_sp_yoy_year_plus_2)) bits.push(cell("Real S&P, year +2", signed(wn.real_sp_yoy_year_plus_2, 1, "%"), wn.real_sp_yoy_year_plus_2 < 0 ? "down" : ""));
    if (isNum(wn.unemployment_chg_12m_pp)) bits.push(cell("Unemployment, +12 mo", signed(wn.unemployment_chg_12m_pp, 1, " pts"), wn.unemployment_chg_12m_pp > 0 ? "down" : ""));
    if (isNum(wn.unemployment_chg_24m_pp)) bits.push(cell("Unemployment, +24 mo", signed(wn.unemployment_chg_24m_pp, 1, " pts"), wn.unemployment_chg_24m_pp > 0 ? "down" : ""));
    if (isNum(wn.inflation_chg_12m_pp)) bits.push(cell("Inflation, +12 mo", signed(wn.inflation_chg_12m_pp, 1, " pts")));
    bits.push(cell("Recession within 24 mo", wn.recession_within_24m ? "Yes" : "No", wn.recession_within_24m ? "down" : ""));
    $("eraGoldNext").innerHTML = bits.join("");
  }

  // ------------------------------------------------------------ COMPARE LIBRARY
  function cmpEntry(id) { return ((D.compareLibrary || {}).catalog || []).find((e) => e.id === id); }
  function cmpSeries(id) { return ((D.compareLibrary || {}).series || {})[id]; }
  function initCompare() {
    const C = D.compareLibrary || {};
    if (!C.available) { $("compare").classList.add("hidden"); return; }
    const sel = $("cmpSeries"); sel.innerHTML = "";
    const groups = {};
    (C.catalog || []).forEach((e) => { (groups[e.group] = groups[e.group] || []).push(e); });
    Object.keys(groups).forEach((g) => {
      const og = document.createElement("optgroup"); og.label = g;
      groups[g].forEach((e) => {
        const o = document.createElement("option"); o.value = e.id;
        o.textContent = e.label + (e.tuition_proxy ? " (tuition proxy)" : "") + (e.tier === "caution" || e.tier === "link_only" ? " · citation" : "");
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    cmpId = cmpId || (C.catalog[0] && C.catalog[0].id);
    sel.value = cmpId;
    sel.onchange = () => { cmpId = sel.value; fillCmpYears(); updateCompare(); };
    document.querySelectorAll("#cmpMode button").forEach((b) => b.onclick = () => {
      cmpMode = b.dataset.mode; document.querySelectorAll("#cmpMode button").forEach((x) => x.classList.toggle("active", x === b)); updateCompare();
    });
    $("cmpYear").onchange = () => { cmpYear = +$("cmpYear").value; updateCompare(); };
    const WHY = {
      russell_2000: "Russell 2000 — no public series; FTSE Russell data are licensed, so it is left out",
      cpi_college_tuition: "College tuition CPI — not available on FRED; the Education CPI above is shown as a tuition proxy",
      new_vehicle_avg_transaction_price: "Average new-car transaction price — proprietary; see the new-vehicle CPI instead",
      central_bank_gold_buying: "Central-bank gold buying — World Gold Council; link-only, not republished",
      cpi_health_insurance: "Health-insurance CPI — not on FRED yet (BLS pull pending); see medical-care CPI",
      cpi_daycare_preschool: "Daycare / preschool CPI — not on FRED yet (BLS pull pending)",
      employer_health_premium: "KFF employer premiums — CC BY-NC-ND; link only, no chart of their data",
      kff_employer_premiums: "KFF Employer Health Benefits Survey — CC BY-NC-ND; link only (kff.org)",
      central_bank_gold_buying: "World Gold Council central-bank buying — terms forbid redistribute; link to gold.org",
      wgc_central_bank_net_purchases: "World Gold Council net purchases — link only (gold.org/goldhub)",
      imf_gold_ounces_physical: "IMF physical gold ounces — license OK but data not pulled this build",
    };
    const omitIds = ["russell_2000", "cpi_college_tuition", "new_vehicle_avg_transaction_price", "imf_gold_ounces_physical"];
    const present = new Set((C.not_included || []).map((e) => e.id));
    const omit = omitIds.filter((id) => present.has(id)).map((id) => WHY[id]).join("; ");
    $("cmpOmitted").innerHTML = (omit ? "Not included: " + omit + ". " : "") +
      "Link-only (no charts of their data): <a href='https://www.kff.org/health-costs/report/employer-health-benefits-annual-survey/' target='_blank' rel='noopener'>KFF Employer Health Benefits Survey</a> (CC BY-NC-ND) and " +
      "<a href='https://www.gold.org/goldhub' target='_blank' rel='noopener'>World Gold Council central-bank buying</a> (terms forbid redistribution). " +
      "Dropped: FRED IR14270, which was mislabelled as a gold-reserves share but is a BLS import price index.";
    fillCmpYears();
    whenVisible($("cmpLongChart"), updateCompare);
  }
  function fillCmpYears() {
    const s = cmpSeries(cmpId); if (!s) return;
    const prefer = cmpMode === "auto" ? s.prefer : cmpMode === "yoy" ? "yoy" : "level";
    const pts = s[prefer] && s[prefer].length ? s[prefer] : (s.yoy.length ? s.yoy : s.level);
    const years = pts.map((p) => p.y).filter((y) => y !== TARGET);
    const sel = $("cmpYear"); const prev = cmpYear;
    sel.innerHTML = years.map((y) => "<option value='" + y + "'>" + y + "</option>").join("");
    cmpYear = years.includes(prev) ? prev : (years.includes(2007) ? 2007 : years[years.length - 1]);
    sel.value = cmpYear;
  }
  function updateCompare() {
    if (!HAS_CHART) return;
    const e = cmpEntry(cmpId), s = cmpSeries(cmpId); if (!e || !s) return;
    let mode = cmpMode === "auto" ? s.prefer : cmpMode;
    if (mode === "yoy" && !s.yoy.length) mode = "level";
    if (mode === "level" && !s.level.length) mode = "yoy";
    const pts = s[mode] || [];
    const unit = mode === "yoy" ? "%" : (e.unit === "percent" ? "%" : e.unit === "index" ? "" : e.unit === "usd_per_lb" ? "$/lb" : e.unit === "usd_per_hour" ? "$/hr" : e.unit === "usd_per_troy_oz" ? "$/oz" : e.unit === "usd_per_mt" ? "$/mt" : e.unit === "usd_bn" ? "$bn" : e.unit === "usd_mn" ? "$mn" : e.unit === "thousands" ? "k" : "");
    const fmt = (v) => !isNum(v) ? "–" : mode === "yoy" ? signed(v, 1, "%") : (unit.startsWith("$") && unit.length > 1 ? "$" + fx(v, v >= 100 ? 0 : 2) + unit.slice(1) : fx(v, Math.abs(v) >= 100 ? 0 : 2) + (unit ? " " + unit : ""));
    const v26 = (pts.find((p) => p.y === TARGET) || {}).v;
    const vy = (pts.find((p) => p.y === cmpYear) || {}).v;
    $("cmpYearLabel").textContent = cmpYear;
    $("cmpSideNote").textContent = mode === "yoy" ? "(yearly % change)" : "(level)";
    $("cmpLongNote").textContent = (pts[0] ? pts[0].y + "–" + pts[pts.length - 1].y : "") + (mode === "yoy" ? " · yearly %" : "");
    $("cmpMeta").innerHTML = "<strong>" + e.label + "</strong>" +
      (e.tuition_proxy ? " <span class='cmp-badge caution'>tuition proxy</span>" : "") +
      (e.id === "cpi_health_insurance" ? " <span class='cmp-badge caution'>method break ~2022</span>" : "") +
      " <span class='cmp-badge " + e.tier + "'>" + (e.tier === "ok" ? "open / public domain" : e.tier === "link_only" ? "short window · citation" : "citation required") + "</span>" +
      " · " + e.blurb + (e.series_note ? " <em>" + e.series_note + "</em>" : "");
    const cite = e.tier === "ok"
      ? ("Source: " + e.series_id + " via FRED / publisher noted above. Public domain or CC BY; citation requested.")
      : ("Source: " + e.series_id + " via FRED. " + (e.license_verdict || "Copyrighted: citation required") + ". Shown as a chart with a link to FRED — no download of this series is offered on this site.");
    $("cmpLicense").innerHTML = cite + (e.series_id && e.series_id.indexOf("WorldBank") < 0 && e.series_id.indexOf(" ") < 0
      ? " <a href='https://fred.stlouisfed.org/series/" + e.series_id + "' target='_blank' rel='noopener'>Open on FRED ↗</a>" : "");

    if (charts.cmpSide) charts.cmpSide.destroy();
    charts.cmpSide = new Chart($("cmpSideChart"), {
      type: "bar",
      data: { labels: ["2026", String(cmpYear)], datasets: [{ data: [v26, vy], backgroundColor: [SAGE, SAND], borderRadius: 8, barPercentage: 0.55 }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: (it) => " " + fmt(it.parsed.y) } } },
        scales: { y: { grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)" }, ticks: { callback: (v) => mode === "yoy" ? v + "%" : v } }, x: { grid: { display: false } } } },
    });
    if (charts.cmpLong) charts.cmpLong.destroy();
    const data = pts.map((p) => ({ x: p.y + 0.5, y: p.v }));
    charts.cmpLong = new Chart($("cmpLongChart"), {
      type: "line",
      data: { datasets: [{ data, borderColor: TEAL, borderWidth: 1.75, pointRadius: 0, pointHoverRadius: 3, tension: 0.15 }] },
      options: {
        parsing: false, interaction: { mode: "nearest", axis: "x", intersect: false },
        scales: { x: { type: "linear", min: data[0] ? data[0].x - 0.5 : 1950, max: TARGET + 1, grid: { display: false }, ticks: { callback: (v) => Number.isInteger(v) ? v : "", maxTicksLimit: 10 } },
          y: { grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)" }, ticks: { callback: (v) => mode === "yoy" ? v + "%" : v } } },
        plugins: { bands: { eras: eraBands(), bands: recBands, markers: nixonMarker(),
            highlights: [{ from: TARGET, to: TARGET + 1, color: "rgba(143,188,152,0.18)", label: "2026", text: C26 },
              { from: cmpYear, to: cmpYear + 1, color: "rgba(216,195,147,0.18)", label: String(cmpYear), text: CY }] },
          tooltip: { callbacks: { title: (it) => Math.floor(it[0].parsed.x + 1e-6), label: (it) => " " + fmt(it.parsed.y) } } },
      },
    });
  }


  // ------------------------------------------------------------ EXPANSION CARDS
  function usd0(v) { return isNum(v) ? "$" + Math.round(v).toLocaleString("en-US") : "–"; }
  function usd1(v) { return isNum(v) ? "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 0 }) : "–"; }
  function usdBn(v) { return isNum(v) ? "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 }) + " bn" : "–"; }
  function usdT(v) {
    if (!isNum(v)) return "–";
    if (Math.abs(v) >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
    if (Math.abs(v) >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
    return usd0(v);
  }
  function fmtCost(fmt, v) {
    if (!isNum(v)) return "–";
    if (fmt === "usd0") return usd0(v);
    if (fmt === "x") return fx(v, 2) + "×";
    if (fmt === "pct1") return fx(v, 1) + "%";
    return fx(v, 1);
  }
  function renderExpansion() {
    const X = D.expansion || {};
    if (!X.available) { $("xcards").classList.add("hidden"); return; }
    // Dollar
    const Dlr = X.dollar || {};
    $("xDollarSnaps").innerHTML = (Dlr.snapshots || []).map((s) =>
      "<div class='xs'><div class='y'>$1 in " + s.year + "</div><div class='v'>$" + Number(s.value_today).toFixed(2) + "</div><div class='s'>buys the same as this today</div></div>"
    ).join("");
    const years = Object.keys(Dlr.cpi_by_year || {}).map(Number).sort((a, b) => a - b);
    const sel = $("xCalcYear");
    sel.innerHTML = years.map((y) => "<option value='" + y + "'" + (y === 1913 ? " selected" : "") + ">" + y + "</option>").join("");
    const recalc = () => {
      const y = +sel.value, amt = +$("xCalcAmt").value || 0, now = Dlr.today_cpi;
      const snap = (Dlr.snapshots || []).find((s) => s.year === y);
      const then = snap ? snap.cpi_then : Dlr.cpi_by_year[y];
      if (!isNum(then) || !isNum(now) || !then) { $("xCalcOut").textContent = "–"; return; }
      const v = amt * (now / then);
      $("xCalcOut").innerHTML = "$" + amt.toLocaleString("en-US") + " in " + y + " ≈ <span style='color:var(--c2026b)'>" +
        "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2 }) + "</span> today <span class='muted'>(as of " + (Dlr.today_as_of || "") + ")</span>";
    };
    sel.onchange = recalc; $("xCalcAmt").oninput = recalc; recalc();
    $("xDollarSrc").textContent = (Dlr.source || "") + " The four highlighted years use December CPI (the snapshot file); other years use that year's annual-average CPI, so neighbouring years can differ slightly.";

    // Interest
    const I = X.interest || {}, hy = I.headline_year || 2024, Y = (I.years || {})[hy] || (I.years || {})[String(hy)] || {};
    $("xIntTitle").textContent = "FY" + hy + ": net interest $" + fx(I.interest_bn, 1) + " bn vs defense $" + fx(I.defense_bn, 1) + " bn";
    $("xIntPair").innerHTML =
      "<div class='xi interest'><div class='lbl'>Net interest</div><div class='v'>" + usdBn(I.interest_bn) + "</div><div class='sub'>" + usd0(I.interest_per_taxpayer) + " per taxpayer</div></div>" +
      "<div class='xi'><div class='lbl'>Defense</div><div class='v'>" + usdBn(I.defense_bn) + "</div><div class='sub'>" + usd0(I.defense_per_taxpayer) + " per taxpayer</div></div>";
    $("xIntCents").textContent = isNum(I.cents) ? (fx(I.cents, 1) + " cents of every individual income-tax dollar went to interest in FY" + hy + ".") : "";
    $("xTaxYear").textContent = "(FY" + hy + ", per return filed)";
    $("xIntSrc").textContent = (isNum(Y.total_outlays_per_taxpayer) ? ("Total federal spending was " + usd0(Y.total_outlays_per_taxpayer) + " per return vs " + usd0(Y.income_tax_per_taxpayer) +
      " of individual income tax per return; the gap is covered by other taxes and borrowing. ") : "") + (I.source || "") + " Educational, not financial advice.";
    const items = (Y.items || []).slice().sort((a, b) => b.per_taxpayer - a.per_taxpayer);
    if (HAS_CHART && items.length) {
      if (charts.xTax) charts.xTax.destroy();
      charts.xTax = new Chart($("xTaxChart"), {
        type: "bar",
        data: { labels: items.map((it) => it.label), datasets: [{ data: items.map((it) => it.per_taxpayer),
          backgroundColor: items.map((it) => it.label === "Net interest" ? "rgba(217,168,168,0.85)" : it.label === "Defense" ? "rgba(216,195,147,0.75)" : "rgba(143,188,152,0.7)"),
          borderRadius: 6, barPercentage: 0.7 }] },
        options: { indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => " " + usd0(c.parsed.x) + " / taxpayer" } } },
          scales: { x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { callback: (v) => "$" + (v / 1000).toFixed(0) + "k" } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } } },
      });
    }

    // Holders
    const H = X.holders || {}, latest = H.latest || {};
    $("xHolderFacts").innerHTML =
      "<div class='xh'><div class='lbl'>Fed share, 2019</div><div class='v'>" + fx(H.fed_2019, 1) + "%</div></div>" +
      "<div class='xh'><div class='lbl'>Fed share, 2020</div><div class='v'>" + fx(H.fed_2020, 1) + "%</div></div>" +
      "<div class='xh'><div class='lbl'>Latest (" + (latest.y || "") + ")</div><div class='v'>Fed " + fx(latest.fed, 1) + "% · foreign " + fx(latest.foreign, 1) + "%</div></div>";
    $("xHolderSrc").textContent = (H.source || "") + (H.foreign_peak ? (" Foreign share peaked at " + fx(H.foreign_peak.foreign, 1) + "% in " + H.foreign_peak.y + ".") : "");
    if (HAS_CHART && (H.rows || []).length) {
      if (charts.xHold) charts.xHold.destroy();
      charts.xHold = new Chart($("xHolderChart"), {
        type: "line",
        data: { datasets: [
          { label: "Fed share", data: H.rows.map((r) => ({ x: r.y + 0.5, y: r.fed })), borderColor: SAGE, borderWidth: 2, pointRadius: 0, tension: 0.15 },
          { label: "Foreign share", data: H.rows.map((r) => ({ x: r.y + 0.5, y: r.foreign })), borderColor: SAND, borderWidth: 2, pointRadius: 0, tension: 0.15 },
        ] },
        options: { parsing: false, interaction: { mode: "nearest", axis: "x", intersect: false },
          plugins: { legend: { display: true, position: "top", align: "start", labels: { boxWidth: 12, boxHeight: 3 } },
            tooltip: { callbacks: { title: (it) => Math.floor(it[0].parsed.x), label: (it) => " " + it.dataset.label + ": " + fx(it.parsed.y, 1) + "%" } } },
          scales: { x: { type: "linear", grid: { display: false }, ticks: { callback: (v) => Number.isInteger(v) ? v : "", maxTicksLimit: 8 } },
            y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { callback: (v) => v + "%" } } } },
      });
    }

    // Plumbing
    const P = X.plumbing || {};
    $("xPeaks").innerHTML = (P.peaks || []).map((p) =>
      "<div class='xp'><div class='lbl'>" + p.label + "</div><div class='v'>$" + fx(p.bn, 1) + " bn</div><div class='d'>peak " + (p.date || "") + "</div></div>"
    ).join("");
    $("xPlumbSrc").textContent = P.source || "";
    if (HAS_CHART && (P.annual || []).length) {
      if (charts.xPlumb) charts.xPlumb.destroy();
      const ann = P.annual;
      charts.xPlumb = new Chart($("xPlumbChart"), {
        type: "line",
        data: { datasets: [
          { label: "Reserves", data: ann.map((r) => ({ x: r.y + 0.5, y: r.reserves })), borderColor: SAGE, borderWidth: 1.75, pointRadius: 0, tension: 0.15 },
          { label: "ON RRP", data: ann.map((r) => ({ x: r.y + 0.5, y: r.rrp })), borderColor: SAND, borderWidth: 1.75, pointRadius: 0, tension: 0.15 },
          { label: "Primary credit", data: ann.map((r) => ({ x: r.y + 0.5, y: r.primary })), borderColor: ROSE, borderWidth: 1.75, pointRadius: 0, tension: 0.15 },
          { label: "BTFP", data: ann.map((r) => ({ x: r.y + 0.5, y: r.btfp })), borderColor: TEAL, borderWidth: 1.75, pointRadius: 0, tension: 0.15 },
          { label: "Peak (spike)", type: "scatter", data: (P.peaks || []).map((p) => {
              const d = new Date(p.date + "T00:00:00Z"), y0 = Date.UTC(d.getUTCFullYear(), 0, 1);
              return { x: d.getUTCFullYear() + (d - y0) / (365.25 * 864e5), y: p.bn, label: p.label, date: p.date };
            }), pointRadius: 6, pointHoverRadius: 8, pointStyle: "rectRot",
            backgroundColor: (P.peaks || []).map((p) => /RRP/.test(p.series) ? SAND : /WRES/.test(p.series) ? SAGE : /primary/.test(p.series) ? ROSE : TEAL),
            borderColor: "#16191c", borderWidth: 1.5 },
        ] },
        options: { parsing: false, interaction: { mode: "nearest", axis: "x", intersect: false },
          plugins: { legend: { display: true, position: "top", align: "start", labels: { boxWidth: 12, boxHeight: 3 } },
            tooltip: { callbacks: { title: (it) => it[0].raw && it[0].raw.date ? it[0].raw.date : Math.floor(it[0].parsed.x),
              label: (it) => " " + (it.raw && it.raw.label ? it.raw.label + " peak" : it.dataset.label) + ": $" + fx(it.parsed.y, 1) + " bn" } } },
          scales: { x: { type: "linear", grid: { display: false }, ticks: { callback: (v) => Number.isInteger(v) ? v : "", maxTicksLimit: 8 } },
            y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { callback: (v) => "$" + v + "bn" } } } },
      });
    }

    // Gold (IMF IFS via DBnomics)
    const G = X.gold || {};
    const dash = (s) => String(s || "").replace(/(\d{4})-(\d{2})(\d{2})$/, "$1–$3").replace(/(\d{4})-(\d{4})/, (m, a1, b1) => a1 + "–" + b1.slice(2));
    const W = G.world || [];
    const lastFull = W.filter((r) => !r.partial).slice(-1)[0] || {};
    const part = W.find((r) => r.partial);
    const pol = G.poland || {};
    $("xGoldGrid").innerHTML =
      "<div class='xg'><div class='lbl'>U.S. gold on the books</div><div class='v'>" + usdT(G.book_usd) + "</div><div class='sub'>" +
        (G.oz / 1e6).toFixed(1) + "M oz (" + Number(G.oz).toLocaleString("en-US", { maximumFractionDigits: 0 }) + ") × statutory $" + fx(G.statutory_price, 2) + "/oz</div></div>" +
      "<div class='xg'><div class='lbl'>Same gold at market</div><div class='v'>" + usdT(G.market_usd) + "</div><div class='sub'>at $" + Number(G.market_price).toLocaleString("en-US") + "/oz (" + (G.as_of || "") + ")</div></div>" +
      "<div class='xg'><div class='lbl'>Poland's gold (IMF)</div><div class='v'>" + fx(pol.from_moz, 1) + "M → " + fx(pol.to_moz, 1) + "M oz</div><div class='sub'>" +
        pol.from_y + " → " + pol.to_y + (pol.to_partial ? " (Jun)" : "") + (pol.y2024_moz ? "; end-2024: " + fx(pol.y2024_moz, 1) + "M oz" : "") + "</div></div>";
    $("xGoldRange").textContent = W.length ? "(" + W[0].y + "–" + W[W.length - 1].y + (part ? "; " + part.y + " = Jan–Jun only" : "") + ")" : "";
    const eraCards = (G.eras || []).map((e) =>
      "<div class='xe'><div class='lbl'>" + dash(e.label) + "</div><div class='v " + (e.avg_t_yr < 0 ? "neg" : "pos") + "'>" + signed(e.avg_t_yr, 0, " t/yr") + "</div><div class='sub'>" +
      signed(e.cum_t, 0, " t total") + "</div></div>");
    if (part) eraCards.push("<div class='xe'><div class='lbl'>" + part.y + " (Jan–Jun)</div><div class='v " + (part.net_t < 0 ? "neg" : "pos") + "'>" + signed(part.net_t, 0, " t") +
      "</div><div class='sub'>partial year</div></div>");
    $("xGoldEras").innerHTML = eraCards.join("");
    $("xGoldTopWin").textContent = dash(G.top_window || "2022-2024");
    $("xGoldTop").innerHTML = (G.top_buyers || []).map((t) => "<li>" + t.name + " <b>" + signed(t.cum_t, 0, " t") + "</b>" + (t.code === "RU" ? "<span class='muted'>*</span>" : "") + "</li>").join("");
    $("xGoldTopNote").textContent = "Cumulative net change in reported holdings, " + dash(G.top_window || "") + ". * " + (G.russia_note || "");
    const w22 = G.why_2022 || {};
    const lst = (arr) => (arr || []).map((b) => b.name + " " + signed(b.t, 0, " t")).join(", ");
    $("xGoldWhy").innerHTML = "Many central banks did buy in 2022: " + lst(w22.buyers) + ". But reported selling elsewhere offset it — " +
      (w22.sellers && w22.sellers.length ? lst(w22.sellers) + " and " : "") + "other reporting central banks outside our tracked list, net about " + signed(w22.others_t, 0, " t") +
      ". Our tracked countries added " + signed(w22.tracked_sum_t, 0, " t") + " in total, so the IMF world figure came out at " + signed(w22.world_t, 0, " t") +
      ". Most of the record buying the World Gold Council estimates for 2022 was never reported to the IMF, so it doesn't show here. 2023 (" +
      signed((W.find((r) => r.y === 2023) || {}).net_t, 0, " t") + ") is when reported buying caught up.";
    $("xGoldWgc").innerHTML = (G.wgc_note || "") + (G.wgc_url ? " <a href='" + G.wgc_url + "' target='_blank' rel='noopener'>World Gold Council ↗</a>" : "");
    $("xGoldSrc").textContent = G.source || "";
    $("xGoldCite").textContent = G.citation || "";
    if (HAS_CHART && W.length) {
      if (charts.xGold) charts.xGold.destroy();
      charts.xGold = new Chart($("xGoldChart"), {
        type: "bar",
        data: { datasets: [{ label: "World net purchases (t)", data: W.map((r) => ({ x: r.y + 0.5, y: r.net_t, partial: r.partial })),
          backgroundColor: W.map((r) => r.partial ? "rgba(169,203,177,0.35)" : r.net_t < 0 ? "rgba(217,168,168,0.85)" : "rgba(143,188,152,0.85)"),
          borderColor: W.map((r) => r.partial ? "rgba(169,203,177,0.9)" : "transparent"), borderWidth: W.map((r) => r.partial ? 1.5 : 0),
          borderDash: [3, 3], barPercentage: 1, categoryPercentage: 0.9 }] },
        options: { parsing: false,
          plugins: { legend: { display: false }, bands: { eras: eraBands(), markers: nixonMarker() },
            tooltip: { callbacks: { title: (it) => Math.floor(it[0].parsed.x) + (it[0].raw.partial ? " (Jan–Jun only)" : ""), label: (c) => " " + signed(c.parsed.y, 0, " t") } } },
          scales: { x: { type: "linear", min: W[0].y, max: W[W.length - 1].y + 1, offset: false, grid: { display: false }, ticks: { callback: (v) => Number.isInteger(v) && v % 10 === 0 ? v : "", maxTicksLimit: 12 } },
            y: { grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)" }, ticks: { callback: (v) => v + " t" } } } },
      });
    }

    // Costs strip
    $("xCostStrip").innerHTML = (X.costs || []).map((c) =>
      "<article class='xc'><div class='lbl'>" + c.label + "</div><div class='pair'>" +
        fmtCost(c.fmt, c.from) + " <span class='muted'>(" + c.from_y + ")</span> → <span>" + fmtCost(c.fmt, c.to) + "</span> <span class='muted'>(" + c.to_y + ")</span></div>" +
        "<div class='sub'>" + (c.sub || "") + "</div><div class='src'>" + (c.source || "") + "</div></article>"
    ).join("");
  }

  // ------------------------------------------------------------ WHAT IT MEANS PER TAXPAYER
  // data/money.json -> per_taxpayer, built from data/per_taxpayer*.csv (definitions: docs/method.md)
  const usd = (v) => isNum(v) ? (v < 0 ? "−$" : "$") + fx(Math.abs(v), 0) : "–";
  const usdK = (v) => !isNum(v) ? "–" : Math.abs(v) >= 1e6 ? "$" + fx(v / 1e6, 1) + "M" : Math.abs(v) >= 1e4 ? "$" + fx(v / 1e3, 0) + "k" : usd(v);
  const tn = (bn, d = 1) => isNum(bn) ? (bn >= 1000 ? "$" + fx(bn / 1000, d) + "T" : "$" + fx(bn, 0) + "bn") : "–";
  const yrs = (v) => !isNum(v) ? "–" : v < 1 ? fx(v * 12, v * 12 < 10 ? 1 : 0) + "<small>months</small>" : fx(v, v < 100 ? 1 : 0) + "<small>years</small>";
  const pct0 = (r) => fx(r * 100, r * 100 < 20 ? 1 : 0) + "%";
  const FLAG_LABEL = { returns_filed: "taxpayer count (returns filed)", taxable_returns: "taxable-return count", soi_total_income_tax_bn: "IRS income-tax total",
    indiv_income_tax_receipts_bn: "income-tax receipts", total_receipts_bn: "total receipts", surplus_deficit_bn: "deficit", interest_outlays_bn: "interest outlays",
    population: "population", households: "household count", median_hh_income_usd: "median household income", debt: "debt" };
  let ptxMode = "year", ptxBasis = "taxpayer", ptxTimer = null, ptxNotes = [];
  function ptxData() {
    const P = (D.money || {}).per_taxpayer;
    if (!P || !P.available || !P.years || !P.years.length) return null;
    const Y = {}; P.years.forEach((r) => (Y[r.label] = r));
    const win = (re) => (P.windows || []).find((w) => re.test(w.label));
    const lastWith = (k, maxYear) => P.years.slice().reverse().find((r) => isNum(r[k]) && (!maxYear || +r.label <= maxYear));
    return { P, Y, lastWith, latest: P.years[P.years.length - 1], covid: win(/covid|2020/i), gfc: win(/gfc|2008/i), cum: win(/cumulative/i), clock: P.debt_clock, proj: P.projection };
  }
  // footnotes from the CSV 'flags' column: fn(row, ["households", ...]) -> superscript markers
  function fn(row, keys, extra) {
    const out = [];
    const add = (t) => { let k = ptxNotes.indexOf(t); if (k < 0) { ptxNotes.push(t); k = ptxNotes.length - 1; } if (out.indexOf(k + 1) < 0) out.push(k + 1); };
    (row && row.flags || []).forEach((f) => {
      const eq = f.indexOf("="), key = eq > 0 ? f.slice(0, eq) : f, val = eq > 0 ? f.slice(eq + 1) : "";
      if (keys.some((k) => key === k || key.toLowerCase().startsWith(k.toLowerCase()))) add(row.label + ": " + (FLAG_LABEL[key] || key) + " = " + val + ".");
    });
    (extra || []).forEach(add);
    return out.length ? "<sup class='fn'>" + out.map((n) => "<a href='#ptxNote" + n + "'>" + n + "</a>").join(",") + "</sup>" : "";
  }
  function renderPerTaxpayer() {
    const X = ptxData();
    if (!X) {
      $("ptxBadge").innerHTML = "<span class='pill pill-warn'>Data coming</span>";
      ["ptxFacts"].forEach((id) => $(id).classList.add("hidden"));
      $("ptx").querySelectorAll(".ptx-grid,.ptx-chart-card,.ptx-notes-wrap").forEach((n) => n.classList.add("hidden"));
      return;
    }
    ptxNotes = [];
    renderPtxFacts(X);
    document.querySelectorAll("#ptxMode button").forEach((b) => b.onclick = () => {
      ptxMode = b.dataset.mode; document.querySelectorAll("#ptxMode button").forEach((x) => x.classList.toggle("active", x === b)); updatePtxChart();
    });
    document.querySelectorAll("#ptxBasis button").forEach((b) => b.onclick = () => {
      ptxBasis = b.dataset.basis; document.querySelectorAll("#ptxBasis button").forEach((x) => x.classList.toggle("active", x === b)); updatePtxChart();
    });
    whenVisible($("ptxChart"), updatePtxChart);
    // calculator
    const avgRow = X.lastWith("income_tax_per_taxpayer"), avg = avgRow ? avgRow.income_tax_per_taxpayer : null;
    const presets = [[2500, "$2,500"], [10000, "$10,000"], [25000, "$25,000"], [50000, "$50,000"]];
    if (isNum(avg)) presets.splice(2, 0, [Math.round(avg), "Average taxpayer (" + usd(avg) + ")"]);
    const box = $("ptxPresets"); box.innerHTML = "";
    presets.forEach(([v, lab]) => { const b = el("button", "chip", lab); b.type = "button"; b.dataset.v = v; b.onclick = () => { $("ptxTax").value = v; updateCalc(); }; box.appendChild(b); });
    $("ptxTax").value = isNum(avg) ? Math.round(avg) : 10000;
    $("ptxTax").oninput = updateCalc;
    updateCalc();
    renderGauge(X);
    renderHH(X);
    startTicker(X);
    $("ptxNotes").innerHTML = ptxNotes.map((t, k) => "<li id='ptxNote" + (k + 1) + "'>" + t + "</li>").join("");
  }
  function renderPtxFacts(X) {
    const { Y, covid, clock, proj, latest } = X, cards = [];
    const card = (cls, k, v, body, tag) => cards.push("<article class='ptx-fact " + cls + "'><div class='ptx-fact-k'>" + k + "</div><div class='ptx-fact-v'>" + v + "</div><p>" + body + "</p>" + (tag ? "<span class='tagline'>" + tag + "</span>" : "") + "</article>");
    const y20 = Y["2020"];
    if (y20 && isNum(y20.m2_vs_income_tax)) card("m2", "2020: new money vs. income tax", fx(y20.m2_vs_income_tax, 1) + "×",
      "In 2020, M2 grew <b>" + tn(y20.m2_added_bn, 2) + "</b>: <b>" + usd(y20.m2_added_per_taxpayer) + "</b> per taxpayer, versus " + usd(y20.income_tax_per_taxpayer) + " of average income tax paid." +
      (covid ? " Over " + covid.years.replace("-", "–") + ": <b>" + usd(covid.m2_added_per_taxpayer) + "</b> versus " + usd(covid.income_tax_per_taxpayer) + "." : ""));
    if (covid && isNum(covid.fed_bs_change_per_taxpayer)) card("", "The Fed's pandemic printing", usd(covid.fed_bs_change_per_taxpayer) + "<small>per taxpayer</small>",
      "The Fed's balance sheet grew <b>" + tn(covid.fed_bs_change_bn) + "</b> in " + covid.years.replace("-", "–") + ", paid for with newly created reserves.");
    if (clock) {
      const taxRow = latest;
      card("debt", "Debt, last 12 months", usd(clock.per_taxpayer) + "<small>per taxpayer</small>",
        "The debt rose <b>" + tn(clock.change_bn, 2) + "</b> in the 12 months to " + dayName(clock.to) + ": about <b>$" + fx(clock.per_day_bn, 1) + "bn a day</b>, <b>$" + fx(clock.per_second / 1000, 0) + "k a second</b>. That's " +
        usd(clock.per_taxpayer) + " per taxpayer" + fn(taxRow, ["returns_filed"]) + ", versus " + usd(taxRow.income_tax_per_taxpayer) + " of average income tax" + fn(taxRow, ["indiv_income_tax_receipts_bn"]) + ".");
    }
    const hhRow = X.lastWith("debt_hh_to_median_income"), y90 = Y["1990"], first = (Y["1970"] && isNum(Y["1970"].years_tax_to_pay_debt)) ? Y["1970"] : X.P.years.find((r) => isNum(r.years_tax_to_pay_debt));
    if (hhRow) card("debt", "Debt per household", fx(hhRow.debt_hh_to_median_income, 1) + "<small>years of income</small>",
      "Debt per household is <b>" + usd(hhRow.debt_per_household) + "</b>" + fn(hhRow, ["debt", "households"]) + ", or " + fx(hhRow.debt_hh_to_median_income, 1) + " years of median household income (" + usd(hhRow.median_household_income) + fn(hhRow, ["median_hh_income_usd"]) + ")." +
      (y90 && isNum(y90.debt_hh_to_median_income) ? " In 1990 it was " + fx(y90.debt_hh_to_median_income, 1) + "." : "") +
      (isNum(hhRow.years_tax_to_pay_debt) ? " Paying it off would take <b>" + fx(hhRow.years_tax_to_pay_debt, 1) + " years</b> of all individual income taxes" + fn(hhRow, ["indiv_income_tax_receipts_bn"]) + (first ? ", versus " + fx(first.years_tax_to_pay_debt, 1) + " in " + first.label : "") + "." : ""));
    // interest: latest year with actual (non-carried) budget data
    const iRow = X.P.years.slice().reverse().find((r) => isNum(r.interest_vs_income_tax) && !(r.flags || []).some((f) => f.startsWith("interest_outlays_bn")));
    if (iRow) {
      const r = iRow.interest_vs_income_tax, y21 = Y["2021"];
      const higher = X.P.years.filter((x) => isNum(x.interest_vs_income_tax) && x.interest_vs_income_tax > r && +x.label < +iRow.label);
      let hist = "";
      if (higher.length) {   // the record years (within half a point of the peak)
        const pk = Math.max(...higher.map((x) => x.interest_vs_income_tax)), top = higher.filter((x) => x.interest_vs_income_tax >= pk - 0.005);
        const lo = top[0].label, hi = top[top.length - 1].label;
        hist = " The record: about " + fx(pk * 100, 0) + "% in " + (lo === hi ? lo : lo + "–" + hi.slice(2)) + ".";
      }
      card("", "Interest on the debt", fx(r * 100, 1) + "%<small>of income taxes</small>",
        "Interest is <b>" + usd(iRow.interest_per_taxpayer) + " per taxpayer</b>" + fn(iRow, ["returns_filed"]) + ", " + fx(r * 100, 1) + "% of income taxes (FY" + iRow.label + ")" +
        (y21 && isNum(y21.interest_vs_income_tax) ? ", up from " + fx(y21.interest_vs_income_tax * 100, 0) + "% in 2021." : ".") + hist);
    }
    if (proj && proj.series && proj.series.Debt) {
      const S = proj.series;
      card("proj", "If 2026 follows " + proj.analog, "+" + tn(S.Debt.implied_increase_bn) + "<small>debt</small>",
        "Repeat " + proj.analog + "–" + (+proj.analog + 2) + "'s growth from today's levels: implied added debt <b>+" + tn(S.Debt.implied_increase_bn) + "</b> (" + usd(S.Debt.per_taxpayer) + " per taxpayer)" +
        (S.FedBalanceSheet ? ", Fed balance sheet <b>+" + tn(S.FedBalanceSheet.implied_increase_bn) + "</b>" : "") + (S.M2 ? ", M2 <b>+" + tn(S.M2.implied_increase_bn) + "</b>" : "") + ".",
        "Historical arithmetic, not a forecast");
    }
    $("ptxFacts").innerHTML = cards.join("");
  }
  function dayName(iso) { const [y, m, d] = iso.split("-").map(Number); return MONTHS[m - 1] + " " + d + ", " + y; }
  function updatePtxChart() {
    if (!HAS_CHART) return;
    const X = ptxData(), P = X.P, yearMode = ptxMode === "year", sfx = "_per_" + ptxBasis;
    const rows = yearMode ? P.years.filter((r) => +r.label >= 2000) : (P.windows || []).filter((w) => !/cumulative/i.test(w.label));
    const labels = rows.map((r) => yearMode ? (r.label === String(TARGET) ? r.label + " YTD" : r.label) : r.label.replace(/-/g, "–"));
    const set = (base, label, color, hidden) => ({ label, data: rows.map((r) => isNum(r[base + sfx]) ? r[base + sfx] : null), backgroundColor: color, borderRadius: 4, hidden: !!hidden, maxBarThickness: 34 });
    const ds = [set("income_tax", "Avg. federal income tax paid", WGRAY), set("m2_added", "New money (M2) created", SAGE),
      set("fed_bs_change", "Fed balance-sheet change", TEAL), set("deficit", "Federal deficit", ROSE, true)].filter((d) => d.data.some(isNum));
    const who = ptxBasis === "taxpayer" ? "per taxpayer" : "per taxable return";
    const opts = {
      interaction: { mode: "index", intersect: false },
      scales: { x: { grid: { display: false }, ticks: { autoSkip: yearMode, maxRotation: 0 } },
        y: { grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.05)" }, ticks: { callback: (v) => usdK(v) } } },
      plugins: { legend: { display: true, position: "top", align: "start", labels: { boxWidth: 12, boxHeight: 12 } },
        tooltip: { callbacks: { label: (it) => " " + it.dataset.label + ": " + usd(it.parsed.y) + " " + who } } },
    };
    if (charts.ptx) charts.ptx.destroy();
    charts.ptx = new Chart($("ptxChart"), { type: "bar", data: { labels, datasets: ds }, options: opts });
    $("ptxChartTitle").innerHTML = "Income tax paid vs. money created <span class='muted'>(US$ " + who + ")</span>";
    const hot = P.years.filter((r) => isNum(r.m2_vs_income_tax) && r.m2_vs_income_tax > 1).map((r) => r.label);
    const c = X.cum;
    $("ptxChartNote").textContent = (yearMode
      ? (hot.length ? "Years when more new M2 was created per taxpayer than the average taxpayer paid in federal income tax: " + hot.join(", ") + ". " : "") +
        "Each year mixes calendars: M2 and the Fed balance sheet are December-to-December, income tax and the deficit are fiscal years, taxpayer counts are tax years. " + TARGET + " is year-to-date (M2 through Aug, Fed balance sheet through Sep) and uses carried-forward taxpayer counts and FY2025 budget figures. "
      : "Stocks run from the December before each window to the December of its last year; budget flows are summed over the window's fiscal years; per taxpayer = total ÷ average returns filed in the window. " +
        (c ? "Cumulative " + c.years.replace("-", "–") + ": " + usd(c.m2_added_per_taxpayer) + " of new M2 per taxpayer versus " + usd(c.income_tax_per_taxpayer) + " of income tax. " : "")) +
      (ptxBasis === "taxable_return" ? "Taxable returns (returns that owed tax, about 70% of all) start in 1999; the Fed balance-sheet change per taxable return is only in the crisis windows. " : "") +
      "Click a legend item to show or hide it (the deficit starts hidden).";
  }
  function updateCalc() {
    const X = ptxData(), tax = +$("ptxTax").value;
    document.querySelectorAll("#ptxPresets .chip").forEach((c) => c.classList.toggle("active", +c.dataset.v === tax));
    if (!(tax > 0)) { $("ptxOut").innerHTML = "<p class='fine'>Enter an amount above $0.</p>"; return; }
    const item = (cls, k, vhtml, sub) => "<div class='ptx-o " + cls + "'><div class='ptx-o-k'>" + k + "</div><div class='ptx-o-v'>" + vhtml + "</div><p class='ptx-o-sub'>" + sub + "</p></div>";
    const d = X.lastWith("debt_per_taxpayer"), iRow = X.P.years.slice().reverse().find((r) => isNum(r.interest_per_taxpayer) && !(r.flags || []).some((f) => f.startsWith("interest_outlays_bn")));
    const pj = X.proj && X.proj.series && X.proj.series.Debt;
    let html = "";
    if (d) html += item("debt", "Your share of the federal debt", yrs(d.debt_per_taxpayer / tax), usd(d.debt_per_taxpayer) + " per taxpayer (" + (d.label === String(TARGET) ? "Oct 2026" : d.label) + ") = that many years of your tax");
    if (iRow) { const sh = iRow.interest_per_taxpayer / tax; html += item("", "Interest on your share, per year", "<span class='pct'>" + fx(sh * 100, 0) + "%</span><small>of your tax</small>", usd(iRow.interest_per_taxpayer) + " per taxpayer in FY" + iRow.label); }
    if (X.covid) html += item("m2", "Money created in " + X.covid.years.replace("-", "–"), yrs(X.covid.m2_added_per_taxpayer / tax), usd(X.covid.m2_added_per_taxpayer) + " of new M2 per taxpayer");
    if (pj) html += item("", "If 2026 follows " + X.proj.analog + ": added debt", yrs(pj.per_taxpayer / tax), usd(pj.per_taxpayer) + " per taxpayer over 24 months. Historical arithmetic, not a forecast");
    $("ptxOut").innerHTML = html;
  }
  function renderGauge(X) {
    const r = X.lastWith("years_tax_to_pay_debt");
    if (!r) { $("ptxGaugeV").textContent = "–"; $("ptxGaugeText").textContent = "Not in the data yet."; return; }
    const v = r.years_tax_to_pay_debt, max = Math.max(20, Math.ceil(v / 10) * 10 + 10), f = Math.min(1, v / max);
    $("ptxGaugeMax").textContent = max; $("ptxGaugeMid").textContent = max / 2;
    const first = (X.Y["1970"] && isNum(X.Y["1970"].years_tax_to_pay_debt)) ? X.Y["1970"] : X.P.years.find((x) => isNum(x.years_tax_to_pay_debt)), y08 = X.Y["2008"];
    $("ptxGaugeV").innerHTML = fx(v, 1) + " years" + fn(r, ["debt", "indiv_income_tax_receipts_bn"]);
    $("ptxGaugeText").innerHTML = "If every taxpayer handed over 100% of their federal income tax and the government spent nothing else, paying off today's debt would take about " + fx(v, 1) + " years." +
      (first ? " In " + first.label + " it was " + fx(first.years_tax_to_pay_debt, 1) + (y08 && isNum(y08.years_tax_to_pay_debt) ? "; in 2008, " + fx(y08.years_tax_to_pay_debt, 1) : "") + "." : "");
    whenVisible($("ptxNeedle"), () => {
      $("ptxGaugeFill").style.strokeDashoffset = (283 * (1 - f)).toFixed(1);
      $("ptxNeedle").style.transform = "rotate(" + (-90 + 180 * f).toFixed(1) + "deg)";
    });
  }
  function renderHH(X) {
    const hh = X.lastWith("debt_hh_to_median_income"), pj = X.proj && X.proj.series && X.proj.series.Debt, y90 = X.Y["1990"];
    if (!hh) { $("ptxBars").innerHTML = ""; $("ptxHHNote").textContent = "Median household income isn't in the data yet."; return; }
    const med = hh.median_household_income;
    const items = [
      { k: "Median household income" + fn(hh, ["median_hh_income_usd"]), v: med, c: WGRAY },
      { k: "Federal debt per household" + fn(hh, ["debt", "households"]), v: hh.debt_per_household, c: ROSE },
      pj && isNum(pj.per_household) && { k: "Added debt per household if 2026 follows " + X.proj.analog + " (arithmetic)", v: pj.per_household, c: SAND },
      X.covid && isNum(X.covid.m2_added_per_household) && { k: "New money (M2) per household, " + X.covid.years.replace("-", "–"), v: X.covid.m2_added_per_household, c: SAGE },
    ].filter(Boolean);
    const max = Math.max(...items.map((i) => i.v));
    $("ptxBars").innerHTML = items.map((i) => "<div><div class='ptx-bar-k'><span>" + i.k + "</span><b>" + usd(i.v) +
      (i.v !== med ? " <span class='muted'>· " + fx(i.v / med, 1) + "×</span>" : "") +
      "</b></div><div class='ptx-bar'><i style='background:" + i.c + "' data-w='" + (100 * i.v / max).toFixed(1) + "'></i></div></div>").join("");
    whenVisible($("ptxBars"), () => requestAnimationFrame(() => $("ptxBars").querySelectorAll("i").forEach((n) => n.style.width = n.dataset.w + "%")));
    $("ptxHHNote").textContent = "× = multiples of a year of median household income (Census). Debt per household = total public debt ÷ households." + (y90 && isNum(y90.debt_hh_to_median_income) ? " In 1990 the debt was " + fx(y90.debt_hh_to_median_income, 1) + "× median income." : "");
  }
  function startTicker(X) {
    const c = X.clock, last = X.latest;
    if (!c || !isNum(c.per_second) || !isNum(last.debt_total_bn)) { $("ptxTick").textContent = "–"; $("ptxTickSub").textContent = "Debt clock data not available."; return; }
    const base = last.debt_total_bn * 1e9, t0 = new Date(c.to + "T23:59:59-04:00").getTime(), n = last.returns_filed;
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => { const v = base + c.per_second * (Date.now() - t0) / 1000; $("ptxTick").textContent = "$" + fx(v, 0); if (isNum(n)) $("ptxTickPer").textContent = "$" + fx(v / n, 2); };
    draw(); if (ptxTimer) clearInterval(ptxTimer); ptxTimer = setInterval(draw, reduce ? 1000 : 100);
    $("ptxTickSub").innerHTML = "Estimate, not an official figure. Starts from Treasury's Debt to the Penny (" + tn(last.debt_total_bn, 2) + " on " + dayName(c.to) + ") and adds about $" + fx(c.per_second, 0) +
      " a second, the average pace of the past 12 months (" + usd(c.per_taxpayer_per_day) + " per taxpayer per day" + fn(last, ["returns_filed"]) + ").";
  }

  // ------------------------------------------------------------ WARS AND CONFLICTS
  let warSel = "wwii";
  const W_T0 = 1900, W_T1 = 2027;
  const wPct = (t) => Math.max(0, Math.min(100, (t - W_T0) / (W_T1 - W_T0) * 100));
  function money$(bn) {
    if (!isNum(bn)) return "–";
    const a = Math.abs(bn), sg = bn < 0 ? "−" : "+";
    return sg + (a >= 1000 ? "$" + fx(a / 1000, 2) + "T" : "$" + fx(a, a >= 100 ? 0 : 1) + "B");
  }
  function plain$(bn) { return isNum(bn) ? (bn >= 1000 ? "$" + fx(bn / 1000, 2) + "T" : "$" + fx(bn, bn >= 100 ? 0 : 1) + "B") : "–"; }
  function srcLine(list, lead) {
    return (lead || "Sources: ") + (list || []).map((x) => "<a href='" + x.url + "' target='_blank' rel='noopener'>" + x.label + "</a>").join("; ") + ".";
  }
  const warMajor = (id) => ((D.wars || {}).majors || []).find((m) => m.id === id);
  const fyLabel = (m) => (m.fy_window || "").replace(/ end/g, "").replace("->", "→");
  const cyLabel = (m) => (m.cy_window || "").replace("->", "→");

  function renderWars() {
    const W = D.wars || {};
    if (!W.available) { $("wars").classList.add("hidden"); return; }
    $("warCaveatTop").textContent = W.caveat;
    $("warCaveat").textContent = W.caveat;
    renderWarTimeline();
    $("warTlSources").innerHTML = srcLine(W.timeline_sources, "Timeline sources: ") + " Monetary-era bands as in the Monetary eras section.";
    $("warChips").innerHTML = W.majors.map((m) => "<button class='chip' role='tab' type='button' data-war='" + m.id + "' aria-selected='false'>" + m.short + (m.end ? "" : " <span class='muted'>(ongoing)</span>") + "</button>").join("");
    $("warChips").querySelectorAll("button").forEach((b) => b.onclick = () => selectWar(b.dataset.war));
    renderWarTable();
    $("warClosing").textContent = W.closing;
    const g = (id) => warMajor(id) || {};
    const k = g("korea"), w2 = g("wwii"), w1 = g("wwi");
    $("warClosingNote").innerHTML = "The numbers behind that line: WWII debt " + money$(w2.debt_change_bn) + " against a CRS cost of " + plain$(w2.crs_cost_bn) + ", with M2 " + signed(w2.m2_change_pct, 0, "%") +
      "; WWI debt " + money$(w1.debt_change_bn) + " against a CRS cost of " + plain$(w1.crs_cost_bn) + "; Korea debt only " + money$(k.debt_change_bn) + " against a CRS cost of " + plain$(k.crs_cost_bn) +
      ", with deficits averaging " + fx(k.deficit_avg, 1) + "% of GDP and tax increases in the Revenue Acts of 1950 and 1951. " + W.caveat;
    selectWar(warSel, false);
  }

  function renderWarTimeline() {
    const W = D.wars, E = D.eras || {};
    let h = "<div class='wtl-plot'>";
    (E.bands || []).forEach((b) => {
      const l = wPct(b.from), r = wPct(Math.min(b.to, W_T1));
      h += "<div class='wtl-era' style='left:" + l + "%;width:" + (r - l) + "%;background:" + b.color + "'><span>" + b.short + "</span></div>";
    });
    const nx = (E.nixon || {}).t || 1971.62;
    h += "<div class='wtl-nixon' style='left:" + wPct(nx) + "%'><span>Aug 1971</span></div>";
    const cw = W.timeline.find((t) => t.id === "cold_war");
    if (cw) h += "<div class='wtl-cw' style='left:" + wPct(cw.from) + "%;width:" + (wPct(cw.to) - wPct(cw.from)) + "%' title='" + cw.name + ": " + cw.desc.replace(/'/g, "&#39;") + "'><span>Cold War<em> 1947–91</em></span></div>";
    W.timeline.filter((t) => t.category === "cold_war_event").forEach((t) => {
      h += "<span class='wtl-cwe' tabindex='0' style='left:" + wPct(t.from + 1 / 24) + "%' title='" + (monthName(t.start) + ": " + t.name.replace("Cold War event: ", "")).replace(/'/g, "&#39;") + "'></span>";
    });
    W.timeline.filter((t) => t.category === "marker").forEach((t) => {
      h += "<span class='wtl-mk' tabindex='0' style='left:" + wPct((t.from + t.to) / 2) + "%' title='" + (t.name + " (" + monthName(t.start) + (t.end && t.end !== t.start ? "–" + monthName(t.end) : "") + "; " + t.type + ")").replace(/'/g, "&#39;") + "'></span>";
    });
    const majors = W.timeline.filter((t) => t.category === "major_war").sort((a, b) => a.from - b.from);
    majors.forEach((t, i) => {
      const l = wPct(t.from), r = wPct(t.to), mid = (l + r) / 2;
      const pos = i % 2 === 0 ? "up" : "down";
      const align = mid > 92 ? "right" : mid < 6 ? "left" : "center";
      h += "<button type='button' class='wtl-war" + (t.ongoing ? " ongoing" : "") + "' data-war='" + t.id + "' style='left:" + l + "%;width:" + (r - l) + "%' aria-label='" + t.name + "'></button>";
      h += "<span class='wtl-lbl " + pos + " " + align + "' data-war='" + t.id + "' style='left:" + mid + "%'>" + t.short + "</span>";
    });
    h += "</div><div class='wtl-axis'>" + [1900, 1925, 1950, 1975, 2000, 2025].map((y) => "<span style='left:" + wPct(y) + "%'>" + y + "</span>").join("") + "</div>";
    $("warTimeline").innerHTML = h;
    $("warTimeline").querySelectorAll("[data-war]").forEach((b) => b.onclick = () => selectWar(b.dataset.war, true));
    requestAnimationFrame(() => $("warTimeline").querySelectorAll(".wtl-era span, .wtl-cw span").forEach((sp) => { sp.style.visibility = sp.scrollWidth > sp.parentNode.clientWidth - 6 ? "hidden" : "visible"; }));
    $("warTlLegend").innerHTML = "<span class='legend'><i class='wsw wsw-war'></i>Major war (tap to load)</span><span class='legend'><i class='wsw wsw-mk'></i>Other conflict (hover or tap for name)</span>" +
      "<span class='legend'><i class='wsw wsw-cw'></i>Cold War, with key events</span><span class='legend'><i class='wsw wsw-nx'></i>Aug 1971: gold window closed</span><span class='legend muted'>Background tints = monetary eras</span>";
    $("warMarkerList").innerHTML = W.timeline.filter((t) => t.category === "marker" || t.category === "era_band" || t.category === "cold_war_event").map((t) =>
      "<li><b>" + t.name + "</b> <span class='muted'>(" + monthName(t.start) + (t.end && t.end !== t.start ? " – " + monthName(t.end) : t.end ? "" : " – ongoing") + "; " + t.type + ")</span> " + t.desc + " <a href='" + t.url + "' target='_blank' rel='noopener'>Source</a></li>").join("");
  }

  function warCard(k, big, from, sub, color, bigCls) {
    return "<div class='hz' style='--hzc:" + (color || "var(--line2)") + "'><div class='hz-k'>" + k + "</div><div class='hz-v war-v " + (bigCls || "") + "'>" + big + "</div>" +
      (from ? "<div class='hz-from'>" + from + "</div>" : "") + (sub ? "<div class='hz-sub'>" + sub + "</div>" : "") + "</div>";
  }

  function selectWar(id, scroll) {
    const m = warMajor(id); if (!m) return;
    warSel = id;
    const W = D.wars, iran = id === "iran_2026";
    $("warChips").querySelectorAll("button").forEach((b) => { const on = b.dataset.war === id; b.classList.toggle("active", on); b.setAttribute("aria-selected", on); });
    $("warTimeline").querySelectorAll(".wtl-war,.wtl-lbl").forEach((b) => b.classList.toggle("sel", b.dataset.war === id));
    $("warTable").querySelectorAll("tr[data-war]").forEach((tr) => tr.classList.toggle("sel", tr.dataset.war === id));
    $("warKicker").textContent = iran ? "Ongoing · year-to-date only" : "Selected war";
    $("warTitle").textContent = m.name;
    $("warMeta").innerHTML = monthName(m.start) + " – " + (m.end ? monthName(m.end) : "ongoing (as of Oct 8, 2026)") + " · <span class='war-type'>" + cap(m.type) + "</span> · " + m.legal_basis;
    $("warOneLiner").textContent = m.one_liner;
    const ir = $("warIran");
    if (iran) {
      ir.classList.remove("hidden");
      ir.innerHTML = "<div class='war-badges'><span>U.S.-Iran conflict, 2026</span><span>Undeclared hostilities: no declaration of war, no AUMF</span><span>Ongoing, intermittent (as of Oct 8, 2026)</span><span>Year-to-date figures only</span></div>" +
        "<ol class='war-dates'>" + W.iran_timeline.map((e) => "<li><b>" + e.date + "</b> " + e.text + " <a href='" + e.src.url + "' target='_blank' rel='noopener'>Source</a></li>").join("") + "</ol>" +
        "<p class='fine'>War-powers resolutions to end the hostilities have been introduced in Congress but have not become law (CRS IN12678). This card reports dates and published numbers only.</p>";
    } else { ir.classList.add("hidden"); ir.innerHTML = ""; }

    let c = "";
    if (!iran) {
      const dpLbl = m.id === "wwi" ? "Federal debt ÷ GNP (Census <em>Historical Statistics</em>), end of FY" : "Debt held by the public, % of GDP, end of FY";
      c += warCard("Debt added", money$(m.debt_change_bn), signed(m.debt_change_pct, 0, "%") + " · " + fyLabel(m),
        (isNum(m.debt_change_2025usd_bn) ? plain$(m.debt_change_2025usd_bn) + " in 2025 dollars" : "") + (isNum(m.debt_per_household) ? " · $" + fx(m.debt_per_household, 0) + " per household" : isNum(m.debt_per_return) ? " · $" + fx(m.debt_per_return, 0) + " per tax return" : ""), ROSE);
      c += warCard("Debt vs the economy", fx(m.dpub_start, 1) + "% → " + fx(m.dpub_end, 1) + "%", "before → after", dpLbl, ROSE);
      c += warCard("Money supply (M2)", signed(m.m2_change_pct, 0, "%"), money$(m.m2_change_bn) + " · " + cyLabel(m), isNum(m.m2_per_household) ? "$" + fx(m.m2_per_household, 0) + " per household" : "M2 = cash plus bank deposits", SLATE);
      c += warCard("Peak defense spending", fx(m.def_peak, 1) + "% of GDP", "FY" + m.def_peak_fy, "Before the war: " + fx(m.def_prewar, 1) + "% of " + (m.id === "wwi" ? "GNP" : "GDP"), TEAL);
      c += warCard("Peak inflation", fx(m.infl_peak, 1) + "%", "in " + m.infl_peak_year, "Average during the war: " + fx(m.infl_avg, 1) + "% a year (window runs 2 years past the end)", MAUVE);
      const ratio = isNum(m.crs_ratio) ? (m.crs_ratio < 1 ? "Debt added = " + fx(m.crs_ratio * 100, 0) + "% of the CRS cost" : "Debt added = " + fx(m.crs_ratio, 1) + "× the CRS cost") : "";
      c += warCard("CRS war cost estimate", plain$(m.crs_cost_bn), (m.crs_cost_years || "") + ", military operations only",
        (m.crs_note ? "Net to U.S. taxpayers: $4.7B; allies paid most. " : "") + ratio, SAND);
    } else {
      c += warCard("Debt change since Feb 27", money$(m.debt_change_bn), signed(m.debt_change_pct, 1, "%") + " · Feb 27 → Oct 7, 2026", "Whole federal budget, not war spending (Treasury Debt to the Penny)", ROSE);
      c += warCard("Debt load at the start", fx(m.dpub_start, 1) + "%", "of GDP held by the public, FY2025", "Before WWII: " + fx(W.wwii_dpub_start, 1) + "% (FY1941)", ROSE);
      c += warCard("Money supply (M2), 2026", signed(m.m2_change_pct, 1, "%"), money$(m.m2_change_bn) + " · Jan → Aug 2026", "Federal Reserve H.6 via FRED (M2SL)", SLATE);
      c += warCard("Defense before the conflict", fx(m.def_prewar, 1) + "% of GDP", "FY2025", "FY2026 figures not published yet", TEAL);
      c += warCard("Inflation, 2026 so far", fx(m.infl_avg, 1) + "%", "average of monthly 12-month rates", "2025: " + fx((m.event.series.cpi_inflation_pct || [])[0], 1) + "%", MAUVE);
      c += warCard("DoD cost estimate", plain$(m.crs_cost_bn), "operations, Feb – May 2026", "Excludes damage to U.S. installations (CRS IN12678)", SAND);
    }
    $("warCallouts").innerHTML = c;
    $("warEra").innerHTML = "<b>Money regime:</b> " + m.era_note;
    $("warSources").innerHTML = srcLine(m.sources) + " S&amp;P 500: Robert Shiller&rsquo;s data, % changes only. Inflation: BLS CPI (Shiller CPI series). Gold: official U.S. price before 1960, World Bank Pink Sheet (CC BY 4.0) after.";
    renderWarChart(m);
    if (scroll) $("warPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderWarChart(m) {
    const ev = m.event, iran = m.id === "iran_2026";
    const t0 = ev.years[ev.rel.indexOf(0)];
    $("warChartTitle").innerHTML = iran ? "2025 vs 2026 so far" : "Event study: " + (t0 - 1) + " (t−1) to " + (t0 + 5) + " (t+5)";
    $("warChartAxis").innerHTML = "Left axis: debt and defense, % of GDP (fiscal years). Right axis: inflation, M2 growth and gold, % change from the year before; ◆ = S&amp;P 500 % change (annual averages, no price path)." +
      (t0 < 1972 ? " Gold&rsquo;s price was fixed by law until 1971, so its line sits at zero." : "") + (iran ? " 2026 = year to date; later years haven&rsquo;t happened yet." : " Shaded = war years.");
    if (!HAS_CHART) return;
    const lab = ev.years.map((y, i) => y + (ev.rel[i] === -1 ? " (t−1)" : y === 2026 ? " YTD" : ""));
    const S = ev.series;
    const line = (label, data, color, axis, opt) => Object.assign({ label, data: data.map((v) => isNum(v) ? v : null), borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 3, tension: 0, yAxisID: axis, spanGaps: true }, opt || {});
    const ds = [
      line("Debt held by the public, % GDP", S.debt_public_pct_gdp, ROSE, "y", { borderWidth: 3.25 }),
      line("Defense, % GDP", S.defense_pct_gdp, TEAL, "y", { borderWidth: 3.25 }),
      line("Inflation", S.cpi_inflation_pct, MAUVE, "y2"),
      line("M2 growth", S.m2_yoy_pct, SLATE, "y2"),
      line("Gold, % change", S.gold_yoy_pct, SAND, "y2", { borderDash: [5, 4] }),
      { type: "scatter", label: "S&P 500 % change (◆)", data: S.sp500_nominal_pct.map((v, i) => isNum(v) ? { x: i, y: v } : null).filter(Boolean), yAxisID: "y2", pointStyle: "rectRot", pointRadius: 7, pointHoverRadius: 9, backgroundColor: "#e7e9e6", borderColor: "#16191c", borderWidth: 1.5, order: -1 },
    ];
    const ext = (axis) => { const v = ds.filter((d) => d.yAxisID === axis).flatMap((d) => d.data.map((p) => p && typeof p === "object" ? p.y : p)).filter(isNum); return [Math.min(0, ...v), Math.max(0, ...v)]; };
    const pad = (lo, hi) => { const r = (hi - lo) || 1; return [lo < 0 ? lo - 0.08 * r : 0, hi + 0.08 * r]; };
    let [l0, l1] = pad(...ext("y")), [r0, r1] = pad(...ext("y2"));
    const f = Math.max(-l0 / (l1 - l0), -r0 / (r1 - r0));
    if (f > 0 && f < 1) { if (-l0 / (l1 - l0) < f) l0 = -f * l1 / (1 - f); else r0 = -f * r1 / (1 - f); }
    const warIdx = ev.rel.map((k, i) => ev.war_rel.indexOf(k) >= 0 ? i : -1).filter((i) => i >= 0);
    const highlights = !iran && warIdx.length ? [{ from: warIdx[0] - 0.5, to: warIdx[warIdx.length - 1] + 0.5, color: "rgba(231,233,230,0.05)", label: "war years", text: "rgba(231,233,230,0.6)" }] : [];
    const narrow = ($("warChart").parentNode.clientWidth || 800) < 520;
    const endTick = (fmt) => (v, i, arr) => { if ((i === 0 || i === arr.length - 1) && arr.length > 3) { const st = Math.abs(arr[2].value - arr[1].value); if (st && Math.abs(v / st - Math.round(v / st)) > 1e-6) return ""; } return fmt(v); };
    if (charts.war) charts.war.destroy();
    charts.war = new Chart($("warChart"), {
      type: "line", data: { labels: lab, datasets: ds },
      options: {
        interaction: { mode: "index", intersect: false }, layout: { padding: { top: 6, right: 4 } },
        scales: {
          x: { type: "category", grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false, font: { size: narrow ? 10 : 12 }, callback: (v, i) => narrow ? String(ev.years[i]).slice(2).replace(/^/, "’") : lab[i] } },
          y: { position: "left", min: l0, max: l1, grid: { color: (c) => c.tick.value === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.05)" }, ticks: { maxTicksLimit: 6, callback: endTick((v) => Math.round(v) + "%") }, title: { display: !narrow, text: "% of GDP", color: "#7b837e", font: { size: 11 } } },
          y2: { position: "right", min: r0, max: r1, grid: { display: false }, ticks: { maxTicksLimit: 6, callback: endTick((v) => (v > 0 ? "+" : "") + Math.round(v) + "%") }, title: { display: !narrow, text: "% change", color: "#7b837e", font: { size: 11 } } },
        },
        plugins: {
          legend: { display: true, position: "top", align: "start", labels: { boxWidth: narrow ? 8 : 12, boxHeight: 3, padding: narrow ? 6 : 10, font: { size: narrow ? 10 : 12 } } },
          bands: { highlights },
          tooltip: { callbacks: { title: (it) => lab[it[0].dataIndex], label: (it) => " " + it.dataset.label.replace(" (◆)", "") + ": " + (it.dataset.yAxisID === "y" ? fx(it.parsed.y, 1) + "% of GDP" : signed(it.parsed.y, 1, "%")) } },
        },
      },
    });
  }

  function renderWarTable() {
    const W = D.wars;
    let h = "<thead><tr><th>War</th><th>Years</th><th>Type</th><th>Debt added</th><th>Debt %</th><th>Debt/GDP before → after</th><th>M2 change</th><th>Peak defense, % GDP</th><th>Peak inflation</th><th>CRS cost</th></tr></thead><tbody>";
    W.majors.forEach((m) => {
      const iran = m.id === "iran_2026";
      const yrs = m.start.slice(0, 4) + "–" + (m.end ? m.end.slice(0, 4) : "");
      h += "<tr data-war='" + m.id + "'><td><b>" + m.short + "</b></td><td>" + yrs + (iran ? " <span class='muted small'>(ongoing)</span>" : "") + "</td><td class='war-type-cell'>" + m.type + "</td>" +
        "<td>" + money$(m.debt_change_bn) + (iran ? " <span class='muted small'>YTD</span>" : "") + "</td><td>" + signed(m.debt_change_pct, iran ? 1 : 0, "%") + "</td>" +
        "<td>" + fx(m.dpub_start, 1) + "% → " + (iran ? "<span class='muted'>n/a yet</span>" : fx(m.dpub_end, 1) + "%") + "</td>" +
        "<td>" + signed(m.m2_change_pct, iran ? 1 : 0, "%") + (iran ? " <span class='muted small'>YTD</span>" : "") + "</td>" +
        "<td>" + (iran ? fx(m.def_prewar, 1) + "% <span class='muted small'>(FY25, pre-war)</span>" : fx(m.def_peak, 1) + "% <span class='muted small'>(FY" + m.def_peak_fy + ")</span>") + "</td>" +
        "<td>" + (iran ? fx(m.infl_avg, 1) + "% <span class='muted small'>YTD avg</span>" : fx(m.infl_peak, 1) + "% <span class='muted small'>(" + m.infl_peak_year + ")</span>") + "</td>" +
        "<td>" + plain$(m.crs_cost_bn) + (iran ? " <span class='muted small'>DoD est.</span>" : m.crs_note ? " <span class='muted small'>(net $4.7B)</span>" : "") + "</td></tr>";
    });
    $("warTable").innerHTML = h + "</tbody>";
    $("warTable").querySelectorAll("tr[data-war]").forEach((tr) => tr.onclick = () => selectWar(tr.dataset.war, true));
    $("warTableNote").innerHTML = "Debt = gross federal debt, from the end of the fiscal year before the war to the end of the fiscal year in which it ended. Debt/GDP = debt held by the public (WWI: Treasury debt ÷ GNP). M2 and inflation use calendar years; peak inflation looks up to two years past the end. CRS cost = military operations only (no veterans&rsquo; benefits or interest); Iraq covers 2003–2010; Iran 2026 = DoD operational estimate through May. " + W.caveat;
    $("warTableSources").innerHTML = srcLine(W.table_sources);
  }

  // ------------------------------------------------------------ METHOD / FOOTER
  function renderMeta() {
    const latest = D.series.latest_by_series || {};
    $("methodLatest").textContent = monthName(latest.Unemployment || D.series.dates[D.series.dates.length - 1]);
    const A = D.analogs;
    $("methodFeatures").textContent = (A.is_placeholder ? "Ranking shown is EXAMPLE data. " : "") + "Features used: " + D.annual.features.map((f) => (FEAT[f] || { label: f }).label).join(", ") + ". Weights: " +
      (D.annual.weights_source.indexOf("analog_weights") >= 0 ? "from the scoring step (currently all equal)" : "equal (default)") + ".";
    const b = D.series.built_at ? new Date(D.series.built_at) : null;
    $("footBuilt").textContent = b ? "Data files built " + b.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }) + " CT." : "";
  }

  // ------------------------------------------------------------ boot
  async function boot() {
    try { D = await loadData(); } catch (e) { document.querySelector("main").insertAdjacentHTML("afterbegin", "<div class='noscript'>Could not load the data files. Run build_data.py, then serve this folder (python3 -m http.server).</div>"); return; }
    D.series.dates.forEach((d, i) => (idx[d] = i));
    recBands = (D.series.recessions || []).map(([a, b]) => [tOf(a), tOf(b) + 1 / 12]);
    histRows = D.analogs.rows.filter((r) => r.historical_rank).sort((a, b) => a.historical_rank - b.historical_rank);
    if (!HAS_CHART) document.querySelector("main").insertAdjacentHTML("afterbegin", "<div class='noscript'>The chart library didn't load (offline?). Numbers are shown; charts need an internet connection.</div>");
    renderHero();
    renderCallouts();
    buildYearPicker();
    buildMiniGrid();
    selectYear(histRows[0] ? histRows[0].year : 2007);
    renderSnapshot();
    initBuilder();
    renderMeta();
    initRankFilter();
    whenVisible($("rankChart"), renderRanking);
    renderHistoryTabs();
    whenVisible($("historyChart"), updateHistory);
    renderMoney();
    renderEras();
    renderWars();
    initCompare();
    renderPress();
    renderExpansion();
    renderPerTaxpayer();
    initQR();
    document.querySelectorAll(".toggle[role=tablist] button[data-h]").forEach((b) => b.onclick = () => {
      nextH = +b.dataset.h; document.querySelectorAll("button[data-h]").forEach((x) => { x.classList.toggle("active", x === b); x.setAttribute("aria-selected", x === b); }); renderNext(selectedYear);
    });
    window.__dashboardReady = true;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  // expose scorer for QA (console / tests)
  window.__scoreBuilder = (vec) => scoreBuilder(vec);
})();
