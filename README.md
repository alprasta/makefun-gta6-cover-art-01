# makefun-gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/alprasta/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/alprasta/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Sunset Cover Studio** — turn your photo and a caption into GTA-style poster cover art, in your browser, offline. Four poster layouts (Sunset Hero, Poster Grid, Comic Strip, Quad), four sunset/neon colour themes, per-panel crop and pan, bold outlined caption lettering with a synthwave sun, palm and skyline silhouettes drawn in code, and one-click PNG export in 1080×1080, 1080×1350 and 1920×1080. Photos never leave your machine; nothing is uploaded.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — pick a photo (or try a sample), choose a layout and theme, write your caption, and hit **Export PNG**.

## How it works

- `app/index.html` + `app/style.css` — the editor chrome.
- `app/src/cover.js` — the cover renderer: panel layouts, themes, sun/palm/skyline art, sunset grade, caption lettering. All artwork is drawn in code; no Rockstar Games logo, artwork or font is used.
- `app/src/main.js` — editor state, photo loading, per-panel crop controls, PNG export.
- `app/src/shots.js` — deterministic `?shot=` scenes used to take the screenshots.
- `main.ts` — the make.fun program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=alprasta&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
