/* Original line illustrations for recipes (not photographs). Each is a small inline SVG that
   draws with the restaurant's theme colors through CSS variables, so it matches every theme.
   Run: node tools/illustrations.js  → writes them into the recipes' "illustration" field. */
const VB = "0 0 240 160";
const INK = "var(--r-ink)", ACC = "var(--r-accent)";
const f = n => Math.round(n * 10) / 10;
const line = (d, o = {}) => `<path d="${d}" fill="${o.fill || "none"}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.6}"${o.op ? ` opacity="${o.op}"` : ""} stroke-linecap="round" stroke-linejoin="round"/>`;
const blob = (d, color = ACC, op = .16) => `<path d="${d}" fill="${color}" opacity="${op}"/>`;
const circle = (x, y, r, o = {}) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${o.fill || "none"}" stroke="${o.stroke || (o.fill ? "none" : INK)}" stroke-width="${o.w || 1.6}"${o.op ? ` opacity="${o.op}"` : ""}/>`;
const ellipse = (x, y, rx, ry, o = {}) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${o.fill || "none"}" stroke="${o.stroke || INK}" stroke-width="${o.w || 1.6}"${o.op ? ` opacity="${o.op}"` : ""}/>`;
// Archimedean spiral, used for pinwheels and twirled pasta
function spiral(cx, cy, r, turns, sy = 1) {
  let d = "";
  const n = Math.round(turns * 48);
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = t * turns * 2 * Math.PI, rr = t * r;
    d += (i ? "L" : "M") + f(cx + rr * Math.cos(a)) + " " + f(cy + rr * Math.sin(a) * sy);
  }
  return d;
}
function wave(x0, y0, len, amp, periods, tilt = 0) {
  let d = "";
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    d += (i ? "L" : "M") + f(x0 + t * len) + " " + f(y0 + Math.sin(t * periods * 2 * Math.PI) * amp + t * tilt);
  }
  return d;
}
const plate = (cx = 120, cy = 104, rx = 92, ry = 30) => ellipse(cx, cy, rx, ry, { op: .55 }) + ellipse(cx, cy, rx - 14, ry - 6, { op: .3, w: 1.2 });
const leaf = (x, y, len, ang, w = .38) => {
  const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const P = (u, v) => f(x + u * c - v * s) + " " + f(y + u * s + v * c);
  return line(`M${P(0, 0)} Q${P(len * .5, -len * w)} ${P(len, 0)} Q${P(len * .5, len * w)} ${P(0, 0)}`) + line(`M${P(len * .1, 0)} L${P(len * .85, 0)}`, { w: 1, op: .6 });
};

