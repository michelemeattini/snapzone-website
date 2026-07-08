# Project: SnapZone Storytelling Scroll Snap Overhaul

## Architecture
- **DOM Container**: `#story-container` holds the sticky viewport container `#story-sticky` and `.story-trigger` elements which govern the browser scroll-snap positions.
- **Story Slides**: Individual slides `#hero`, `#gestures`, `#fancyzone`, `#how-it-works`, `#analytics`, `#pricing`, `#download` are styled as absolute-positioned panels within the sticky wrapper.
- **Scroll Sync State**:
  - The scroll listener in `script.js` maps scroll position to a progress value (`0.0` to `9.0`).
  - Progress is translated into inline CSS custom properties: `--slide-tx`, `--slide-opacity`, and `--content-tx`.
- **Layout Modes**:
  - **Split-Screen panels**: Panels aligned next to each other (e.g. Hero & Gestures, FancyZone & How It Works, Analytics & Pricing) when visible side-by-side.
  - **Centered slides**: Single panels centered horizontally (e.g. FancyZone initially, Analytics initially, Download).
  - **Mobile fallback**: Viewports < 900px fall back to standard, vertically flowing layouts.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | E2E Test Suite | Build E2E test framework, write Tier 1-4 tests per requirement spec. | None | IN_PROGRESS (24aa3f34-37fe-41e1-a992-d8f0de929518) |
| M2 | Spatial & Visual Layout | Redesign panels to resemble premium macOS settings window; fix grid spacing, padding, margins, card scaling. | M1 | IN_PROGRESS (2c5f7ba1-987e-4517-a876-4f0f54bf8374) |
| M3 | Fade-based Transitions | Implement smooth fade transition curves to prevent panel overlaps/collisions. | M2 | PLANNED (2c5f7ba1-987e-4517-a876-4f0f54bf8374) |
| M4 | Responsive Cleanliness | Ensure viewport width < 900px resets all absolute positioning and storytelling class residue. | M3 | PLANNED (2c5f7ba1-987e-4517-a876-4f0f54bf8374) |
| M5 | Adversarial Hardening | Implement Tier 5 tests, audit with Forensic Auditor. | M4 | PLANNED (2c5f7ba1-987e-4517-a876-4f0f54bf8374) |

## Interface Contracts
### Scroll Sync custom properties
- `--slide-tx`: Horizontal translation for slide transition (unit: `vw`).
- `--slide-opacity`: Visibility/opacity of slide (range: `0` to `1`).
- `--content-tx`: Horizontal shift for content within the slide (unit: `vw`).
- `.active-slide`: Class added to slides with opacity > `0.15` to enable mouse interactions.

### Breakpoint Contract
- Viewport width `>= 900px`: Scroll-snapped layout active.
- Viewport width `< 900px`: standard vertical flow, absolute positioning disabled, custom properties cleared.

## Code Layout
- `index.html`: Core HTML structure of the website, containing the storytelling containers, slides, grids, and cards.
- `styles.css`: Visual styling, grid definitions, absolute position layout rules, media queries, and transition animations.
- `script.js`: Interactive components, lazy loader logic, and scroll synchronization logic.
- `tests/`: Target directory for opaque-box E2E tests (to be created under M1).
