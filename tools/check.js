/* Validates the Replated data inside index.html. Run: node tools/check.js [draft.json ...]
   Draft recipe files (one recipe object each) are checked as if they were already in the library.
   Exits non-zero on any error; warnings are printed but don't fail. */
const fs = require("fs");
const { load } = require("./data.js");

const CATEGORIES = ["pasta", "mains", "salads", "small-plates", "breakfast"];
const errors = [], warnings = [];
const err = (id, msg) => errors.push(id + ": " + msg);
const warn = (id, msg) => warnings.push(id + ": " + msg);

const { restaurants, recipes, html } = load();
process.argv.slice(2).forEach(f => {
  try { recipes.push(JSON.parse(fs.readFileSync(f, "utf8"))); } catch (e) { errors.push(f + ": not valid JSON (" + e.message + ")"); }
});

const restIds = new Set();
restaurants.forEach(r => {
  if (restIds.has(r.id)) err(r.id, "duplicate restaurant id");
  restIds.add(r.id);
  ["name", "shortName", "theme", "colors"].forEach(k => { if (!r[k]) err(r.id, "restaurant missing " + k); });
  if (!r.logo && !r.wordmarkText) err(r.id, "needs a logo or wordmarkText");
  if (r.logo && html.indexOf('"' + r.logo + '":') < 0) err(r.id, "logo not embedded: " + r.logo);
  if (r.logoOnDark && html.indexOf('"' + r.logoOnDark + '":') < 0) err(r.id, "dark-background logo not embedded: " + r.logoOnDark);
  if (r.theme && html.indexOf('[data-theme="' + r.theme + '"]') < 0) warn(r.id, "no CSS block for theme " + r.theme);
});

function checkMode(id, d, label) {
  ["description", "servings", "difficulty"].forEach(k => { if (!d[k]) err(id, label + " missing " + k); });
  if (!d.time || !d.time.total) err(id, label + " missing time.total");
  const groups = d.ingredientGroups || [];
  if (!groups.length) err(id, label + " has no ingredients");
  groups.forEach(g => (g.items || []).forEach(i => { if (!i.item) err(id, label + " ingredient without text in " + g.name); }));
  if (!(d.steps || []).length) err(id, label + " has no steps");
  (d.steps || []).forEach((s, i) => { if (!s.title || !s.text) err(id, label + " step " + (i + 1) + " incomplete"); });
  if (!(d.equipment || []).length) warn(id, label + " has no equipment list");
}

const ids = new Set(), numbers = new Set();
recipes.forEach(r => {
  if (ids.has(r.id)) err(r.id, "duplicate recipe id");
  ids.add(r.id);
  if (numbers.has(r.number)) err(r.id, "duplicate number " + r.number);
  numbers.add(r.number);
  if (!/^[a-z0-9-]+$/.test(r.id)) err(r.id, "id must be lowercase-hyphenated");
  if (!restIds.has(r.restaurantId)) err(r.id, "unknown restaurant " + r.restaurantId);
  if (CATEGORIES.indexOf(r.category) < 0) err(r.id, "bad category " + r.category);
  ["name", "subtitle", "cuisine", "attribution", "disclaimer"].forEach(k => { if (!r[k]) err(r.id, "missing " + k); });
  checkMode(r.id, r, "chef");
  if (!r.simple) err(r.id, "missing simple version");
  else {
    checkMode(r.id, r.simple, "simple");
    if (!(r.simple.simplified || []).length) warn(r.id, "simple has no 'What we simplified'");
  }
  if (r.pdf && html.indexOf('"' + r.pdf + '":') < 0) err(r.id, "pdf not embedded: " + r.pdf);
  (r.sources || []).forEach(s => { if (!s.label) err(r.id, "source without label"); if (s.url && !/^https:\/\//.test(s.url)) err(r.id, "source url must be https: " + s.url); });
  // The newer schema: every recipe added from 001.24 on must carry the full research record
  if (r.number >= "001.24") {
    if (!(r.sources || []).length) err(r.id, "new recipe has no sources");
    if (!r.difference || !(r.difference.verified || []).concat(r.difference.recommended || []).length) err(r.id, "new recipe has no Restaurant Difference");
    if (!r.evidence) err(r.id, "new recipe has no evidence");
    if (!(r.allergens || []).length) err(r.id, "new recipe has no allergens");
    if (!(r.mistakes || []).length) err(r.id, "new recipe has no common mistakes");
    if (!(r.makeAhead || []).length) err(r.id, "new recipe has no make-ahead notes");
  }
});

// Restaurants that are listed but have no recipe yet show an empty collection
restaurants.forEach(r => { if (!recipes.some(x => x.restaurantId === r.id)) warn(r.id, "restaurant has no recipes"); });

warnings.forEach(w => console.log("warn  " + w));
errors.forEach(e => console.log("ERROR " + e));
console.log(restaurants.length + " restaurants, " + recipes.length + " recipes, " + errors.length + " errors, " + warnings.length + " warnings");
process.exit(errors.length ? 1 : 0);
