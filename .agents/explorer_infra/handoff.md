# Handoff Report: SnapZone E2E Test Suite Design and System Exploration

## 1. Observation

### System Environment
- **Node & NPM**: Executing `node -v && npm -v` in the workspace `/Users/michele/Documents/SnapZone/SnapZoneWeb` returns:
  ```
  v24.12.0
  11.6.2
  ```
- **Global NPM Packages**: Executing `npm list -g --depth=0` returns:
  ```
  /Users/michele/.nvm/versions/node/v24.12.0/lib
  ├── clawhub@0.7.0
  ├── corepack@0.34.5
  └── npm@11.6.2
  ```
- **Local npx cache packages**: Checking `/Users/michele/.npm/_npx/` contents and reading the package metadata reveals:
  - `create-vite` v9.0.7 (under `1415fee72ff6294b`)
  - `chrome-devtools-mcp` v1.5.0 (under `15c61037b1978c83`)
  - `impeccable` v3.0.3 (under `1a4eb60c8f6b0f89`), containing `puppeteer` v25.1.0 in its `node_modules`
  - `vercel` v54.21.0 (under `5cfe6114fd69433b` and `69f9afb961c37556`)
  - `vitest` v4.1.9 (under `69c381f8ad94b576`)
  - `prettier` v3.8.3 (under `b388654678d519d9`)
  - `pnpm` v11.3.0 (under `e6e0ed1aca658cae`)
  - `tsx` v4.22.5 (under `fd45a72a545557e9`)
- **Pre-installed browser binaries**:
  - Playwright: Directory `/Users/michele/Library/Caches/ms-playwright` exists and contains:
    ```
    chromium-1228/
    chromium_headless_shell-1228/
    ffmpeg-1011/
    ```
  - Puppeteer: Directory `/Users/michele/.cache/puppeteer` exists and contains `chrome` and `chrome-headless-shell`.
- **Dry-run Package Installation**: Running `npm install --dry-run playwright` completes successfully with output:
  ```
  add playwright-core 1.61.1
  add fsevents 2.3.2
  add playwright 1.61.1
  ...
  added 3 packages, and removed 92 packages in 2s
  ```

### Codebase Structure & Scroll Snapping Implementation
- **Scroll snaps & layouts in HTML/CSS**:
  - In `index.html` lines 484-492:
    ```html
    <div class="story-trigger"></div>
    <div class="story-trigger"></div>
    <!-- (9 triggers total) -->
    ```
  - In `styles.css` lines 3152-3171:
    ```css
    @media (min-width: 900px) {
      html {
        scroll-snap-type: y mandatory;
        scroll-behavior: smooth;
      }
      #story-container {
        position: relative;
        background: var(--bg);
      }
      #story-sticky {
        position: sticky;
        top: 0;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background: var(--bg);
      }
      .story-trigger {
        height: 100vh;
        scroll-snap-align: start;
        pointer-events: none;
        position: relative;
        z-index: 1;
      }
    }
    ```
  - In `script.js` lines 861-897 (`initStoryScroll` layout sync):
    ```javascript
    (function initStoryScroll() {
      const slides = {
        hero:         document.getElementById('hero'),
        gestures:     document.getElementById('gestures'),
        fancyzone:    document.getElementById('fancyzone'),
        howItWorks:   document.getElementById('how-it-works'),
        analytics:    document.getElementById('analytics'),
        pricing:      document.getElementById('pricing'),
        download:     document.getElementById('download')
      };
      const container = document.getElementById('story-container');
      if (!container) return;

      function update() {
        if (window.innerWidth < 900) {
          // Reset all inline styles on mobile to ensure vertical layout works
          ...
        }
        ...
        const rect = container.getBoundingClientRect();
        const viewH = window.innerHeight;
        ...
        let progress = -rect.top / viewH;
        progress = Math.max(0, Math.min(9, progress));
        ...
    ```

