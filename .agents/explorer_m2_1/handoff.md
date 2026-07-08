# Exploration Report — Milestone M2: Spatial & Visual Layout Optimization

This report contains a read-only investigation and concrete layout redesign recommendations for the SnapZone storytelling scroll snap layout. The objective is to make the split-screen panels and centered slides resemble a premium macOS system settings window and ensure that the 8 gesture cards and 3 how-it-works cards fit cleanly without overflow or text clipping on viewports >= 900px.

---

## 1. Observation

Direct observations made in the SnapZone codebase:

### A. Viewport and Scroll snapping Structure (`index.html`)
The main container `#story-container` houses `#story-sticky` (which occupies `100vh`) and 9 `.story-trigger` elements (lines 483-493):
```html
483:     </div> <!-- end #story-sticky -->
484:     <div class="story-trigger"></div>
485:     <div class="story-trigger"></div>
...
493:   </div> <!-- end #story-container -->
```

### B. Inline Scroll Translations (`script.js`)
The scroll handler in `script.js` (lines 875-1007) calculates a progress value from `0.0` to `9.0` and applies horizontal translations (`--content-tx` and `--slide-tx`) directly:
- **Left panels** (Hero, FancyZone, Analytics) have `--content-tx` values ranging from `0` to `-22vw` (lines 902, 928, 954):
  `configs.hero = { slideTx: 0, contentTx: -22 * progress, opacity: 1 };`
  `configs.fancyzone = { slideTx: 0, contentTx: -22 * (progress - 3), opacity: 1 };`
  `configs.analytics = { slideTx: 0, contentTx: -22 * (progress - 6), opacity: 1 };`
- **Right panels** (Gestures, How It Works, Pricing) have a fixed content translation `--content-tx` of `22vw` when active (lines 915, 941, 967):
  `configs.gestures = { slideTx: 100 - 100 * (progress - 1), contentTx: 22, opacity: progress - 1 };`
  `configs.howItWorks = { slideTx: 100 - 100 * (progress - 4), contentTx: 22, opacity: progress - 4 };`
  `configs.pricing = { slideTx: 100 - 100 * (progress - 7), contentTx: 22, opacity: progress - 7 };`

### C. Desktop Storytelling Layout Constraints (`styles.css`)
In `styles.css` (lines 3152-3264), the media query for viewports `>= 900px` overrides normal responsive layout rules:
- Sizing of left vs. right panels:
  - Hero panel width (line 3222): `max-width: min(44vw, 680px);`
  - Gestures panel width (line 3226): `max-width: min(48vw, 840px);`
  - How It Works panel width (line 3240): `max-width: min(46vw, 780px);`
- Grid columns (forced for all viewports `>= 900px` regardless of size):
  - Gestures grid columns (line 3229):
    ```css
    .story-slide#gestures .gestures-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-xs);
    }
    ```
  - How It Works grid columns (line 3242):
    ```css
    .story-slide#how-it-works .methods-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-xs);
    }
    ```

### D. Card Paddings & Spacings (`styles.css`)
- Spacings tokens (lines 46, 49):
  `--space-xs: clamp(0.5rem, 1vw, 0.75rem);`
  `--space-l: clamp(1.5rem, 3vw, 2.5rem);`
- Card padding definitions (line 1369):
  ```css
  .method-card {
    ...
    padding: var(--space-l);
    ...
  }
  ```

### E. Text Lengths and Localization (`translations.js`)
String values loaded into labels can be very long (especially in Italian or Spanish). For example, Italian translations in `translations.js`:
- `"gest_tr": "Diagonale in alto a destra · Quarto in alto a destra"`
- `"gest_bl": "Diagonale in basso a sinistra · Quarto in basso a sinistra"`

---

## 2. Logic Chain

The observations above lead to several visual and layout flaws on viewports >= 900px:

1. **Horizontal Overlap and Cramping**:
   - The left pane is translated to `-22vw` and the right pane to `22vw`, meaning their centers are separated by `44vw`.
   - On a viewport width of 1000px, the left pane has center at `280px` (with width up to `44vw = 440px`, spanning from `60px` to `500px`). The right pane has center at `720px` (with width up to `48vw = 480px`, spanning from `480px` to `960px`).
   - This results in a physical overlap of `20px` in the center, and forces the content containers to squeeze tightly.