const ART = {
  "chicken-pad-thai": () => plate() +
    [0, 1, 2, 3, 4, 5].map(i => line(wave(52 + i * 3, 88 + i * 5, 128 - i * 6, 5 - i * .3, 2.5 + i * .2, 4), { w: 2.4, stroke: i % 2 ? INK : ACC, op: i % 2 ? 1 : .8 })).join("") +
    line("M168 66 A20 20 0 0 1 196 84 L168 66 Z", { fill: "var(--r-paper-deep)" }) + line("M172 70 L190 82", { w: 1, op: .6 }) +
    [[78, 80], [96, 76], [118, 79], [140, 77], [104, 112], [130, 114]].map(([x, y]) => line(`M${x} ${y} q3 -4 7 -1 q-2 5 -7 1`, { w: 1.3 })).join("") +
    [[86, 98, 20], [150, 96, -25], [120, 104, 10]].map(([x, y, a]) => line(`M${x} ${y} l${f(16 * Math.cos(a * Math.PI / 180))} ${f(16 * Math.sin(a * Math.PI / 180))}`, { w: 1.4, op: .7 })).join(""),
  "peking-duck-tacos": () => {
    const taco = (cx, cy) => line(`M${cx - 38} ${cy} A38 32 0 0 1 ${cx + 38} ${cy} Z`, { fill: "var(--r-paper-deep)" }) +
      [-24, -14, -4, 6, 16, 26].map((dx, i) => line(`M${cx + dx} ${cy - 2} l${i % 2 ? 6 : -5} -${18 + (i % 3) * 5}`, { w: 2.2, stroke: i % 2 ? ACC : INK, op: .85 })).join("") +
      line(`M${cx - 30} ${cy - 6} Q${cx} ${cy - 22} ${cx + 30} ${cy - 6}`, { w: 3, stroke: ACC, op: .35 });
    return ellipse(120, 116, 100, 18, { op: .45 }) + taco(78, 112) + taco(158, 112) + [100, 112, 128, 140].map(x => circle(x, 132, 1.3, { fill: INK })).join("");
  },
  "perilla-oil-shellfish": () => ellipse(120, 100, 86, 34, { op: .55 }) + ellipse(120, 96, 66, 22, { op: .35, w: 1.2 }) +
    blob("M62 98 Q80 78 120 78 Q166 78 178 98 Q160 116 120 116 Q78 116 62 98 Z", ACC, .22) +
    [[92, 92], [108, 102], [140, 90], [150, 102], [100, 84]].map(([x, y], i) => line(`M${x} ${y} l9 -2 l2 8 l-9 2 Z`, { w: 1.3 })).join("") +
    circle(124, 96, 8.5, { fill: "var(--r-paper)" }) + circle(124, 96, 8.5) + circle(124, 96, 4.4, { fill: ACC, op: .7 }) +
    [[158, 92], [161, 95], [156, 96], [163, 91]].map(([x, y]) => circle(x, y, 1.6, { fill: INK })).join("") +
    leaf(170, 62, 34, 200, .45),
  "spaghetti-lartusi": () => plate(120, 108, 90, 30) +
    line(spiral(120, 98, 44, 5.2, .42), { w: 1.7 }) + line(spiral(120, 98, 40, 4.4, .42), { w: 1.1, op: .55 }) +
    Array.from({ length: 26 }, (_, i) => { const a = i * 2.4, r = 8 + (i * 37 % 34); return circle(120 + r * Math.cos(a), 98 + r * Math.sin(a) * .42 - 6, .9 + (i % 3) * .4, { fill: ACC, op: .8 }); }).join("") +
    [[104, 90], [134, 92], [118, 100]].map(([x, y]) => line(`M${x} ${y} l7 -3`, { w: 1.6, stroke: "var(--r-ink-soft)" })).join(""),
  "rigatoni-amatriciana": () => {
    const tube = (x, y, a) => { const c = Math.cos(a), s = Math.sin(a), L = 30, R = 8.5;
      const P = (u, v) => f(x + u * c - v * s) + " " + f(y + u * s + v * c);
      return line(`M${P(0, -R)} L${P(L, -R)} M${P(0, R)} L${P(L, R)}`, { w: 1.6 }) + `<ellipse cx="${P(L, 0).split(" ")[0]}" cy="${P(L, 0).split(" ")[1]}" rx="3.6" ry="${R}" transform="rotate(${f(a * 180 / Math.PI)} ${P(L, 0)})" fill="var(--r-paper)" stroke="${INK}" stroke-width="1.6"/>` +
        line(`M${P(0, -R)} Q${P(-4, 0)} ${P(0, R)}`, { w: 1.6 }) + [-4, 0, 4].map(v => line(`M${P(4, v)} L${P(L - 4, v)}`, { w: .9, op: .5 })).join("") ; };
    return plate() + blob("M48 104 Q60 80 120 80 Q182 80 192 104 Q170 124 120 124 Q66 124 48 104 Z", ACC, .2) +
      tube(70, 98, -.25) + tube(104, 108, .15) + tube(132, 92, -.5) + tube(150, 110, .35) + tube(92, 84, .5) +
      [[84, 116], [126, 118], [168, 96], [112, 96]].map(([x, y]) => line(`M${x} ${y} l8 -1 l1 5 l-8 1 Z`, { fill: "var(--r-paper-deep)", w: 1.3 })).join("");
  },
  "pinwheel-lasagna": () => line("M44 36 H196 a8 8 0 0 1 8 8 V128 a8 8 0 0 1 -8 8 H44 a8 8 0 0 1 -8 -8 V44 a8 8 0 0 1 8 -8 Z", { op: .7 }) +
    blob("M44 40 H196 V132 H44 Z", ACC, .14) +
    [[78, 62], [120, 62], [162, 62], [78, 110], [120, 110], [162, 110]].map(([x, y]) => circle(x, y, 19, { fill: "var(--r-paper)" }) + line(spiral(x, y, 18, 3.4), { w: 1.4 }) + line(spiral(x, y, 18, 3.4), { w: 3, stroke: ACC, op: .25 })).join("") +
    [[99, 86], [141, 86], [57, 86], [183, 86]].map(([x, y]) => circle(x, y, 5, { fill: "var(--r-paper)", w: 1.2 })).join(""),
  "chicken-parmigiana": () => plate(120, 106, 96, 32) +
    line("M52 102 Q48 80 84 74 Q120 66 160 74 Q194 82 188 102 Q182 122 140 126 Q96 130 66 122 Q54 116 52 102 Z", { fill: "var(--r-paper-deep)" }) +
    blob("M74 98 Q80 82 118 82 Q160 82 166 98 Q160 114 118 116 Q80 114 74 98 Z", ACC, .5) +
    [[96, 94, 9], [124, 100, 11], [148, 92, 8]].map(([x, y, r]) => line(`M${x - r} ${y} q${r * .4} -${r * .9} ${r} -${r * .6} q${r * .8} -.2 ${r} ${r * .7} q-${r * .3} ${r * .8} -${r} ${r * .6} q-${r * .8} .1 -${r} -${r * .7} Z`, { fill: "var(--r-paper)", w: 1.3 })).join("") +
    leaf(112, 86, 18, -30, .45) + leaf(130, 84, 16, 20, .45),
  "roast-prime-rib": () => plate(120, 110, 96, 30) +
    line("M58 100 Q54 66 96 58 Q140 50 168 64 Q190 76 184 100 Q178 120 136 124 Q90 128 70 120 Q60 114 58 100 Z", { fill: "var(--r-paper-deep)" }) +
    blob("M72 98 Q72 74 104 70 Q140 66 158 78 Q172 90 166 104 Q158 116 128 116 Q90 118 78 110 Z", ACC, .42) +
    blob("M100 90 Q108 82 122 86 Q130 94 118 100 Q104 102 100 90 Z", ACC, .35) +
    line("M168 64 Q196 58 204 80 Q206 92 188 96", { w: 5, stroke: "var(--r-paper)" }) + line("M168 64 Q196 58 204 80 Q206 92 188 96", { w: 1.6 }) +
    ellipse(46, 120, 12, 5, { fill: ACC, op: .3 }) + line("M34 120 a12 5 0 0 0 24 0", { w: 1.3 }),
  "iceberg-wedge-salad": () => plate(120, 112, 92, 26) +
    line("M62 108 L120 44 L178 108 Q120 122 62 108 Z", { fill: "var(--r-paper-deep)" }) +
    [0, 1, 2, 3].map(i => line(`M${74 + i * 8} ${104 - i * 2} Q120 ${56 + i * 12} ${166 - i * 8} ${104 - i * 2}`, { w: 1, op: .5 })).join("") +
    line("M86 72 Q100 60 120 64 Q142 60 156 74 Q146 80 140 92 Q132 82 120 92 Q110 80 98 90 Q94 80 86 72 Z", { fill: "var(--r-paper)", w: 1.3 }) +
    [[70, 118], [168, 118], [150, 124]].map(([x, y]) => circle(x, y, 7, { fill: "#C8553D", op: .55 }) + circle(x, y, 7, { w: 1.2 }) + line(`M${x - 3} ${y} h6`, { w: 1, op: .5 })).join("") +
    [[104, 70], [126, 74], [116, 66], [138, 70]].map(([x, y]) => line(`M${x} ${y} l6 1 l-1 4 l-6 -1 Z`, { fill: "#8A3A2A", op: .7, w: 1 })).join("") +
    [[96, 52], [140, 50], [112, 46]].map(([x, y]) => line(`M${x} ${y} q4 -6 8 0 q-4 6 -8 0`, { w: 1.1, op: .8 })).join(""),
  "insalata-verde": () => ellipse(120, 120, 80, 18, { op: .5 }) + ellipse(120, 118, 62, 12, { op: .3, w: 1.2 }) +
    [[70, 112, 44, 230], [84, 106, 46, 250], [100, 104, 48, 265], [120, 102, 50, 280], [140, 104, 46, 295], [156, 108, 44, 310], [92, 92, 40, 240], [116, 86, 42, 272], [140, 90, 40, 300], [104, 76, 34, 255], [128, 74, 34, 288], [116, 62, 28, 270]]
      .map(([x, y, l, a], i) => leaf(x, y, l, a, i % 3 ? .36 : .46) + (i % 2 ? "" : leaf(x, y, l * .8, a + 10, .3).replace(/stroke="var\(--r-ink\)"/g, `stroke="${ACC}"`))).join(""),
  "short-rib-empanadas": () => {
    // half-moons with a rope crimp (repulgue): short slanted strokes following the curved edge
    const emp = (cx, cy, r, a) => { const ry = r * .72; let crimp = "";
      for (let i = 1; i < 16; i++) { const t = Math.PI - i * Math.PI / 16, x = cx + r * Math.cos(t), y = cy - ry * Math.sin(t);
        const nx = Math.cos(t), ny = -Math.sin(t) * (r / ry); const L = Math.hypot(nx, ny);
        crimp += line(`M${f(x - 4 * nx / L + 2)} ${f(y - 4 * ny / L)} L${f(x + 3 * nx / L - 1)} ${f(y + 3 * ny / L)}`, { w: 1.5 }); }
      return `<g transform="rotate(${a} ${cx} ${cy})">` + line(`M${cx - r} ${cy} A${r} ${ry} 0 0 1 ${cx + r} ${cy} Q${cx} ${cy + 5} ${cx - r} ${cy} Z`, { fill: "var(--r-paper-deep)" }) +
        line(`M${cx - r + 8} ${cy - 3} A${r - 8} ${ry - 7} 0 0 1 ${cx + r - 8} ${cy - 3}`, { w: 1, op: .35 }) + crimp +
        [[-12, -14], [4, -20], [14, -10], [-2, -8]].map(([dx, dy]) => circle(cx + dx, cy + dy, 1.1, { fill: INK, op: .35 })).join("") + "</g>"; };
    return ellipse(120, 118, 100, 20, { op: .45 }) + emp(80, 110, 42, -6) + emp(160, 113, 38, 8) +
      line("M104 132 Q120 126 138 132", { w: 4, stroke: "#D9A21B", op: .75 }) +
      [[150, 134], [158, 136], [166, 133]].map(([x, y]) => line(`M${x} ${y} l5 -2`, { w: 1.6, stroke: ACC })).join("");
  },
  "brioche-french-toast": () => {
    // two thick slices leaning on each other, seen from the side: golden faces, crust edge, butter, syrup
    const slice = (x, y, w, h, a) => `<g transform="rotate(${a} ${x} ${y})">` +
      line(`M${x} ${y} h${w} v-${h} q0 -10 -12 -12 q-${w / 2 - 12} -8 -${w - 24} 0 q-12 2 -12 12 Z`, { fill: "#E9C27A", op: 1 }).replace('fill="#E9C27A"', 'fill="#E9C27A" fill-opacity=".55"') +
      line(`M${x + 6} ${y - 6} h${w - 12} v-${h - 10} q0 -6 -9 -8 q-${w / 2 - 15} -6 -${w - 30} 0 q-9 2 -9 8 Z`, { w: 1, op: .4 }) +
      Array.from({ length: 9 }, (_, i) => circle(x + 14 + (i * 23 % (w - 26)), y - 12 - (i * 17 % (h - 22)), .9, { fill: INK, op: .3 })).join("") + "</g>";
    return plate(120, 118, 96, 24) + slice(62, 112, 70, 54, -6) + slice(104, 116, 72, 56, 4) +
      line("M128 60 h18 v8 h-18 Z", { fill: "#F6E7B0", w: 1.3 }) +
      line("M146 66 Q150 80 146 92 Q143 102 150 110", { w: 3.2, stroke: "#9A5A1A", op: .6 }) +
      [0, 1].map(i => line(wave(184, 104 + i * 9, 34, 2.2, 2), { w: 4, stroke: ACC, op: .5 }) + line(wave(184, 104 + i * 9, 34, 2.2, 2), { w: 1 })).join("");
  }
};

// Tight frames around each drawing (measured with getBBox, 6-unit margin)
const FRAME = {"chicken-pad-thai":[22,58,196,82],"peking-duck-tacos":[14,74,212,66],"perilla-oil-shellfish":[28,42,184,98],"spaghetti-lartusi":[24,70,192,74],"rigatoni-amatriciana":[22,62,196,78],"pinwheel-lasagna":[30,30,180,112],"chicken-parmigiana":[18,64,204,80],"roast-prime-rib":[18,49,204,97],"iceberg-wedge-salad":[22,37,196,107],"insalata-verde":[34,28,172,116],"short-rib-empanadas":[14,66,212,78],"brioche-french-toast":[18,29,206,119]};
function svg(id) {
  return `<svg class="art" viewBox="${(FRAME[id] || VB.split(" ")).join(" ")}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${ART[id]()}</svg>`;
}
module.exports = { ART, svg };

if (require.main === module) {
  const data = require("./data.js");
  const x = data.load();
  let n = 0;
  x.recipes.forEach(r => { if (ART[r.id]) { r.illustration = svg(r.id); n++; } });
  data.save(x);
  console.log("illustrated " + n + " recipes");
}
