/* Merges draft recipe files into the library (replacing any recipe with the same id),
   then attaches illustrations. Run: node tools/merge.js draft1.json [draft2.json ...] */
const fs = require("fs");
const data = require("./data.js");
const { ART, svg } = require("./illustrations.js");
const x = data.load();
for (const file of process.argv.slice(2)) {
  const r = JSON.parse(fs.readFileSync(file, "utf8"));
  if (ART[r.id]) r.illustration = svg(r.id);
  const i = x.recipes.findIndex(e => e.id === r.id);
  if (i >= 0) x.recipes[i] = r; else x.recipes.push(r);
  console.log((i >= 0 ? "replaced " : "added    ") + r.number + " " + r.id);
}
data.save(x);
