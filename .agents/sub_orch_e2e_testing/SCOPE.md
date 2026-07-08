# Scope: SnapZone Storytelling Scroll Snap E2E Test Suite

## Architecture
- **E2E Test Runner**: A Node.js-based test runner (e.g. Playwright or Jest + JSDOM/Puppeteer) to verify the behavior of `index.html`, `styles.css`, and `script.js`.
- **Target Features under Test**:
  - F1: Storytelling scroll-snap viewport mapping (scroll progress maps to CSS Custom Properties).
  - F2: Spatial layout & premium margins/padding (macOS system settings look-and-feel).
  - F3: Fade-based slide transitions (non-overlapping panel opacity/translation curves).
  - F4: Responsive layout switch (< 900px vertical flow, clean state reset).
  - F5: Interactive gestures / carousel panels (8 gesture cards, 3 how-it-works cards sizing/stacking).
  - F6: Lazy-loaded third-party resources (YouTube iframe click consent).
  - F7: Strict self-hosted assets (no external network requests like Google Fonts on initial load).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1.1 | Investigation & Infra Design | Discover system environment, define E2E test infra, and write TEST_INFRA.md. | None | PLANNED |
| M1.2 | Tier 1: Feature Coverage | Implement tests for basic coverage of F1-F7 features. | M1.1 | PLANNED |
| M1.3 | Tier 2: Boundary & Corner Cases | Implement boundary, empty, overflow, and viewport limit tests. | M1.2 | PLANNED |
| M1.4 | Tier 3: Cross-Feature Combinations | Implement pairwise test scenarios (e.g., resizing viewport during scroll transition). | M1.3 | PLANNED |
| M1.5 | Tier 4: Real-World Scenarios | Implement user scrolling journeys and interactive stories. | M1.4 | PLANNED |
| M1.6 | Verification & Publication | Run all tests, perform final audit, and publish TEST_READY.md. | M1.5 | PLANNED |

## Interface Contracts
### Scroll Snap Custom Properties
- `--slide-tx`, `--slide-opacity`, `--content-tx` set dynamically by scroll listener.
- `.active-slide` added when opacity > 0.15.

### Breakpoint
- Viewport >= 900px: desktop scroll snap active.
- Viewport < 900px: standard vertical flow, absolute position elements reset.