### Interactive Widgets
- **Theme toggle**: `script.js` lines 125-148. Switches `data-theme` attribute on `<html>`.
- **Announcement bar**: `script.js` lines 102-119. Close button dismisses bar, toggles `.dismissed` class, sets `--announce-h: 0px` on `:root`, and caches state in `sessionStorage`.
- **Language selector**: `script.js` lines 20-96. Swaps between `en`, `it`, and `es` via custom event `sz-lang-changed`. Updates `data-i18n` elements.
- **Currency toggle**: `script.js` lines 496-514. Swaps pricing displays from `data-usd` to `data-eur` text.
- **Device detacher**: `script.js` lines 520-593. Click handlers in `.pd-slots` to add/detach slot items (`.pd-occupied` / `.pd-empty`).
- **Calculator**: `script.js` lines 362-490. Slider input `#calc-hours-slider` scales chart dimensions and computes savings.
- **Lazy Video Consent**: `script.js` lines 838-857. YouTube iframe lazy loading on user consent click.

---

## 2. Logic Chain

1. **JSDOM / Happy-DOM Limitation**: Testing scroll snap, layout offsets, horizontal alignment of side-by-side elements, and media query breakpoint switches requires a real browser layout and rendering engine. Purely virtual DOM simulators (such as standard Jest or Vitest running JSDOM) do not perform element placement, layout calculations, or scrolling triggers (e.g. `getBoundingClientRect()` returns all-zero boxes, and CSS custom variables have no visual manifestation).
2. **Puppeteer Runner Deficit**: Although `puppeteer` is present in the local `npx` cache, it lacks a dedicated test-running harness. Pairing Puppeteer with a test runner (like Jest or Mocha) requires installing those packages anyway and manually managing test orchestration, browser lifecycles, and auto-retry assertions.
3. **Playwright Suitability**:
   - Playwright is the industry-standard runner for visual E2E layouts and cross-viewport responsive assertions.
   - It features built-in network routing APIs (`page.route()`), making it easy to intercept and verify Feature F7 (verifying that no external assets are requested on initial load).
   - Its test runner (`@playwright/test`) provides built-in auto-retry assertions (e.g. `expect(locator).toHaveClass()`), which are essential to test animations and transitions.
   - Importantly, Playwright's Chromium browser binary (`chromium-1228`) is **already pre-cached** on the user's system at `~/Library/Caches/ms-playwright/chromium-1228`.
   - Running `npm install --dry-run playwright` verifies that Playwright can be successfully resolved and installed in the workspace environment.
4. **Conclusion**: Playwright is the ideal E2E test runner, offering seamless layout rendering, scroll manipulation, and network inspection with minimal environment configuration overhead.

---

## 3. Caveats

- **Offline Cache Consistency**: The installation of `@playwright/test` assumes the package manager can resolve the package. While `npm install --dry-run` was successful, if the system is completely disconnected, it will rely on the local cache.
- **Playwright Mismatch Prevention**: To prevent Playwright from attempting to download a different browser binary version (which would fail in a strict CODE_ONLY network mode), we must map the `@playwright/test` version in `package.json` to match the cached version (`~v1.59.x` or `~v1.61.x`), or execute the suite with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.

---

## 4. Conclusion

We recommend establishing a Playwright-based E2E test suite. 

### Proposed Project Test Architecture Design

#### A. File Layout
```
SnapZoneWeb/
├── package.json
├── playwright.config.js
├── tests/
│   ├── scroll-snap.spec.js
│   ├── responsive.spec.js
│   ├── layout.spec.js
│   ├── interactive.spec.js
│   └── resources.spec.js
```

#### B. Setup Configuration (`package.json`)
We recommend writing a `package.json` in the root of `SnapZoneWeb/` to define the devDependencies and test commands:
```json
{
  "name": "snapzone-web-tests",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test:e2e": "cross-env PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 playwright test",
    "test:e2e:ui": "cross-env PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.59.1",
    "cross-env": "^7.0.3",
    "http-server": "^14.1.1"
  }
}
```

