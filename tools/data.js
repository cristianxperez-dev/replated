/* Replated data helper: reads and rewrites the restaurant/recipe arrays inside index.html.
   The arrays are stored as 2-space JSON, so rewriting them leaves every other byte of the page untouched. */
const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "..", "index.html");

const START = { restaurants: "window.REPLATED_RESTAURANTS = ", recipes: "window.REPLATED_RECIPES = " };

function locate(html, key) {
  const s = html.indexOf(START[key]);
  if (s < 0) throw new Error("missing " + key);
  const from = s + START[key].length;
  const end = html.indexOf("\n];", from) + 2; // the array's closing bracket at column 0
  return { from, end };
}
function load() {
  const html = fs.readFileSync(FILE, "utf8");
  const out = { html };
  for (const k of Object.keys(START)) { const p = locate(html, k); out[k] = JSON.parse(html.slice(p.from, p.end)); }
  return out;
}
function save(data) {
  let html = data.html;
  for (const k of Object.keys(START)) {
    const p = locate(html, k);
    html = html.slice(0, p.from) + JSON.stringify(data[k], null, 2) + html.slice(p.end);
  }
  fs.writeFileSync(FILE, html);
}
module.exports = { load, save, FILE };
