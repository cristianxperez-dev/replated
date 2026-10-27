/* Takes restaurants out of the live app, or puts them back, without losing anything.
   Run: node tools/archive.js hide <restaurant-id> [...]
        node tools/archive.js restore <restaurant-id> [...]

   "hide" moves each restaurant, all of its recipes (positions kept) and its embedded logo files out of
   index.html into archive/<restaurant-id>.json, so nothing about it is in the published page.
   "restore" puts them back exactly as they were. CSS lines that style only that restaurant's
   [data-theme] (and the comment above them) go to the archive too; selectors shared with other
   themes stay. archive/ is never deployed. */
const fs = require("fs");
const path = require("path");
const data = require("./data.js");

const DIR = path.join(__dirname, "..", "archive");
const ASSETS = "window.REPLATED_EMBEDDED_ASSETS = {";
const [cmd, ...ids] = process.argv.slice(2);
if (!/^(hide|restore)$/.test(cmd || "") || !ids.length) { console.log("usage: node tools/archive.js hide|restore <restaurant-id> [...]"); process.exit(1); }

// one embedded asset per line: '  "path": "data:…",'
function assetLines(html) {
  const s = html.indexOf(ASSETS); if (s < 0) throw new Error("embedded assets block not found");
  return { start: s + ASSETS.length + 1, end: html.indexOf("\n};", s) };
}

for (const id of ids) {
  const file = path.join(DIR, id + ".json");
  const x = data.load();
  if (cmd === "hide") {
    const ri = x.restaurants.findIndex(r => r.id === id);
    if (ri < 0) throw new Error("no restaurant " + id);
    const restaurant = x.restaurants[ri];
    const recipes = [];
    // remember each item's neighbor, so restoring puts it back in place in any order
    const nextOther = (list, i, own) => { for (let j = i + 1; j < list.length; j++) if (!own(list[j])) return list[j].id; return null; };
    const restaurantBefore = nextOther(x.restaurants, ri, () => false);
    x.recipes.forEach((r, i) => { if (r.restaurantId === id) recipes.push({ index: i, before: nextOther(x.recipes, i, q => q.restaurantId === id), recipe: r }); });
    x.restaurants.splice(ri, 1);
    x.recipes = x.recipes.filter(r => r.restaurantId !== id);
    data.save(x);
    // embedded logos and PDFs that belong to this restaurant only
    const paths = [restaurant.logo, restaurant.logoOnDark].concat(recipes.map(e => e.recipe.pdf)).filter(Boolean);
    let html = fs.readFileSync(data.FILE, "utf8");
    const a = assetLines(html), lines = html.slice(a.start, a.end).split("\n"), assets = {}, assetBefore = {};
    const key = l => (/^\s*"([^"]+)": /.exec(l) || [])[1];
    lines.forEach((l, i) => { if (paths.indexOf(key(l)) > -1) assetBefore[key(l)] = lines.slice(i + 1).map(key).filter(k => k && paths.indexOf(k) < 0)[0] || null; });
    const keep = lines.filter(l => { const m = /^\s*"([^"]+)": "(.*)",?$/.exec(l); if (m && paths.indexOf(m[1]) > -1) { assets[m[1]] = m[2]; return false; } return true; });
    if (keep.length) keep[keep.length - 1] = keep[keep.length - 1].replace(/,$/, "");
    html = html.slice(0, a.start) + keep.join("\n") + html.slice(a.end);
    // CSS lines for this theme only, with the comment that introduces them
    const css = [];
    if (restaurant.theme) {
      const end = html.indexOf("</style>"), all = html.slice(0, end).split("\n");
      const mine = l => { const t = l.match(/data-theme="([^"]+)"/g); return !!t && t.every(x => x === 'data-theme="' + restaurant.theme + '"'); };
      const take = new Set();
      all.forEach((l, i) => {
        if (!mine(l)) return;
        take.add(i);
        if (i > 0 && /\*\/\s*$/.test(all[i - 1]) && !take.has(i - 1)) {            // the comment block just above
          let j = i - 1; while (j > 0 && !/^\s*\/\*/.test(all[j])) j--;
          for (let n = j; n < i; n++) take.add(n);
        }
      });
      let run = null;
      all.forEach((l, i) => {
        // index: where the run goes in the page once the earlier runs are back
        if (take.has(i)) { if (!run) css.push(run = { index: i - [...take].filter(t => t < i).length + css.reduce((n, r) => n + r.lines.length, 0), lines: [] }); run.lines.push(l); }
        else if (run) { run.before = l; run = null; }
      });
      html = all.filter((l, i) => !take.has(i)).join("\n") + html.slice(end);
    }
    fs.writeFileSync(data.FILE, html);
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ restaurantIndex: ri, restaurantBefore, restaurant, recipes, assets, assetBefore, css }, null, 2) + "\n");
    console.log("hidden   " + id + ": " + recipes.length + " recipe(s), " + Object.keys(assets).length + " asset(s) → archive/" + id + ".json");
  } else {
    const saved = JSON.parse(fs.readFileSync(file, "utf8"));
    if (x.restaurants.some(r => r.id === id)) throw new Error(id + " is already in the app");
    const at = (list, before, index) => { const i = before ? list.findIndex(q => q.id === before) : -1; return i > -1 ? i : Math.min(index, list.length); };
    x.restaurants.splice(at(x.restaurants, saved.restaurantBefore, saved.restaurantIndex), 0, saved.restaurant);
    saved.recipes.forEach(e => x.recipes.splice(at(x.recipes, e.before, e.index), 0, e.recipe));
    data.save(x);
    let html = fs.readFileSync(data.FILE, "utf8");
    const a = assetLines(html);
    let lines = html.slice(a.start, a.end).replace(/\s+$/, "").split("\n").filter(Boolean).map(l => l.replace(/,$/, ""));
    Object.keys(saved.assets).forEach(k => {
      const line = "  " + JSON.stringify(k) + ": \"" + saved.assets[k] + "\"";
      const b = (saved.assetBefore || {})[k], i = b ? lines.findIndex(l => l.indexOf("  " + JSON.stringify(b) + ":") === 0) : -1;
      if (i > -1) lines.splice(i, 0, line); else lines.push(line);
    });
    html = html.slice(0, a.start) + lines.join(",\n") + html.slice(a.end);
    if ((saved.css || []).length) {
      const end = html.indexOf("</style>"), all = html.slice(0, end).split("\n");
      saved.css.forEach(run => {
        let i = -1;                                                      // the matching line nearest to where the run was
        all.forEach((l, j) => { if (l === run.before && (i < 0 || Math.abs(j - run.index) < Math.abs(i - run.index))) i = j; });
        all.splice(i > -1 ? i : Math.min(run.index, all.length), 0, ...run.lines);
      });
      html = all.join("\n") + html.slice(end);
    }
    fs.writeFileSync(data.FILE, html);
    fs.unlinkSync(file);
    console.log("restored " + id + ": " + saved.recipes.length + " recipe(s), " + Object.keys(saved.assets).length + " asset(s)");
  }
}