2. **The 8 Gesture Cards Cramping and Height Explosion**:
   - On a 900px viewport, the gestures inner panel width is constrained to `48vw = 432px`.
   - The grid forces 4 columns (`repeat(4, 1fr)`). Accounting for 3 gaps of `var(--space-xs)` (which is `1vw = 9px`), the width of each of the 4 columns is: `(432px - 27px) / 4 = 101px`!
   - Each `.gesture-card` has a label padding of `1em` (~13px) on each side, a `.gesture-icon` of width 22px, and a gap of `0.55em` (7px). This leaves only: `101px - 26px - 22px - 7px = 46px` for the text!
   - A long translation string like `"Diagonale in alto a destra..."` cannot fit in 46px of width. The words wrap excessively into 6+ lines, causing the card height to balloon vertically.
   - A 2-column grid of vertical cards at this viewport is also too tall: 4 rows of ~180px cards would require `720px` of vertical height, which overflows a small laptop screen (e.g. 900x600px).
   - Because `#story-sticky` has a fixed height of `100vh` and `overflow: hidden`, any height overflow gets clipped.

3. **The 3 How-It-Works Cards Squeezing and Clipping**:
   - On a 900px viewport, the how-it-works inner panel width is constrained to `46vw = 414px`.
   - The grid forces 3 columns (`repeat(3, 1fr)`). Accounting for gaps, the column width is `132px`.
   - The `.method-card` has a padding of `var(--space-l)` which equals `3vw = 27px` on each side at 900px.
   - This leaves only `132px - 54px = 78px` of content width!
   - Squeezing a 24-word description paragraph into a 78px space causes the paragraph to stretch to 15-20 lines vertically.
   - Combined with the icon (44px), title (30px), demo box (88px), and top/bottom padding (54px), the card height expands to over `750px`, causing severe vertical clipping on typical screens.

---

## 3. Caveats

- **No Automated Tests Available**: The M1 milestone is in progress; therefore, testing must be conducted manually by loading `index.html` and visually inspecting responsiveness across viewports.
- **Localization Complexity**: Long Spanish/Italian translations are the primary source of label clipping and vertical height expansion. Testing must be performed in all supported languages (`EN`, `IT`, `ES`).
- **JS Custom Property Hardcoding**: The JavaScript scroll snapping logic hardcodes `--content-tx` to `22` and `-22`. To shift horizontal panel widths or offsets dynamically without editing JavaScript, we must override these variables in CSS using `calc()`.

---

## 4. Conclusion

To achieve a premium macOS settings window look and prevent layout clipping/overflow on viewports >= 900px, the following CSS adjustments should be introduced to `styles.css`:

### A. The "Companion macOS Windows" Layout
Style the left panels as settings navigation/sidebar sections and the right panels as main preference detail panels. 
- Use a background of `--surface-2` (soft macOS light-gray) for left text panels, and `--bg` (clean white) for right panels.
- Add macOS traffic light controls using a CSS background-image gradient pattern to mimic an authentic window frame.
- Adjust panel widths and translations using `calc()` to shift the center dividing line to the left: left text panels are narrowed to `40vw` and right card panels are expanded to `48vw` to maximize layout space. They meet exactly in the center.

### B. Gestures Layout Optimization
- Avoid forcing 4 columns on narrow viewports. On viewports between 900px and 1200px, display the cards in 2 columns.
- Redesign the `.gesture-card` to use a **horizontal flex layout** (`flex-direction: row`) instead of a vertical stack:
  - Put the trackpad `.gesture-canvas-wrap` on the left with a small, compact size (e.g. `60px` x `38px`).
  - Position the text labels on the right, stacking the subtitle below the title.
  - Hide the `.gesture-icon` arrow, since the trackpad canvas animation already communicates direction.
  - This reduces card height to a mere `50px`, fitting all 8 gestures into 2 columns within ~240px of grid height.

### C. How It Works Layout Optimization
- Reduce `.method-card` padding on viewports >= 900px from `3vw` to `var(--space-s)` (`16px`) or `12px` to expand the content area.
- Compress typography and spacing: set card headings to `1.15rem`, description lines to `0.85rem` with a `1.5` line-height, and gap to `12px`.
- Reduce the `.method-demo` container height to `72px`.
- This reduces the method card height to ~250px, allowing the 3 columns to fit comfortably on any screen.

### Proposed CSS Modifications (`styles.css`)

Here is the exact CSS code block designed to replace or append to the `@media (min-width: 900px)` section:

