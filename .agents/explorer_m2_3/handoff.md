# Handoff Report: Spatial & Visual Layout Optimization (Milestone M2)

## 1. Observation

Based on a detailed investigation of the SnapZone codebase (`index.html`, `styles.css`, and `script.js`), the following structural and layout details were observed:

### A. Scroll Snapping & Slide Translations (Desktop Viewports >= 900px)
- **Sticky Container**: The desktop scroll snap architecture uses absolute positioning within a sticky viewport wrapper (`#story-sticky` inside `#story-container` at `styles.css:3159-3171`).
- **Translation Engine**: Slides are shifted side-by-side using inline CSS variables (`--slide-tx`, `--slide-opacity`, and `--content-tx`) set dynamically by the scroll listener `initStoryScroll` in `script.js:861-1000`.
- **Split-Screen Mechanics**: The split-screen states are formed by translating the left pane content by `-22vw` and the right pane content by `22vw` relative to the screen center (e.g. `configs.hero = { contentTx: -22, ... }` at `script.js:904` and `configs.gestures = { contentTx: 22, ... }` at `script.js:915`).

### B. Current Container Widths & Overlap Calculations
In `styles.css:3221-3264`, the max-widths of the inner containers in split-screen slides are defined as follows:
- **Hero** (`#hero .hero-inner`): `max-width: min(44vw, 680px);` (Line 3221)
- **Gestures** (`#gestures .section-inner`): `max-width: min(48vw, 840px);` (Line 3225)
- **FancyZone** (`#fancyzone .fancyzone-inner`): `max-width: min(48vw, 840px);` (Line 3233)
- **How it Works** (`#how-it-works .section-inner`): `max-width: min(46vw, 780px);` (Line 3239)
- **Analytics** (`#analytics .analytics-inner`): `max-width: min(48vw, 840px);` (Line 3247)
- **Pricing** (`#pricing .section-inner`): `max-width: min(44vw, 720px);` (Line 3253)

These widths create direct physical overlapping and visual collision zones:
1. **Hero (Left, -22vw shift) & Gestures (Right, 22vw shift)**:
   - Hero: Center `-22vw`, half-width `22vw` (from `44vw`). Right boundary = `-22vw + 22vw = 0vw`.
   - Gestures: Center `22vw`, half-width `24vw` (from `48vw`). Left boundary = `22vw - 24vw = -2vw`.
   - **Collision Zone**: Overlap between `-2vw` and `0vw` (width of **2vw**).
2. **FancyZone (Left, -22vw shift) & How it Works (Right, 22vw shift)**:
   - FancyZone: Center `-22vw`, half-width `24vw` (from `48vw`). Right boundary = `-22vw + 24vw = 2vw`.
   - How it Works: Center `22vw`, half-width `23vw` (from `46vw`). Left boundary = `22vw - 23vw = -1vw`.
   - **Collision Zone**: Overlap between `-1vw` and `2vw` (width of **3vw**).
3. **Analytics (Left, -22vw shift) & Pricing (Right, 22vw shift)**:
   - Analytics: Center `-22vw`, half-width `24vw` (from `48vw`). Right boundary = `-22vw + 24vw = 2vw`.
   - Pricing: Center `22vw`, half-width `22vw` (from `44vw`). Left boundary = `22vw - 22vw = 0vw`.
   - **Collision Zone**: Overlap between `0vw` and `2vw` (width of **2vw**).

### C. Grid Layouts & Card Cramping
- **Gesture Cards Grid**: Currently set to `grid-template-columns: repeat(4, 1fr); gap: var(--space-xs);` (`styles.css:3228-3231`). At a 900px viewport, `48vw` is only `432px`. Factoring in gaps, each column is less than `100px` wide. Long text labels like `Diagonal Top-Right · Top-Right Quarter` wrap into multiple cluttered lines, causing clipping and horizontal overflows.
- **How-it-Works Grid**: Currently set to `grid-template-columns: repeat(3, 1fr); gap: var(--space-xs);` (`styles.css:3242-3245`). At 900px viewport, `46vw` is `414px`, making each card only `~120px` wide. Because how-it-works cards (`.method-card` at `styles.css:1365-1375`) contain an icon, title, long descriptive text, and a visual demo, they are severely cramped, wrapping text word-by-word and causing massive vertical page overflows.
- **Pricing Grid**: Currently set to `grid-template-columns: repeat(2, 1fr); gap: var(--space-s);` (`styles.css:3256-3259`). At 900px viewport, `44vw` is `396px`, making each card `180px` wide. Inside the Lifetime card, the macOS device slots list (`.pricing-devices` at `styles.css:2397-2400`) lacks sufficient horizontal breathing room.

