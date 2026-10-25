# Replated Recipes

A personal archive of restaurant-inspired recipe reconstructions. Every recipe has a
**Simple** version (tonight, with sensible shortcuts) and a **Chef** version (the full
restaurant method).

The whole app is one static file, `index.html`. There is no build step and no backend.
It is hosted as-is on GitHub Pages; routes are hash-based (`#/recipe/<id>`), so they
work on any static host.

## Where things live inside `index.html`

| Block | What it holds |
| --- | --- |
| `<style>` | Replated identity (wine `#601413`, ivory, charcoal) plus one `[data-theme="…"]` block per restaurant |
| `window.REPLATED_RESTAURANTS` | Restaurant branding: name, logo or typeset wordmark, palette, location |
| `window.REPLATED_RECIPES` | Every recipe; the source of truth for the app |
| `window.REPLATED_EMBEDDED_ASSETS` | Logos and images inlined as data URIs, keyed by their asset path |
| `window.REPLATED_EMBEDDED_PDFS` | Recipe-card PDFs inlined as base64 |
| application `<script>` | Router, search, and views |

`research/backlog.json` holds researched dishes that are not in the app yet.

## Editing data

`tools/data.js` loads and rewrites the two data arrays without touching anything else in
the page (they are stored as 2-space JSON):

```js
const data = require("./tools/data.js");
const x = data.load();          // { restaurants, recipes, html }
x.recipes.push(newRecipe);
data.save(x);
```

`node tools/check.js` validates the data (unique ids and numbers, required fields, both
modes complete, categories, restaurant references) and should pass before every commit.

## Restaurant fields

| Field | Notes |
| --- | --- |
| `id`, `name`, `shortName` | `id` is used in URLs: keep it stable |
| `logo` / `logoOnDark` | Asset path of an official logo (inlined via `REPLATED_EMBEDDED_ASSETS`), or `null` |
| `wordmarkText` | Typeset name shown when there is no logo file |
| `theme` | Matches a `[data-theme]` CSS block |
| `tagline`, `neighborhood`, `city`, `chef`, `about`, `website` | Shown on cards and the restaurant page |
| `colors` | `paper`, `paperDeep`, `ink`, `inkSoft`, `accent`, `rule`, plus any extra keys; each becomes `--r-<kebab-name>` |
| `showMenuDescription`, `italianLabels`, `collectionLayout`, `collectionTitle`, `sectionColon` | Optional display switches |

## Recipe fields

Top-level fields are the **Chef** version; `simple` holds the **Simple** version.

| Field | Notes |
| --- | --- |
| `id`, `number` | Unique. Numbers continue the `001.NN` sequence |
| `name`, `aliases`, `subtitle`, `description` | `aliases` feed search |
| `restaurantId` | Must match a restaurant |
| `category` | One of `pasta`, `mains`, `salads`, `small-plates`, `breakfast` (drives "Browse by course") |
| `cuisine` | e.g. `Italian`, `Italian-American`, `Thai`, `Japanese`, `Korean`, `American`, `French` |
| `menu` | `{ section, description, price }` as printed by the restaurant, when known |
| `servings`, `difficulty` | |
| `time` | `{ active, cook, rest, total }`: hands-on, cooking, resting/unattended, total elapsed |
| `ingredientGroups` | `[{ name, items: [{ qty, item }] }]`: metric first, US in parentheses |
| `allergens` | e.g. `["Gluten", "Dairy", "Egg", "Peanut", "Shellfish"]` |
| `equipment` | List of strings |
| `steps` | `[{ title, text, cue }]`: `cue` is the sensory "Look for" note |
| `chefNotes` | Strings; `**bold**` allowed |
| `substitutions` | `[{ label, text }]`: lactose-free, acid-free and hard-to-find swaps; shown in both modes unless `simple.substitutions` exists |
| `mistakes` | `[{ problem, fix }]` |
| `makeAhead` | Strings: make-ahead, storage, reheating |
| `contrast`, `contrastTitle`, `contrastLabel` | Optional comparison list with its own heading |
| `difference` | **The Restaurant Difference**: `{ verified: [...], recommended: [...] }`: verified restaurant techniques vs. our own culinary recommendations |
| `why` | Why this reconstruction is built the way it is |
| `evidence` | `{ confirmed: [...], inferred: [...], uncertain: [...] }` |
| `sources` | `[{ label, url, note }]`: research references, linked from the recipe page |
| `attribution`, `disclaimer` | Shown in the recipe footer |
| `pdf` | Path of an embedded PDF recipe card, or `null` |
| `tags` | Search terms |
| `simple` | `{ subtitle?, description, servings, time, difficulty, ingredientGroups, equipment, steps, tips, simplified, makeAhead?, allergens?, substitutions? }` |

## Honesty rules for new recipes

- Never present a reconstruction as the restaurant's own recipe.
- Keep confirmed facts (menu text, published interviews) separate from inference in `evidence`
  and in `difference.verified` / `difference.recommended`.
- Every new recipe lists the sources it was built from.
- No unrelated stock photography. When there is no legitimate image, the page stays
  typographic.