```css
@media (min-width: 900px) {
  /* 1. macOS Window Pane Layout Adjustments */
  .story-slide#hero .hero-inner,
  .story-slide#fancyzone .fancyzone-inner,
  .story-slide#analytics .analytics-inner {
    max-width: min(40vw, 600px);
    transform: translateX(calc(var(--content-tx, 0) * 1.09)) !important;
    background: var(--surface-2);
    border: 1px solid var(--ink-faint);
    border-right: none;
    border-radius: var(--r-l) 0 0 var(--r-l);
    box-shadow: -12px 16px 40px rgba(0, 0, 0, 0.05);
    padding: var(--space-l) !important;
    position: relative;
  }

  .story-slide#gestures .section-inner,
  .story-slide#how-it-works .section-inner,
  .story-slide#pricing .section-inner {
    max-width: min(48vw, 760px);
    transform: translateX(calc(var(--content-tx, 0) * 0.91)) !important;
    background: var(--bg);
    border: 1px solid var(--ink-faint);
    border-radius: 0 var(--r-l) var(--r-l) 0;
    box-shadow: 12px 16px 40px rgba(0, 0, 0, 0.05);
    padding: var(--space-l) !important;
    position: relative;
  }

  /* Centered slides style (Download, initially entering pages) */
  .story-slide#download .download-inner {
    max-width: min(50vw, 800px);
    background: var(--bg);
    border: 1px solid var(--ink-faint);
    border-radius: var(--r-l);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
    padding: var(--space-l);
  }

  /* macOS Traffic Light Window Controls decoration */
  .story-slide#hero .hero-inner::before,
  .story-slide#fancyzone .fancyzone-inner::before,
  .story-slide#analytics .analytics-inner::before,
  .story-slide#download .download-inner::before {
    content: '';
    position: absolute;
    top: 18px;
    left: 18px;
    width: 46px;
    height: 12px;
    background: radial-gradient(circle, #ff5f56 5px, transparent 5px) 0px center / 10px 10px no-repeat,
                radial-gradient(circle, #ffbd2e 5px, transparent 5px) 16px center / 10px 10px no-repeat,
                radial-gradient(circle, #27c93f 5px, transparent 5px) 32px center / 10px 10px no-repeat;
    opacity: 0.85;
  }

  /* 2. Gestures Panel Layout & Compact Horizontal Cards */
  .story-slide#gestures .gestures-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: var(--space-s) !important;
  }

  @media (min-width: 1300px) {
    .story-slide#gestures .gestures-grid {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  }

  .story-slide#gestures .gesture-card {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: var(--space-s) !important;
    padding: var(--space-xs) !important;
    background: var(--surface) !important;
    border-radius: var(--r-m) !important;
    overflow: hidden;
  }

  .story-slide#gestures .gesture-canvas-wrap {
    width: 60px !important;
    height: 38px !important;
    flex-shrink: 0 !important;
    border-radius: var(--r-s) !important;
    background: var(--surface-2) !important;
  }

  .story-slide#gestures .gesture-label {
    border-top: none !important;
    padding: 0 !important;
    font-size: 0.82rem !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 1px !important;
    color: var(--ink) !important;
  }

  .story-slide#gestures .gesture-label em {
    display: block !important;
    font-size: 0.72rem !important;
    color: var(--ink-muted) !important;
  }

  .story-slide#gestures .gesture-icon {
    display: none !important; /* Visual direction is already communicated by the canvas */
  }

  /* 3. How It Works Panel & Compact Cards */
  .story-slide#how-it-works .methods-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: var(--space-s) !important;
  }

  .story-slide#how-it-works .method-card {
    padding: var(--space-s) !important; /* 16px instead of 3vw */
    border-radius: var(--r-m) !important;
    gap: var(--space-xs) !important;
  }

  .story-slide#how-it-works .method-icon {
    width: 40px !important;
    height: 40px !important;
    margin-bottom: 0 !important;
    border-radius: var(--r-s) !important;
  }

  .story-slide#how-it-works .method-card h3 {
    font-size: 1.1rem !important;
    margin-bottom: 2px !important;
    letter-spacing: -0.01em;
  }

  .story-slide#how-it-works .method-card p {
    font-size: 0.8rem !important;
    line-height: 1.5 !important;
    margin-bottom: var(--space-s) !important;
  }

  .story-slide#how-it-works .method-demo {
    height: 72px !important; /* Reduce from 88px */
    border-radius: var(--r-s) !important;
  }
}
```

---

## 5. Verification Method

To verify these changes:

1. **Visual Testing in Browser**:
   - Open `/Users/michele/Documents/SnapZone/SnapZoneWeb/index.html` in a web browser.
   - Resize the window width from 900px up to 1440px.
   - Assert that the left (text) panel and right (cards) panel slide smoothly and meet in the center to form a single macOS settings window with rounded corners, sidebar division, and window header dots.

2. **Localization and Wrapping Checks**:
   - Toggle languages to Italian (`IT`) and Spanish (`ES`) using the navbar language buttons.
   - Verify that long translations like `"Diagonale in alto a destra · Quarto in alto a destra"` wrap cleanly on the gesture card list rows without overlapping the boundaries of the grid.
   - Confirm that the how-it-works description text does not stretch the cards vertically beyond the screen height.

3. **No Overflow Assertions**:
   - Ensure no horizontal scrollbar appears during scroll snapping.
   - Ensure no vertical clipping of any card content occurs.
