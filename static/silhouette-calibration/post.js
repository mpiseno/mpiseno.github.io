const MEDIA = "../static/silhouette-calibration/";

const EPISODES = [
  { stem: "WEIRD_2023-11-07-19h-29m-35s", key: "WEIRD | 2023-11-07", mm: 36.8, deg: 2.72 },
  { stem: "RAD_2023-09-09-07h-26m-48s", key: "RAD | 2023-09-09", mm: 31.0, deg: 2.32 },
  { stem: "IPRL_2023-08-24-20h-35m-05s", key: "IPRL | 2023-08-24", mm: 25.2, deg: 3.49 },
];

(function showcase() {
  const seg = document.getElementById("epseg");
  const video = document.getElementById("epvideo");
  const cap = document.getElementById("epcap");
  function show(ep, btn) {
    video.poster = MEDIA + ep.stem + ".jpg";
    video.src = MEDIA + ep.stem + ".mp4";
    document.getElementById("epext").src = MEDIA + ep.stem + "_ext.jpg";
    cap.textContent = ep.key + ". DROID's pose and ours differ by " + ep.mm + " mm / " + ep.deg +
      "°. Top: the two camera poses at the video's poster frame, drawn with the true field of view (frustum depth 4 cm). The labelled triad is the attachment site, the frame every distance in Fig. 3 is measured from; only the parts covering the attachment site (flange, coupling, gripper base) are see-through. Bottom: outlines rendered per frame from recorded joints and aperture.";
    seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
  }
  EPISODES.forEach((ep, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = ep.key;
    b.addEventListener("click", () => show(ep, b));
    seg.appendChild(b);
    if (i === 0) show(ep, b);
  });
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

    const off = {};
    SETS.forEach(([set]) => { off[set] = 0; });
    const medians = [];
    SETS.forEach(([set, label, color]) => {
      DATA.forEach(row => {
        const [mm, deg] = row[set + "_wrist"];
        const cx = Math.min(Math.max(mm, R.x[0]), R.x[1]);
        const cy = Math.min(Math.max(deg, R.y[0]), R.y[1]);
        const isOff = cx !== mm || cy !== deg;
        if (isOff) off[set] += 1;
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

    let cap = "One mark per episode (n = " + DATA.length + "). Tap a mark for the episode.";
    const offTotal = SETS.reduce((n, [set]) => n + off[set], 0);
    if (offTotal > 0) {
      cap += " Hollow marks are beyond the axis range and drawn at the edge: " + SETS.map(([set, label]) => off[set] + " " + label).join(", ") + ".";
    }
    document.getElementById(cfg.cap).textContent = cap;

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
  host: "chart", cap: "chartcap", table: "spreadtable", data: window.SPREAD, axes: window.SPREAD_AXES,
  sets: [["droid", "DROID-provided", "#2a78d6"], ["ours", "ours", "#1baf7a"]],
  ref: { x: [60, 110], y: [86, 94], xt: [60, 70, 80, 90, 100, 110], yt: [86, 88, 90, 92, 94],
         xl: "translation from the attachment site (mm)", yl: "rotation from the site (°)" },
});