#### C. Playwright Setup (`playwright.config.js`)
Configured to serve the static content locally and run headless Chromium tests using the pre-cached browser binaries:
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx http-server . -p 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
```

#### D. Test Design Details

##### 1. `tests/scroll-snap.spec.js` (F1 & F3: Scroll Syncing & Transitions)
- **Scroll Sync Verification**: Scroll sequentially by increments of `viewportHeight` (from `0 * viewportHeight` up to `9 * viewportHeight`). Evaluate slides to assert computed values of `--slide-tx` (in `vw`), `--slide-opacity` (0 to 1), and `--content-tx` (in `vw`) match expected values.
- **Active Class Check**: Assert that slides with computed `--slide-opacity > 0.15` possess the `.active-slide` class, and those below this threshold have it removed.
- **Fade Transitions Check**: Verify that at all intermediate scroll positions, slides do not visually overlap or collide (i.e. opacity curves and slide shifts prevent overlapping text/cards in the center).

##### 2. `tests/responsive.spec.js` (F4: Mobile Reset & Vertical Flow)
- **Desktop Initialization & Mobile Resize**: Resize the viewport width below 900px (e.g. 800px).
- **Inline Style & Class Cleanup**: Assert that all inline CSS properties (`--slide-tx`, `--slide-opacity`, `--content-tx`) and the `.active-slide` class are successfully removed from all slides.
- **Layout Flow Assertions**: Verify that the slides stack vertically (i.e. `#gestures` is positioned below `#hero` in absolute layout coordinates).

##### 3. `tests/layout.spec.js` (F2: Spatial Alignment & Layout Modes)
- **Split-Screen Panel Verification**: Scroll to progress state `2.0` (Hero & Gestures side-by-side). Verify `#hero` and `#gestures` bounding boxes are displayed side-by-side without intersection (left vs right alignment).
- **Centered Slide Verification**: Scroll to progress state `3.0` (FancyZone centered). Verify `#fancyzone` is horizontally centered in the viewport.

##### 4. `tests/interactive.spec.js` (F5: Interactive Widgets)
- **Language Switcher**: Click language buttons ('EN', 'IT', 'ES'). Assert `lang` attribute on `<html>` updates, and page headings switch dynamically (e.g., text for "nav_how_it_works" displays translated text).
- **Theme Toggle**: Click `#theme-toggle`. Assert `data-theme` on `<html>` switches between `light` and `dark`.
- **Dismiss Announcement Bar**: Click `#announce-close`. Assert announcement bar height transitions to `0px` and the state persists in `sessionStorage` on reload.
- **Currency Price Toggle**: Click `#btn-eur`. Assert that prices display the Euro values instead of USD.
- **Device Simulator**: Detach active device. Verify slot class changes from `.pd-occupied` to `.pd-empty` with "Add a Mac" label. Click empty slot and verify it gains `.pd-occupied` class with a random Mac name from the pool.
- **Savings Calculator & Chart**: Slide the hours slider from `8` to `12`. Verify values update in `#calc-hours-val` and `#chart-total-val` (scales from `4h 23m` to `6h 35m`). Verify disclaimer updates text content and SVG chart curves recalculate.

##### 5. `tests/resources.spec.js` (F6 & F7: GDPR Video Consent & Asset Self-Hosting)
- **Lazy YouTube Interception**: Assert that no iframe is loaded inside `#video-wrapper` on initial load. Click video placeholder, assert iframe is injected, and inspect network requests to verify a request is made to `https://www.youtube-nocookie.com/embed/...`.
- **GDPR Network Request Check**: Use Playwright's `page.on('request', ...)` to log all resource requests on load. Verify that all resources are fetched from local paths (no fonts loaded from `fonts.googleapis.com` or script assets loaded from third-party CDNs).

---

## 5. Verification Method

To verify these findings and confirm the test setup:
1. Inspect this handoff file at `/Users/michele/Documents/SnapZone/SnapZoneWeb/.agents/explorer_infra/handoff.md`.
2. Inspect the Playwright browser caching directory `/Users/michele/Library/Caches/ms-playwright/` to verify that `chromium-1228` and `ffmpeg-1011` exist.
3. Verify that NPM packages can be resolved in the offline workspace environment by executing:
   ```bash
   npm install --dry-run playwright
   ```
