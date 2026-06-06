# Repository Guidelines

## Project Overview

This is a personal technical blog built with Hexo 6 and deployed to GitHub Pages.
The generated site is served under `https://imbant.github.io/blog`, so keep
`root: /blog/` and related URL assumptions in mind when changing links or assets.

The active theme is `maupassant` (`theme: maupassant` in `_config.yml`).
`themes/landscape` is still present in the repository, but it is not the active
theme unless `_config.yml` is changed.

## Directory Layout

- `source/_posts/`: published posts.
- `source/_drafts/`: draft posts that are not rendered by default.
- `source/about/index.md`: the About page.
- `scaffolds/`: templates used by Hexo when creating posts, drafts, or pages.
- `themes/maupassant/`: active theme templates, styles, scripts, languages, and
  theme configuration.
- `themes/landscape/`: bundled inactive theme.
- `public/`: generated output. Do not edit it directly; regenerate it.

## Common Commands

- Install dependencies: `npm ci` when using the lockfile, or `npm install` when
  intentionally updating dependencies.
- Build static output: `npm run build`.
- Clean generated files: `npm run clean`.
- Start local preview: `npm run server`.
- Deploy command: `npm run deploy`, but the current `_config.yml` has an empty
  deploy type; normal publishing is handled by GitHub Actions.

CI uses Node `13.14.0`, then runs `npm ci` and `npm run build`. This old Node
version matters because the dependency tree includes native Sass-era packages.
Avoid upgrading Node, Hexo, renderers, or theme dependencies as part of unrelated
content changes.

On newer local Node versions, `npm run build` may print a
`node-sass` unsupported runtime error while Hexo still exits with code 0. Treat
that as an environment mismatch first; reproduce with Node `13.14.0` before
changing Sass, renderer, or theme code.

## Writing Posts

Post files are Markdown with YAML front matter. Existing posts generally use:

```yaml
---
title: Post Title
date: YYYY-M-D
tags: [tag]
---
```

New drafts should use this same minimal front matter shape: `title`, `date`,
and `tags`. Dates should include only year, month, and day, with no time of day.

Keep published posts in `source/_posts/` and unfinished work in
`source/_drafts/`. Draft rendering is disabled in `_config.yml`
(`render_drafts: false`), so drafts should not appear in normal builds.

Post titles may be Chinese, but new post and draft file names must be short,
semantic English slugs because Hexo uses the file name in the final URL. Do not
create new Chinese file names; encoded URLs are noisy and harder to read. For
example, use `future-of-lsp.md` instead of `LSP-的未来.md`.

## Theme And UI Changes

Prefer editing `themes/maupassant/` for visible theme changes. The active theme
uses Pug layouts, SCSS/CSS, and small browser scripts:

- Layouts: `themes/maupassant/layout/**/*.pug`
- Styles: `themes/maupassant/source/css/`
- Scripts: `themes/maupassant/source/js/`
- Theme options: `themes/maupassant/_config.yml`

Do not edit generated files in `public/`. If a change affects rendering, verify
with `npm run build`. For visual changes, also run a local preview with
`npm run server` and inspect the rendered page.

## Deployment

`.github/workflows/ci.yml` deploys the generated `public` folder to the
`gh-pages` branch on every push. Keep generated output out of source edits unless
there is a specific reason to commit it.

## Working Conventions

- Keep changes narrow: content edits should not modify theme or dependency files.
- Keep dependency changes separate from post/theme work.
- Use existing Hexo configuration and theme patterns before adding new tooling.
- Validate with `npm run build` before saying rendering is fixed or complete.
