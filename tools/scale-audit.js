/* Shows what the recipe-size feature changes at ½× or 2×, using the scaling code inside index.html.
   Run after adding or editing a recipe: node tools/scale-audit.js [0.5|2] [recipe-id]
   Each line is one scaled quantity with its context. Amounts that must not scale (per plate,
   per batch) are protected in the data with a step's "keep" list or "fixed": true (README). */
const fs = require("fs");
const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const SCALE = new Function(html.slice(html.indexOf("/* scale:begin"), html.indexOf("/* scale:end */")) + "; return SCALE;")();
const k = parseFloat(process.argv[2] || "0.5"), only = process.argv[3] || "";
const { recipes } = require("./data.js").load();
for (const r of recipes) {
  if (only && r.id !== only) continue;
  for (const [label, d] of [["Chef", r], ["Simple", r.simple]]) {
    if (!d) continue;
    const out = [];
    SCALE.trace = (a, b, ctx) => out.push("    " + a + " → " + b + "    …" + ctx.replace(/\s+/g, " ") + "…");
    const s = SCALE.mode(d, k);
    SCALE.trace = null;
    if (s.servings !== d.servings) out.unshift("    Serves: " + d.servings + " → " + s.servings);
    console.log(`\n${r.id} · ${label}\n` + out.join("\n") + (SCALE.advice(r, d, k).length ? "\n    Advice: " + SCALE.advice(r, d, k).join(" / ") : ""));
  }
}
