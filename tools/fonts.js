/* Builds embedded @font-face rules for the restaurant typefaces (Google Fonts, SIL Open Font License).
   Run: node tools/fonts.js > /tmp/fonts.css   — only the latin subset is kept, as base64 woff2.
   Each family is exposed as "R <Family>" so it never collides with a locally installed font. */
const { execFileSync } = require("child_process");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const FAMILIES = [
  ["Josefin Sans", "wght@400;600;700"],
  ["Cormorant Garamond", "ital,wght@0,500;0,600;1,500"],
  ["Bodoni Moda", "ital,wght@0,400;0,600;1,400"],
  ["DM Serif Display", "ital@0;1"],
  ["Abril Fatface", ""],
  ["Pinyon Script", ""],
  ["Italiana", ""],
  ["Parisienne", ""],
  ["Poiret One", ""],
  ["Shippori Mincho", "wght@500;700"],
  ["Playfair Display", "ital,wght@0,600;1,500;1,600"],
  ["Nanum Myeongjo", "wght@400;700", "주옥"] // Hangul subset for Joo Ok's name only
];
const get = (url, bin) => execFileSync("curl", ["-sSf", "-A", UA, url], { encoding: bin ? "buffer" : "utf8", maxBuffer: 1 << 26 });
let out = "";
for (const [fam, axes, text] of FAMILIES) {
  const q = "family=" + fam.replace(/ /g, "+") + (axes ? ":" + axes : "") + (text ? "&text=" + encodeURIComponent(text) : "") + "&display=swap";
  const css = get("https://fonts.googleapis.com/css2?" + q);
  const blocks = css.split("@font-face").slice(1).map((b, i, all) => ({ b, label: (css.split("@font-face")[i].match(/\/\* ([\w-]+) \*\/\s*$/) || [])[1] }));
  for (const { b, label } of blocks) {
    if (!text && label !== "latin") continue; // keep latin only
    const url = b.match(/url\((https:[^)]+)\)/)[1];
    const style = (b.match(/font-style: (\w+)/) || [])[1] || "normal";
    const weight = (b.match(/font-weight: ([\d ]+)/) || [])[1] || "400";
    const range = (b.match(/unicode-range: ([^;]+);/) || [])[1];
    const data = get(url, true).toString("base64");
    out += '@font-face { font-family: "R ' + fam + '"; src: url(data:font/woff2;base64,' + data + ') format("woff2"); font-style: ' + style +
      "; font-weight: " + weight + "; font-display: swap;" + (range && !text ? " unicode-range: " + range + ";" : "") + " }\n";
  }
}
process.stdout.write(out);
