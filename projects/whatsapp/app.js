/* eslint-disable no-undef */
"use strict";

// Public-mode dashboard: renders pre-aggregated stats from data.js.
// No raw messages, no per-message topic labels — see build_public.py in the
// source project (~/0.projects/260505-whatsapp-viewer/code/) for how data.js
// is generated.

const PALETTE_LIGHT = ["#dbe0e6", "#edded8", "#e4e7dd", "#e8e2ea", "#f0ebdc", "#dee3e3"]; // Mist
const PALETTE_DARK  = ["#7a8a9a", "#a08778", "#8a9577", "#9c8aa0", "#b0a17a", "#7a9595"]; // Dusk

function currentPalette() {
  const t = document.documentElement.dataset.theme;
  const isDark = t === "dark"
    || (!t && matchMedia("(prefers-color-scheme: dark)").matches);
  return isDark ? PALETTE_DARK : PALETTE_LIGHT;
}

let activeChartColors = new Map();
const state = { chat: null };

const fmtNum = (n) => (n == null ? "—" : Math.round(n).toLocaleString());
const fmtDuration = (sec) => {
  if (sec == null) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)}h`;
  return `${(sec / 86400).toFixed(1)}d`;
};
const fmtDate = (tsOrIso) => {
  if (!tsOrIso) return "—";
  const d = typeof tsOrIso === "number" ? new Date(tsOrIso * 1000) : new Date(tsOrIso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

function niceCeiling(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const steps = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
  for (const s of steps) if (norm <= s) return s * mag;
  return 10 * mag;
}

function colorFor(name) {
  if (activeChartColors.has(name)) return activeChartColors.get(name);
  const p = currentPalette();
  const c = p[activeChartColors.size % p.length];
  activeChartColors.set(name, c);
  return c;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "style" && typeof v === "object") {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith("--")) node.style.setProperty(sk, sv);
        else node.style[sk] = sv;
      }
    } else if (k.startsWith("data-")) node.setAttribute(k, v);
    else if (k === "className") node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ─── Renderers ────────────────────────────────────────────────────────────

function renderHorizontalBars(targetId, rows, opts = {}) {
  const { showPct = true } = opts;
  const target = document.getElementById(targetId);
  clear(target);
  target.classList.add("bars-h");
  if (!rows.length) { target.textContent = "(no data)"; return; }
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  const max = Math.max(1, ...rows.map((r) => r.value));
  rows.forEach((r) => {
    const pct = (r.value / max) * 100;
    const sharePct = (r.value / total) * 100;
    const row = el("div", { className: "bar-row" });
    row.appendChild(el("div", { className: "bar-name" }, r.name));
    const track = el("div", { className: "bar-track" });
    track.appendChild(el("div", {
      className: "bar-fill",
      style: { width: `${pct}%`, "--fill-color": r.color },
    }));
    row.appendChild(track);
    row.appendChild(el("div", { className: "bar-value" }, fmtNum(r.value)));
    if (showPct) row.appendChild(el("div", { className: "bar-pct" }, `${sharePct.toFixed(1)}%`));
    target.appendChild(row);
  });
}

function renderStackedVerticalBars(targetId, stacksValues, senderInfo, opts = {}) {
  const { height = "12rem", tickLabels = null, overflowLabels = false, tickMarkers = false } = opts;
  const target = document.getElementById(targetId);
  clear(target);
  target.classList.add("bars-v");
  if (!stacksValues.length) { target.textContent = "(no data)"; return; }

  const totals = stacksValues.map((p) => p.reduce((a, b) => a + b, 0));
  const max = niceCeiling(Math.max(1, ...totals));
  const grid = el("div", { className: "bars-v-grid" });

  const yAxis = el("div", { className: "bars-v-yaxis", style: { height } });
  yAxis.appendChild(el("div", { className: "y-tick" }, fmtNum(max)));
  yAxis.appendChild(el("div", { className: "y-tick" }, fmtNum(Math.round(max / 2))));
  yAxis.appendChild(el("div", { className: "y-tick" }, "0"));
  grid.appendChild(yAxis);

  const area = el("div", { className: "bars-v-area", style: { height } });
  stacksValues.forEach((parts, i) => {
    const stack = el("div", {
      className: "bars-v-stack",
      title: `${tickLabels && tickLabels[i] ? tickLabels[i] + ": " : ""}${fmtNum(totals[i])}`,
    });
    senderInfo.forEach((s, si) => {
      const v = parts[si] || 0;
      const pct = (v / max) * 100;
      if (pct === 0) return;
      stack.appendChild(el("div", {
        className: "bars-v-seg",
        style: { height: `${pct}%`, "--fill-color": s.color },
        title: `${s.name}: ${fmtNum(v)}`,
      }));
    });
    area.appendChild(stack);
  });
  grid.appendChild(area);

  if (tickLabels) {
    grid.appendChild(el("div"));
    const rowClass = "bars-v-xaxis-row"
      + (overflowLabels ? " overflow-labels" : "")
      + (tickMarkers ? " with-ticks" : "");
    const row = el("div", { className: rowClass });
    tickLabels.forEach((lab) => {
      row.appendChild(el("div", { className: "bars-v-xtick" + (lab ? " has-label" : "") }, lab));
    });
    grid.appendChild(row);
  }
  target.appendChild(grid);
}

function senderStackInfo(stats) {
  return stats.senders.map((s) => ({
    name: s.name,
    color: colorFor(s.name),
    idx: stats.senderNames.indexOf(s.name),
  }));
}

function renderTimelineDualAxis(targetId, byBarCounts, senderInfo, opts = {}) {
  const { height = "16rem", tickLabels = null, barLabels = null, overflowLabels = false, tickMarkers = false } = opts;
  const target = document.getElementById(targetId);
  clear(target);
  target.classList.add("bars-v");
  if (!byBarCounts.length) { target.textContent = "(no data)"; return; }

  const totals = byBarCounts.map((p) => p.reduce((a, b) => a + b, 0));
  const max = niceCeiling(Math.max(1, ...totals));
  const n = byBarCounts.length;

  const grid = el("div", { className: "bars-v-grid bars-v-grid-dual" });

  const yLeft = el("div", { className: "bars-v-yaxis", style: { height } });
  yLeft.appendChild(el("div", { className: "y-tick" }, "100%"));
  yLeft.appendChild(el("div", { className: "y-tick" }, "50%"));
  yLeft.appendChild(el("div", { className: "y-tick" }, "0"));
  grid.appendChild(yLeft);

  const area = el("div", { className: "bars-v-area bars-v-area-overlay", style: { height } });
  byBarCounts.forEach((parts, i) => {
    const total = totals[i] || 0;
    const lbl = barLabels && barLabels[i] ? `${barLabels[i]}: ` : "";
    const stack = el("div", { className: "bars-v-stack", title: `${lbl}${fmtNum(total)}` });
    if (total > 0) {
      senderInfo.forEach((s, si) => {
        const v = parts[si] || 0;
        if (v === 0) return;
        const pct = (v / total) * 100;
        stack.appendChild(el("div", {
          className: "bars-v-seg",
          style: { height: `${pct}%`, "--fill-color": s.color },
          title: `${s.name}: ${fmtNum(v)} (${pct.toFixed(0)}%)`,
        }));
      });
    }
    area.appendChild(stack);
  });

  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("class", "bars-v-overlay-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  const pts = totals.map((t, i) => {
    const x = ((i + 0.5) / n) * 100;
    const y = (1 - t / max) * 100;
    return `${x.toFixed(3)},${y.toFixed(3)}`;
  }).join(" ");
  const halo = document.createElementNS(svgNs, "polyline");
  halo.setAttribute("points", pts);
  halo.setAttribute("class", "overlay-line-halo");
  svg.appendChild(halo);
  const poly = document.createElementNS(svgNs, "polyline");
  poly.setAttribute("points", pts);
  poly.setAttribute("class", "overlay-line");
  svg.appendChild(poly);
  area.appendChild(svg);
  grid.appendChild(area);

  const yRight = el("div", { className: "bars-v-yaxis bars-v-yaxis-right", style: { height } });
  yRight.appendChild(el("div", { className: "y-tick" }, fmtNum(max)));
  yRight.appendChild(el("div", { className: "y-tick" }, fmtNum(Math.round(max / 2))));
  yRight.appendChild(el("div", { className: "y-tick" }, "0"));
  grid.appendChild(yRight);

  if (tickLabels) {
    grid.appendChild(el("div"));
    const rowClass = "bars-v-xaxis-row"
      + (overflowLabels ? " overflow-labels" : "")
      + (tickMarkers ? " with-ticks" : "");
    const row = el("div", { className: rowClass });
    tickLabels.forEach((lab) => {
      row.appendChild(el("div", { className: "bars-v-xtick" + (lab ? " has-label" : "") }, lab));
    });
    grid.appendChild(row);
    grid.appendChild(el("div"));
  }
  target.appendChild(grid);
}

function renderSenderTable(stats) {
  const tbody = document.querySelector("#sender-table tbody");
  const tfoot = document.querySelector("#sender-table tfoot");
  const list = document.getElementById("sender-list");
  const rateDays = stats.data_days || stats.span_days || 1;
  const totalMessages = stats.total_messages || stats.senders.reduce((a, s) => a + s.messages, 0);

  tbody.innerHTML = stats.senders.map((s) => {
    const wordsPerDay = s.words / rateDays;
    const color = colorFor(s.name);
    return `
      <tr style="--sender-color:${color};--fill-color:${color}">
        <td><span class="sender-cell"><span class="sender-swatch" aria-hidden="true"></span><span class="sender-name">${escapeHtml(s.name)}</span></span></td>
        <td>${fmtNum(s.messages)}</td>
        <td>${fmtNum(s.words)}</td>
        <td>${fmtNum(Math.round(wordsPerDay))}</td>
        <td>${s.avg_words}</td>
        <td>${fmtNum(s.media)}</td>
        <td>${fmtNum(s.questions)}</td>
        <td>${fmtDuration(s.median_response_sec)}</td>
      </tr>`;
  }).join("");

  const t = stats.senders.reduce((a, s) => ({
    messages: a.messages + s.messages,
    words: a.words + s.words,
    media: a.media + s.media,
    questions: a.questions + s.questions,
  }), { messages: 0, words: 0, media: 0, questions: 0 });
  const avgWords = t.messages ? (t.words / t.messages).toFixed(1) : "—";
  const wordsPerDay = t.words / rateDays;
  tfoot.innerHTML = `
    <tr class="totals-row">
      <td><span class="sender-cell"><span class="sender-name">Total</span></span></td>
      <td>${fmtNum(t.messages)}</td>
      <td>${fmtNum(t.words)}</td>
      <td>${fmtNum(Math.round(wordsPerDay))}</td>
      <td>${avgWords}</td>
      <td>${fmtNum(t.media)}</td>
      <td>${fmtNum(t.questions)}</td>
      <td>—</td>
    </tr>`;

  // Mobile-only person list — same data, editorial layout. Shown at narrow
  // viewports; the desktop <table> is hidden via .desktop-only / .mobile-only.
  if (list) {
    const stat = (label, value) =>
      `<div class="person-stat"><span class="person-stat-label">${label}</span><span class="person-stat-value">${value}</span></div>`;

    const personRow = ({ name, color, isTotal, messages, words, wordsPerDay, avgWords, media, questions, medianReply, sharePct }) => {
      const tail = sharePct != null
        ? `${fmtNum(messages)} msgs · ${sharePct.toFixed(0)}%`
        : `${fmtNum(messages)} msgs`;
      const swatchClass = isTotal ? "person-swatch person-swatch-blank" : "person-swatch";
      const rowClass = isTotal ? "person-row person-total" : "person-row";
      return `
        <div class="${rowClass}" style="--accent:${color}">
          <div class="person-head">
            <span class="${swatchClass}" aria-hidden="true"></span>
            <span class="person-name">${escapeHtml(name)}</span>
            <span class="person-tail">${tail}</span>
          </div>
          <div class="person-stats">
            ${stat("words", fmtNum(words))}
            ${stat("w/day", fmtNum(Math.round(wordsPerDay)))}
            ${stat("avg/msg", avgWords)}
            ${stat("media", fmtNum(media))}
            ${stat("questions", fmtNum(questions))}
            ${stat("median reply", medianReply)}
          </div>
        </div>`;
    };

    const senderRows = stats.senders.map((s) => personRow({
      name: s.name,
      color: colorFor(s.name),
      isTotal: false,
      messages: s.messages,
      words: s.words,
      wordsPerDay: s.words / rateDays,
      avgWords: s.avg_words,
      media: s.media,
      questions: s.questions,
      medianReply: fmtDuration(s.median_response_sec),
      sharePct: totalMessages ? (s.messages / totalMessages) * 100 : null,
    })).join("");

    const totalRow = personRow({
      name: "Total",
      color: "transparent",
      isTotal: true,
      messages: t.messages,
      words: t.words,
      wordsPerDay: t.words / rateDays,
      avgWords,
      media: t.media,
      questions: t.questions,
      medianReply: "—",
      sharePct: null,
    });

    list.innerHTML = senderRows + totalRow;
  }
}

function renderShareChart(stats) {
  const rows = stats.senders.slice().sort((a, b) => b.words - a.words)
    .map((s) => ({ name: s.name, value: s.words, color: colorFor(s.name) }));
  renderHorizontalBars("chart-share", rows);
}

function renderStartsChart(stats) {
  const rows = stats.senders.slice().sort((a, b) => b.starts - a.starts)
    .map((s) => ({ name: s.name, value: s.starts, color: colorFor(s.name) }));
  renderHorizontalBars("chart-starts", rows);
}

function renderTimelineChart(stats) {
  const info = senderStackInfo(stats);
  const byBarCounts = stats.by_month_by_sender.map(({ counts }) => info.map((s) => counts[s.idx] || 0));
  const labels = stats.by_month_by_sender.map((m) => m.month);
  const n = labels.length;
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthNameYear = (m) => {
    const [y, mo] = m.split("-");
    return `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${y.slice(2)}`;
  };
  let tickLabels;
  if (n >= 36) tickLabels = labels.map((m) => m.endsWith("-01") ? m.slice(0, 4) : "");
  else if (n >= 18) tickLabels = labels.map((m, i) => i % 3 === 0 ? monthNameYear(m) : "");
  else if (n >= 6) tickLabels = labels.map((m, i) => i % 2 === 0 ? monthNameYear(m) : "");
  else tickLabels = labels.map(monthNameYear);
  renderTimelineDualAxis("chart-timeline", byBarCounts, info, {
    height: "16rem",
    tickLabels,
    barLabels: labels.map(monthNameYear),
    overflowLabels: true,
    tickMarkers: true,
  });
}

function renderHourChart(stats) {
  const labels = Array(24).fill("");
  labels[0] = "0"; labels[6] = "6"; labels[12] = "12"; labels[18] = "18"; labels[23] = "24";
  const info = senderStackInfo(stats);
  const stacks = stats.by_hour_by_sender.map((perHour) => info.map((s) => perHour[s.idx] || 0));
  renderStackedVerticalBars("chart-hour", stacks, info, { height: "10rem", tickLabels: labels });
}

function renderDowChart(stats) {
  const info = senderStackInfo(stats);
  const stacks = stats.by_dow_by_sender.map((perDow) => info.map((s) => perDow[s.idx] || 0));
  renderStackedVerticalBars("chart-dow", stacks, info, {
    height: "10rem",
    tickLabels: ["M", "T", "W", "T", "F", "S", "S"],
  });
}

const topicsUi = { expanded: new Set() };

function renderTopics() {
  const card = document.getElementById("topics-card");
  if (!card) return;
  const list = document.getElementById("topics-list");
  clear(list);

  const t = state.chat?.topics;
  if (!t || !t.categories || t.categories.length === 0) {
    list.innerHTML = `<div class="muted">Topics not available in this build.</div>`;
    return;
  }

  const cats = t.categories.slice().sort((a, b) => b.total - a.total);
  const grandMax = Math.max(...cats.map((c) => c.total), 1);

  cats.forEach((cat, ci) => {
    if (cat.total === 0) return;
    const row = el("div", { className: "topic-row" });
    const hasSubs = cat.subtopics && cat.subtopics.length > 0;
    const isOpen = topicsUi.expanded.has(ci) && hasSubs;

    const label = el("button", { className: "topic-label" + (hasSubs ? "" : " topic-label-leaf") });
    label.appendChild(el("span", { className: "topic-caret" }, hasSubs ? (isOpen ? "▾" : "▸") : " "));
    label.appendChild(el("span", { className: "topic-name" }, cat.name));
    if (hasSubs) {
      label.addEventListener("click", () => {
        if (topicsUi.expanded.has(ci)) topicsUi.expanded.delete(ci);
        else topicsUi.expanded.add(ci);
        renderTopics();
      });
    } else {
      label.disabled = true;
    }
    row.appendChild(label);

    const bar = el("div", { className: "topic-bar" });
    bar.style.width = `${(cat.total / grandMax) * 100}%`;
    cat.by_sender.forEach((w, si) => {
      if (w === 0) return;
      const pct = (w / cat.total) * 100;
      const name = state.chat.senderNames[si];
      bar.appendChild(el("div", {
        className: "topic-seg",
        style: { width: `${pct}%`, "--fill-color": colorFor(name) },
        title: `${name} · ${fmtNum(w)} words (${pct.toFixed(1)}% of this category)`,
      }));
    });
    row.appendChild(bar);
    row.appendChild(el("div", { className: "topic-total" }, fmtNum(cat.total)));
    list.appendChild(row);

    if (isOpen) {
      const subs = cat.subtopics.slice().sort((a, b) => b.total - a.total);
      const subMax = Math.max(...subs.map((s) => s.total), 1);
      subs.forEach((sub) => {
        const subRow = el("div", { className: "topic-row topic-sub" });
        subRow.appendChild(el("div", { className: "topic-sub-label" }, sub.name));
        const subBar = el("div", { className: "topic-bar" });
        subBar.style.width = `${(sub.total / subMax) * 100 * (cat.total / grandMax)}%`;
        sub.by_sender.forEach((w, si) => {
          if (w === 0) return;
          const pct = (w / sub.total) * 100;
          const name = state.chat.senderNames[si];
          subBar.appendChild(el("div", {
            className: "topic-seg",
            style: { width: `${pct}%`, "--fill-color": colorFor(name) },
            title: `${name} · ${fmtNum(w)} words`,
          }));
        });
        subRow.appendChild(subBar);
        subRow.appendChild(el("div", { className: "topic-total" }, fmtNum(sub.total)));
        list.appendChild(subRow);
      });
    }
  });

  if (t.unclassified_words > 0) {
    list.appendChild(el("div", { className: "topics-footnote muted" },
      `${fmtNum(t.unclassified_words)} words unclassified.`));
  }
}

function render(stats) {
  renderSenderTable(stats);
  renderShareChart(stats);
  renderStartsChart(stats);
  renderTimelineChart(stats);
  renderHourChart(stats);
  renderDowChart(stats);
  renderTopics();
}

function buildNav(chats) {
  const nav = document.getElementById("chat-nav");
  if (!nav) return;
  nav.innerHTML = "";
  chats.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${c.label} · ${c.total_messages.toLocaleString()}`;
    if (i === 0) btn.classList.add("active");
    btn.addEventListener("click", () => {
      [...nav.children].forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectChat(c);
    });
    nav.appendChild(btn);
  });
}

function selectChat(chat) {
  state.chat = chat;
  activeChartColors = new Map();
  chat.senderNames.forEach((n) => colorFor(n));
  render(chat);
}

function init() {
  if (!window.DASHBOARD_DATA) {
    document.body.innerHTML = "<p style='padding:40px'>data.js failed to load.</p>";
    return;
  }
  const chats = window.DASHBOARD_DATA.chats;
  buildNav(chats);
  if (chats.length <= 1 && document.getElementById("chat-nav")) {
    document.getElementById("chat-nav").style.display = "none";
  }
  selectChat(chats[0]);

  const onThemeChange = () => {
    if (!state.chat) return;
    activeChartColors = new Map();
    state.chat.senderNames.forEach((n) => colorFor(n));
    render(state.chat);
  };
  document.addEventListener("theme-changed", onThemeChange);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onThemeChange);
}

document.addEventListener("DOMContentLoaded", init);
