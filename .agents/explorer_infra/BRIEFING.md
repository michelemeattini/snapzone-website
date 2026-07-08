# BRIEFING — 2026-07-07T11:11:35+02:00

## Mission
Explore SnapZone codebase and system environment to recommend E2E testing framework/setup.

## 🔒 My Identity
- Archetype: teamwork_preview_explorer
- Roles: Codebase and System Explorer
- Working directory: /Users/michele/Documents/SnapZone/SnapZoneWeb/.agents/explorer_infra
- Original parent: 24aa3f34-37fe-41e1-a992-d8f0de929518
- Milestone: codebase-system-exploration

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Operating in CODE_ONLY network mode: no external requests, no curl/wget/lynx to external urls.

## Current Parent
- Conversation ID: 24aa3f34-37fe-41e1-a992-d8f0de929518
- Updated: 2026-07-07T11:11:35+02:00

## Investigation State
- **Explored paths**:
  - `SnapZoneWeb/index.html` (DOM container, sticky viewports, slide markup, announcement, language selectors, pricing cards, device detacher).
  - `SnapZoneWeb/styles.css` (tokens, custom easing, media queries, layout overrides for min-width: 900px, responsive design).
  - `SnapZoneWeb/script.js` (initI18n, initAnnounce, initTheme, initFancyZoneShowcase, initChartAndCalculator, initDevices, initStoryScroll scroll progress mapping).
  - `SnapZoneWeb/translations.js` (EN/IT/ES translation strings).
  - Local folders: `/Users/michele/.npm/_npx` (npx cache) and `/Users/michele/Library/Caches/ms-playwright` (Playwright browsers).
- **Key findings**:
  - Scroll snap storytelling is driven by `#story-container` client height and 9 `.story-trigger` divs of 100vh.
  - Scroll handler computes `progress = -rect.top / viewH` (0 to 9) and applies CSS custom variables to slides.
  - Node version is v24.12.0, NPM version is 11.6.2.
  - Local npx cache contains Vitest (v4.1.9), Puppeteer (v25.1.0), TSX (v4.22.5), Prettier (v3.8.3), PNPM (v11.3.0).
  - Local system contains cached Playwright Chromium browser binary (v1228) in `~/Library/Caches/ms-playwright` and Puppeteer Chrome in `~/.cache/puppeteer`.
- **Unexplored areas**: None. Codebase and environment analysis are complete.

## Key Decisions Made
- Recommended Playwright as E2E test runner due to its native multi-viewport support, network routing (critical for verifying F7 strict self-hosting), robust scroll handling, auto-retry assertions, and pre-cached Chromium binary.

## Artifact Index
- /Users/michele/Documents/SnapZone/SnapZoneWeb/.agents/explorer_infra/handoff.md — Main findings and recommended E2E testing framework setup
