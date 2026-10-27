/* Builds the deployable copy of Replated Recipes into dist/.
   Run: node tools/build.js      (Node 18+, no npm install, no network)

   The app is one self-contained index.html: fonts, logos, illustrations and PDFs are embedded,
   and routes are hash-based (#/recipe/<id>). It therefore works from any URL path, e.g.
   https://example.github.io/apps/replated-recipes/. This script refuses to build if that
   stops being true: invalid recipe data, a root-absolute path, or an external script/style. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "dist");
const fail = msg => { console.error("build failed: " + msg); process.exit(1); };

// 1. Recipe and restaurant data must validate
try { execFileSync(process.execPath, [path.join(__dirname, "check.js")], { stdio: "inherit" }); }
catch (e) { fail("tools/check.js reported errors"); }

// 2. The page must be path-independent and self-contained
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scan = html.replace(/data:[^"')\s]+/g, "DATA"); // ignore embedded assets
const problems = [];
const rootAbs = scan.match(/\b(?:src|href|action|poster)\s*=\s*["']\/(?!\/)[^"']*["']|url\(\s*["']?\/(?!\/)[^)]*\)/g);
if (rootAbs) problems.push("root-absolute paths (break under /apps/replated-recipes/): " + rootAbs.slice(0, 5).join(", "));
const extScripts = scan.match(/<script[^>]+src\s*=\s*["'](?:https?:)?\/\/[^"']+/gi);
if (extScripts) problems.push("external scripts: " + extScripts.join(", "));
const extStyles = scan.match(/<link[^>]+rel\s*=\s*["']stylesheet["'][^>]*>|@import\s+url\(\s*["']?https?:/gi);
if (extStyles) problems.push("external stylesheets: " + extStyles.join(", "));
const extFetch = scan.match(/\bfetch\(\s*["'](?:https?:)?\/\//g);
if (extFetch) problems.push("network fetches: " + extFetch.join(", "));
if (problems.length) fail("\n  " + problems.join("\n  "));

// 3. Write dist/
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
fs.copyFileSync(path.join(ROOT, "index.html"), path.join(OUT, "index.html"));
fs.writeFileSync(path.join(OUT, ".nojekyll"), ""); // harmless in a subfolder; stops Jekyll processing if served alone

let commit = process.env.GITHUB_SHA || "";
if (!commit) { try { commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch (e) { commit = "unknown"; } }
const data = require("./data.js").load();
const info = {
  name: "Replated Recipes",
  version: fs.readFileSync(path.join(ROOT, "VERSION"), "utf8").trim(),
  source: "https://github.com/cristianxperez-dev/replated",
  commit,
  builtAt: new Date().toISOString(),
  entry: "index.html",
  basePath: "any (relative, hash-routed; no base URL configuration needed)",
  restaurants: data.restaurants.length,
  recipes: data.recipes.length,
  bytes: fs.statSync(path.join(OUT, "index.html")).size
};
fs.writeFileSync(path.join(OUT, "build.json"), JSON.stringify(info, null, 2) + "\n");
console.log("dist/ ready: " + info.restaurants + " restaurants, " + info.recipes + " recipes, " +
  (info.bytes / 1048576).toFixed(1) + " MB, version " + info.version + " @ " + commit.slice(0, 7));