---

## 2. Logic Chain

1. **Physical Overlap**: The collision and overlapping of split-screen panels (Calculations in 1B) occur because the combined half-widths of the left and right panels exceed the center-to-center translation distance (`44vw`). Capping the max-width of all split panels on desktop to a maximum of `40vw` limits the half-width to `20vw`. For left and right centers at `-22vw` and `22vw`, boundaries will be `-2vw` and `2vw` respectively, creating a guaranteed, clean gap of `4vw` (approx. 36px to 60px) and avoiding all collisions.
2. **Cramping of Gesture Cards**: At viewport widths near 900px, 4 columns inside a `40vw` panel (width ~360px) squeeze cards to `~80px` wide, causing text wrapping and overflow. Dropping to a 2-column layout increases card width to `~170px`, allowing text to read comfortably. 
3. **Gesture Card Vertical Overflow**: A 2-column grid of 8 cards creates 4 rows. At a standard stacked canvas + label layout, the total height (`~750px`) will overflow typical laptop viewports (e.g. 768px height). Turning the cards into horizontal flex rows (canvas on the left, labels on the right) reduces card height from `173px` to `60px`, dropping total grid height to `~240px` and keeping it comfortably inside the viewport.
4. **Cramping of How-it-Works Cards**: At 900px viewport, 3 columns inside a `40vw` panel (width ~360px) squeeze cards to `112px` wide. Stacking them in a single column (`grid-template-columns: 1fr;`) makes cards `360px` wide. To save vertical space and match the macOS System Settings sidebar/grouped cell structure, we can convert these cards to horizontal row layouts using CSS Grid. This reduces grid height to `~256px` while ensuring zero text clipping.
5. **macOS System Settings Aesthetics**: macOS system settings screens use grouped list cards (with white/dark surface backgrounds and subtle borders) inside a translucent glass panel window (with backdrop blur, borders, and shadows). Styling the `.section-inner` containers as the translucent "windows" and the gesture/method cards as the "grouped settings cells" aligns the site's layout perfectly with macOS system aesthetics.
6. **Liveness Safety (Height Fail-Safe)**: In scroll-snap layouts, users cannot scroll down to see hidden content within a slide, making vertical overflows critical bugs. Restricting the macOS settings panels to a maximum height of `82vh` and enabling `overflow-y: auto;` ensures that on any display size, the content will stay accessible and scroll gracefully inside the panel card.

---

## 3. Caveats

- **Breakpoints**: The scroll-snap storytelling layout is strictly active for viewports `>= 900px`. The proposed macOS window styles must only be applied within the `@media (min-width: 900px)` media query block so the mobile vertical layout remains clean, simple, and unaffected.
- **Scroll Sync Transitions**: Changes in layout heights might subtly affect when a card enters visual boundaries. Applying the height fail-safe (`max-height: 82vh; overflow-y: auto;`) mitigates this since visual containers remain constant.

---

## 4. Conclusion

To achieve visual excellence and resemble a premium macOS system settings layout without clipping or overflows on viewports >= 900px, the SnapZone stylesheet (`styles.css`) should be optimized as follows:

### A. Apply macOS System Settings Window Styling to Desktop Panels
In the `@media (min-width: 900px)` section, style all slide inner containers as translucent rounded windows:
```css
.story-slide .hero-inner,
.story-slide .fancyzone-inner,
.story-slide .analytics-inner,
.story-slide .download-inner,
.story-slide .section-inner {
  /* Translucent macOS backdrop blur */
  background: var(--panel-bg, rgba(255, 255, 255, 0.82));
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  
  /* macOS Border & Rounded Corners */
  border: 1px solid var(--panel-border, rgba(0, 0, 0, 0.08));
  border-radius: 20px;
  
  /* Soft window drop shadow */
  box-shadow: var(--panel-shadow, 0 20px 40px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.02));
  
  /* Padding and vertical sizing safety */
  padding: var(--space-xl);
  max-height: 82vh;
  overflow-y: auto;
  box-sizing: border-box;
}

/* Light / Dark Mode Color Rules */
[data-theme="dark"] {
  --panel-bg: rgba(30, 30, 30, 0.85);
  --panel-border: rgba(255, 255, 255, 0.08);
  --panel-shadow: 0 20px 45px rgba(0, 0, 0, 0.35), 0 1px 5px rgba(0, 0, 0, 0.1);
}
```

