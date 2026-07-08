# Milestone M3: Fade-based Non-overlapping Transitions Investigation Report

## 1. Observation
We investigated the SnapZone storytelling layout and transition implementation. The key configurations are located in:
- **HTML Layout**: `/Users/michele/Documents/SnapZone/SnapZoneWeb/index.html` (lines 74-493)
- **Transition Styles**: `/Users/michele/Documents/SnapZone/SnapZoneWeb/styles.css` (lines 3150-3417)
- **Scroll Sync & Progress Logic**: `/Users/michele/Documents/SnapZone/SnapZoneWeb/script.js` (lines 861-1018)

Specifically, the following verbatim lines governing transitions were observed:

### A. CSS Transition Rules (`styles.css`)
At line 3198, `.story-slide` transitions:
```css
    transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
```
At line 3217, `.story-slide .hero-inner, ...` inner panels transition:
```css
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
```

### B. JavaScript Scroll Sync configurations (`script.js`)
At lines 896-898, scroll progress is computed:
```javascript
      // Calculate scroll progress from 0.0 to 9.0
      let progress = -rect.top / viewH;
      progress = Math.max(0, Math.min(9, progress));
```
At lines 902-984, the slide properties are configured using strictly linear interpolations:
- **Outgoing slides** (e.g., Hero from progress 2 to 3):
  ```javascript
  configs.hero = { slideTx: -100 * (progress - 2), contentTx: -22, opacity: 1 - (progress - 2) };
  ```
- **Incoming slides** (e.g., FancyZone from progress 2 to 3):
  ```javascript
  configs.fancyzone = { slideTx: 100 - 100 * (progress - 2), contentTx: 0, opacity: progress - 2 };
  ```
- **Split-Screen layouts layout-centered/split class toggling** (lines 1000-1006):
  ```javascript
  if (conf.contentTx === 0) {
    slide.classList.add('layout-centered');
    slide.classList.remove('layout-split');
  } else {
    slide.classList.add('layout-split');
    slide.classList.remove('layout-centered');
  }
  ```

---

## 2. Logic Chain
Our mathematical and architectural analysis derived the following logic chain leading to the proposed design:

1. **Scroll Sync Lag**:
   - The browser's native scroll-snap handles snapping between triggers. During a snap animation, the scroll position updates continuously, and `script.js` updates `--slide-tx` and `--slide-opacity` dynamically on every frame.
   - However, since `styles.css` has `transition: opacity 0.35s ...` and `transition: transform 0.35s ...`, the browser applies a temporal delay (lag) of 0.35 seconds on top of the scroll sync.
   - During scroll-snapping, this delay causes incoming and outgoing slides to overshoot or lag behind, resulting in visual collisions where panels slide on top of each other.
   - **Conclusion 1**: CSS transitions for `transform` and `opacity` on `.story-slide` and `.hero-inner` must be removed/disabled during scroll sync. The scroll position itself provides smooth updates.

2. **Linear Opacity Overlap**:
   - In a slide transition phase $x \in [0, 1]$ (e.g., progress 2.0 to 3.0), the outgoing slide opacity is $1 - x$ and the incoming slide opacity is $x$.
   - This means both slides are visible simultaneously for the entire interval (e.g., at $x = 0.5$, both are at 0.5 opacity).
   - Although their bounding boxes do not spatially cross in a wide viewport, the cards and text contents remain partially visible while they are in motion, leading to visual clutter and layout overlap.
   - **Conclusion 2**: Introduce non-linear, windowed opacity curves:
     - The **outgoing slide** should fade out completely ($opacity = 0$) in the first 40% of the transition interval ($x \le 0.4$).
     - The **incoming slide** should start fading in only in the last 40% of the transition interval ($x \ge 0.6$).
     - A 20% scroll-gap ($x \in [0.4, 0.6]$) ensures that the screen is visually clean, and the incoming slide moves into position completely hidden, preventing all overlaps.
     - Smooth out the edges using a smoothstep curve $f(k) = k^2(3-2k)$ to avoid abrupt visual pops.

3. **Jarring Layout Snapping**:
   - Currently, a panel snaps instantly between `layout-centered` and `layout-split` when `conf.contentTx === 0` (e.g., at progress 3.01 and 6.01).
   - This causes an instant columns snap from `1fr 1.5fr` to `1fr` and width snap from `85vw` to `48vw` while the panel is fully visible and has barely started shifting.
   - **Conclusion 3**:
     - Change the class toggling threshold to check if the panel has shifted past the midpoint of the transition (`Math.abs(conf.contentTx) < 11` vw instead of `=== 0`).
     - Enable a CSS transition *only* on `max-width` for the inner panels. As the class changes, the container's width will smoothly animate over 0.35s from `85vw` to `48vw` instead of popping.

---

## 3. Caveats
- This investigation is strictly read-only and no code changes were written directly to the project files.
- The behavior was analyzed theoretically and mathematically; actual browser rendering characteristics (e.g. GPU composition under heavy scroll) should be verified by the implementer.
- No testing of mobile fallback layout width (< 900px) was conducted, as absolute positioning and scroll-snapping are disabled on mobile viewports per the PROJECT.md breakpoint contract.

---

## 4. Conclusion
To achieve smooth, non-overlapping fade transitions, we recommend applying the changes detailed in the patch `/Users/michele/Documents/SnapZone/SnapZoneWeb/.agents/explorer_m3_3/fade_transitions.patch`.

### Summary of Recommendations:
1. **Disable CSS transitions** on `--slide-tx`, `--slide-opacity`, and `--content-tx` inside `styles.css`.
2. **Add a CSS transition specifically for `max-width`** on the inner containers to smooth out centered-to-split resizing.
3. **Use smoothstep-windowed fade curves** in JavaScript for slide transitions:
   - **Fade-out (outgoing)**: `getSmoothOpacity(t, true)` - Fades to 0 by $t = 0.4$.
   - **Fade-in (incoming)**: `getSmoothOpacity(t, false)` - Fades from 0 starting at $t = 0.6$.
   - **Entering (e.g. Gestures)**: `getSmoothstep(t)` - Smoothly fades in from $t = 0$ to $t = 1$.
4. **Shift layout-toggling threshold** to `Math.abs(conf.contentTx) < 11` (midpoint of the 22vw translation).

---

## 5. Verification Method
The implementer can verify the fix as follows:
1. **Apply the patch**:
   Run the following command from the workspace root:
   ```bash
   patch -p1 < .agents/explorer_m3_3/fade_transitions.patch
   ```
2. **Run E2E Test Suite**:
   Verify that all transition/layout tests pass (especially the E2E tests written in M1).
3. **Interactive Validation**:
   - Launch a local server (e.g., `npx http-server` or similar) and open the page in a browser with viewport >= 900px.
   - Scroll slowly between slide triggers (e.g., from Gestures to FancyZone) and check:
     - Gestures slides left and fades out completely before FancyZone becomes visible.
     - FancyZone enters cleanly on the right and fades in as it approaches the center.
     - No visual overlaps of text or cards occur.
     - The centered-to-split shift of FancyZone and Analytics is smooth and does not snap jarringly.
