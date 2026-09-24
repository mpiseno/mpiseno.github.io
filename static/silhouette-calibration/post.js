const MEDIA = "../static/silhouette-calibration/showcase/";

(function showcase() {
  const seg = document.getElementById("epseg");
  const video = document.getElementById("epvideo");
  const info = document.getElementById("epinfo");
  const label = ep => ep.key.split("|").join(" | ").slice(0, -12);
  function show(ep, btn) {
    const dir = MEDIA + ep.stem + "/";
    video.poster = dir + "poster.jpg";
    video.src = dir + "overlay.mp4";
    document.getElementById("epext").src = dir + "external.jpg";
    info.textContent = label(ep) + ". DROID's pose and ours differ by " + ep.mm + " mm / " + ep.deg + "\u00b0.";
    seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
  }
  window.SHOWCASE.forEach((ep, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label(ep);
    b.addEventListener("click", () => show(ep, b));
    seg.appendChild(b);
    if (i === 0) show(ep, b);
  });
  // Optional <span id="eprange"> in the prose: the min/max pose difference across the showcase episodes.
  const range = document.getElementById("eprange");
  if (range) {
    const mm = window.SHOWCASE.map(ep => ep.mm);
    const deg = window.SHOWCASE.map(ep => ep.deg);
    range.textContent = Math.round(Math.min(...mm)) + " to " + Math.round(Math.max(...mm)) +
      " mm and " + Math.min(...deg).toFixed(1) + " to " + Math.max(...deg).toFixed(1) + "\u00b0";
  }
})();

function spreadChart(cfg) {
  const R = cfg.ref;
  const SETS = cfg.sets;
  const DATA = cfg.data;
  const M = { l: 48, r: 14, t: 12, b: 42 };
  const NS = "http://www.w3.org/2000/svg";
  const host = document.getElementById(cfg.host);
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.hidden = true;

  function el(name, attrs, text) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function pct(a, p) {
    const s = [...a].sort((u, v) => u - v);
    return s[Math.min(s.length - 1, Math.floor(p * s.length))];
  }

  function draw() {
    // Drawn at the container's pixel size so text and marks stay the same size at every page width.
    const W = host.clientWidth || 450;
    const H = Math.round(Math.max(230, Math.min(300, W * 0.62)));
    const sx = v => M.l + (v - R.x[0]) / (R.x[1] - R.x[0]) * (W - M.l - M.r);
    const sy = v => H - M.b - (v - R.y[0]) / (R.y[1] - R.y[0]) * (H - M.t - M.b);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Scatter: " + R.xl + " against " + R.yl });
    R.xt.forEach(t => {
      svg.appendChild(el("line", { class: "grid", x1: sx(t), x2: sx(t), y1: M.t, y2: H - M.b }));
      svg.appendChild(el("text", { x: sx(t), y: H - M.b + 15, "text-anchor": "middle" }, t));
    });
    R.yt.forEach(t => {
      svg.appendChild(el("line", { class: "grid", x1: M.l, x2: W - M.r, y1: sy(t), y2: sy(t) }));
      svg.appendChild(el("text", { x: M.l - 8, y: sy(t) + 4, "text-anchor": "end" }, t));
    });
    svg.appendChild(el("text", { class: "axis-title", x: (M.l + W - M.r) / 2, y: H - 9, "text-anchor": "middle" }, R.xl));
    svg.appendChild(el("text", { class: "axis-title", x: 14, y: (M.t + H - M.b) / 2, "text-anchor": "middle",
      transform: `rotate(-90 14 ${(M.t + H - M.b) / 2})` }, R.yl));

    const medians = [];
    SETS.forEach(([set, label, color]) => {
      DATA.forEach(row => {
        const [mm, deg] = row[set + "_wrist"];
        const cx = Math.min(Math.max(mm, R.x[0]), R.x[1]);
        const cy = Math.min(Math.max(deg, R.y[0]), R.y[1]);
        const isOff = cx !== mm || cy !== deg;
        const mark = el("circle", { cx: sx(cx), cy: sy(cy), r: 4.2 });
        mark.setAttribute("class", isOff ? "mark off" : "mark");
        mark.style[isOff ? "stroke" : "fill"] = color;
        mark.style.cursor = "pointer";
        const showTip = () => {
          tip.textContent = `${label} · ${row.key.replace("|", " | ")} · ${mm.toFixed(1)} mm, ${deg.toFixed(2)}°`;
          tip.hidden = false;
          tip.style.left = Math.max(Math.min(sx(cx) + 8, host.clientWidth - 200), 0) + "px";
          tip.style.top = Math.max(sy(cy) - 40, 0) + "px";
        };
        mark.addEventListener("pointerenter", showTip);
        mark.addEventListener("click", showTip);
        mark.addEventListener("pointerleave", () => { tip.hidden = true; });
        svg.appendChild(mark);
      });
      medians.push([pct(DATA.map(r => r[set + "_wrist"][0]), 0.5), pct(DATA.map(r => r[set + "_wrist"][1]), 0.5), color]);
    });
    medians.forEach(([mm, deg, color]) => {
      svg.appendChild(el("circle", { class: "med", cx: sx(mm), cy: sy(deg), r: 6.5, fill: color }));
    });
    host.replaceChildren(svg, tip);

    const table = document.getElementById(cfg.table);
    table.innerHTML = "<thead><tr><th>spread</th><th>x mm</th><th>y mm</th><th>z mm</th><th>pitch °</th><th>yaw °</th><th>roll °</th></tr></thead>";
    const body = document.createElement("tbody");
    SETS.forEach(([set, label]) => {
      const tr = document.createElement("tr");
      [label].concat(cfg.axes[set].map((v, i) => v.toFixed(i < 3 ? 1 : 2))).forEach(v => {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
  }

  draw();
  let lastWidth = host.clientWidth;
  window.addEventListener("resize", () => {
    if (host.clientWidth !== lastWidth) {
      lastWidth = host.clientWidth;
      draw();
    }
  });
}

spreadChart({
  host: "chart", table: "spreadtable", data: window.SPREAD, axes: window.SPREAD_AXES,
  sets: [["droid", "DROID", "#2a78d6"], ["ours", "Ours", "#1baf7a"]],
  ref: { x: [60, 110], y: [86, 94], xt: [60, 70, 80, 90, 100, 110], yt: [86, 88, 90, 92, 94],
         xl: "translation from the attachment site (mm)", yl: "rotation from the site (°)" },
});