### B. Optimize Panel Widths to Prevent Overlap (No-Collision Gap)
Update the split-screen panel widths to cap at `40vw`, creating a `4vw` clean gap:
```css
.story-slide#hero .hero-inner {
  max-width: min(40vw, 600px);
  text-align: left;
}
.story-slide#hero .hero-text {
  align-items: flex-start;
}
.story-slide#hero .hero-actions {
  justify-content: flex-start;
}

.story-slide#gestures .section-inner {
  max-width: min(40vw, 700px);
}

.story-slide#fancyzone .fancyzone-inner {
  max-width: min(40vw, 700px);
}

.story-slide#how-it-works .section-inner {
  max-width: min(40vw, 700px);
}

.story-slide#analytics .analytics-inner {
  max-width: min(40vw, 700px);
}

.story-slide#pricing .section-inner {
  max-width: min(40vw, 700px);
}

/* Centered Download slide can remain wider */
.story-slide#download .download-inner {
  max-width: min(60vw, 840px);
}
```

### C. Redesign the 8 Gesture Cards (2-Column Flex Row Layout)
Change the grid to 2 columns and convert card structure to a horizontal row layout to prevent both horizontal and vertical clipping:
```css
.story-slide#gestures .gestures-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-s);
}

.story-slide#gestures .gesture-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: var(--space-xs);
  gap: var(--space-xs);
}

.story-slide#gestures .gesture-canvas-wrap {
  width: 75px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
}

.story-slide#gestures .gesture-label {
  border-top: none;
  padding: 0;
  font-size: 0.8rem;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.story-slide#gestures .gesture-label em {
  display: block;
  font-size: 0.72rem;
  margin-top: 2px;
}
```

### D. Redesign the 3 How-it-Works Cards (1-Column Row List Layout)
Convert how-it-works cards to a vertical list of horizontal rows using pure CSS grid to fit comfortably inside the pane:
```css
.story-slide#how-it-works .methods-grid {
  grid-template-columns: 1fr;
  gap: var(--space-s);
}

.story-slide#how-it-works .method-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  column-gap: var(--space-m);
  row-gap: var(--space-xs);
  align-items: center;
  padding: var(--space-m);
}

.story-slide#how-it-works .method-icon {
  grid-column: 1;
  grid-row: 1 / span 2;
  margin-bottom: 0;
}

.story-slide#how-it-works .method-card h3 {
  grid-column: 2;
  grid-row: 1;
  margin-bottom: 0;
}

.story-slide#how-it-works .method-card p {
  grid-column: 2;
  grid-row: 2;
  margin-bottom: 0;
  font-size: 0.85rem;
}

.story-slide#how-it-works .method-demo {
  grid-column: 3;
  grid-row: 1 / span 2;
  margin-top: 0;
  width: 100px;
  height: 60px;
}
```

### E. Optimize Pricing Grid (1-Column Stack with Breakpoint Expansion)
Ensure the pricing cards stack on small-to-medium screens to prevent slots cramping, expanding to 2 columns on wide screens:
```css
.story-slide#pricing .pricing-grid {
  grid-template-columns: 1fr;
  gap: var(--space-s);
}

@media (min-width: 1200px) {
  .story-slide#pricing .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-s);
  }
}
```

---

## 5. Verification Method

### Step 1: Code Review Verification
Verify that the styles added in `styles.css` are enclosed inside the `@media (min-width: 900px)` media query block to avoid regression on mobile layouts.

### Step 2: Visual Inspection
Open `index.html` in a local web browser and verify visually:
1. **No-Overlap Check**: Resizing viewport width from `900px` to `1600px` must show a clean gap of at least `4vw` between the left and right split-screen panels. No components should slide into or overlay on top of one another.
2. **Gesture Cards Check**: Inspect the gestures panel to ensure the 8 gesture cards align in a 2-column list, the canvas previews render inside 75px wide blocks on the left, and translation strings (in Italian/Spanish/English) wrap elegantly without clipping.
3. **How-it-Works Cards Check**: Ensure the 3 cards display stacked vertically as row cells, with the icon on the left, title/description in the middle, and canvas demo on the right.
4. **Liveness Height Check**: Resize the browser height to small values (e.g. `650px` or `700px`). Ensure that slide contents stay fully readable and render scrollbars inside the translucent macOS panels when exceeding height limits.
