# E2E Test Infra: SnapZone Storytelling Scroll Snap Layout

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Spatial & Visual Layout | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Fade-based Transitions | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 3 | Responsive Cleanliness | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 4 | Interactive User Widgets | Codebase Discovery (Interactive components) | 5 | 5 | ✓ |
| 5 | GDPR Lazy Video Consent | Codebase Discovery (GDPR Consent) | 5 | 5 | ✓ |
| 6 | Strict Asset Self-Hosting | Codebase Discovery (Strict self-hosted assets) | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Playwright (v1.40.0+) utilizing pre-cached Chromium binary.
- Invocation: `npm run test:e2e` (uses `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 playwright test`).
- Test case format: Automated assertions validating CSS custom variables, bounding boxes, DOM presence, class lists, and network interception logs.
- Directory layout:
  - `playwright.config.js` - Playwright config file.
  - `package.json` - Node dependencies and scripts.
  - `tests/` - Folder containing the test specifications.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Scroll-through storytelling tour | F1, F2, F3 | Medium |
| 2 | Multi-language dark-mode user setup | F4, F6 | Medium |
| 3 | Currency pricing comparison & simulator | F4 | Medium |
| 4 | Fully interactive walkthrough with video | F4, F5, F6 | High |
| 5 | Desktop-to-mobile viewport resizing flow | F1, F2, F3, F4 | High |

## Coverage Thresholds
- Tier 1: ≥5 per feature (Total 30)
- Tier 2: ≥5 per feature (Total 30)
- Tier 3: pairwise coverage of major feature interactions (Total 6)
- Tier 4: ≥5 realistic application scenarios (Total 5)
- **Total minimum: 71 test cases**
