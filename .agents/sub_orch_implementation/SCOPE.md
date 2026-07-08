# Scope: Implementation Track

## Architecture
- DOM Container: `#story-container` holds the sticky viewport container `#story-sticky` and `.story-trigger` elements.
- Story Slides: `#hero`, `#gestures`, `#fancyzone`, `#how-it-works`, `#analytics`, `#pricing`, `#download` absolute-positioned.
- Scroll Sync State: Custom properties `--slide-tx`, `--slide-opacity`, and `--content-tx` set by scroll handler in `script.js`.
- Breakpoint Contract:
  - Viewport width >= 900px: Scroll-snapped layout active.
  - Viewport width < 900px: standard vertical flow, absolute positioning disabled, custom properties cleared.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M2 | Spatial & Visual Layout | Resemble premium macOS system settings, generous margins, comfort, scale 8 gesture cards and 3 how-it-works cards without clipping/overflow. | None | DONE |
| M3 | Fade-based Transitions | Implement smooth fade transition curves to prevent panel overlaps/collisions. | M2 | IN_PROGRESS |
| M4 | Responsive Cleanliness | Ensure viewport width < 900px resets all absolute positioning and storytelling class residue. | M3 | PLANNED |
| M5 | Adversarial Hardening | Verify against E2E test suite in TEST_READY.md, run Challenger for Tier 5 testing, and run Forensic Auditor for integrity verification. | M4 | PLANNED |

## Interface Contracts
- `--slide-tx`: Horizontal translation for slide transition (unit: `vw`).
- `--slide-opacity`: Visibility/opacity of slide (range: `0` to `1`).
- `--content-tx`: Horizontal shift for content within the slide (unit: `vw`).
- `.active-slide`: Class added to slides with opacity > `0.15` to enable mouse interactions.
- Viewport width `< 900px`: standard vertical flow, absolute positioning disabled, custom properties cleared.
