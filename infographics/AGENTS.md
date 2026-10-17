# AGENT Instructions for `web/resources/infographics/`

This file governs edits to interactive infographic source files under `web/resources/infographics/`. It extends root `AGENTS.md` and `web/AGENTS.md`.

## Scope

- Applies to all files in this directory (for example, `part-ii-entangled-firmament.html`).
- These files are source assets for standalone part infographic pages and embeds, not generated output.
- Fragment-based infographic sections live in `web/resources/infographic-library/` and are governed at the `web/` level rather than by this directory.

## Canonical Mapping Contract

- Infographic embed metadata is canonical in `web/part_infographics.yaml`.
- When adding, renaming, or removing an infographic file here, update the corresponding `parts.*` entry in `web/part_infographics.yaml`:
  - `embed`
  - `embed_height`
  - `alt`
  - `caption`
  - `link`
  - `show_on`
- Keep filename slugs stable and predictable (`part-<roman-or-word>-<slug>.html`) to avoid broken embeds.

## Part-Entry Link Requirement

- Every infographic must contain an in-page link that sends the reader to the beginning of its relevant part.
- Place this link in a stable, visible location (footer CTA is preferred) and keep label text explicit (`Read Part II From The Beginning`).
- Use site-relative navigation from infographic pages with `../<part-start-slug>`:
  - Preface: `../your-path-your-pace`
  - Part I: `../foundations-of-the-dragons-path`
  - Part II: `../the-entangled-firmament`
  - Part III: `../archetype-portals`
  - Part IV: `../practices-for-embodied-transformation`
  - Part V: `../the-crucible-of-flesh`
  - Part VI: `../ethics-and-intimacy`
  - Part VII: `../void-meditation`
  - Part VIII: `../the-unfolding-path`
  - Part IX: `../epilogues`
- Master map infographic: include a journey-start CTA to Preface (`../your-path-your-pace`) unless explicitly directed otherwise.

## Cross-Part Mention Links

- Any explicit mention of another part in infographic UI chrome (for example, top-right nav chips like `PART I`, `PART II`, `PART III`) should be clickable.
- In `master-map-the-spiral-journey.html`, part labels/titles in the left path navigator should also be clickable links to each part infographic.
- Link those mentions directly to the corresponding infographic HTML in this directory (`part-ii-entangled-firmament.html`, etc.), not to chapter pages.
- Keep the current part label visually highlighted and non-required as a link; prioritize links for the "other part" mentions.

## Design And Layout Guardrails

- Preserve the existing visual language unless explicitly asked for a redesign.
- Treat desktop and mobile as first-class targets; avoid desktop-only positioning that overlaps key content.
- Prefer robust flow layout and responsive utility classes over fragile absolute positioning for text-critical blocks.
- Keep interactive regions inside their intended viewport/panel bounds.

## Interaction And Performance

- Use `requestAnimationFrame` for animation loops.
- Cap unbounded data structures used by animations (for example, point trails) to avoid memory growth.
- Keep event listeners scoped and avoid duplicate registrations during resize/re-init paths.
- Prefer small, explicit tuning constants for speed/offset so behavior is easy to adjust later.

## Content And Terminology

- Align labels/titles with canonical naming from `meta/key_concepts.md` and `meta/style_guide.md`.
- Keep safety/ethics wording consistent with the manuscript and web frontmatter; do not soften guardrails.

## Editing Discipline

- Keep changes local to the requested infographic(s); do not sweep across all infographics unless asked.
- Do not edit `build/web/`; edit source files here and rebuild/copy through normal pipeline.
- For non-trivial changes, validate in a browser view after edit and check both desktop and mobile behavior.

## Recommended Validation

- Quick local workflow:
  - `make serve` for watch + quick resource sync.
  - Or `make build-web TARGET=<source>` when testing targeted page generation.
- If embed placement/height changed, also verify the part page that hosts the iframe/card.
