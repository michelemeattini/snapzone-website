# M2 Spatial & Visual Layout Optimization - Exploration Report

## 1. Observation
We examined the SnapZone HTML, CSS, and JS files, specifically focusing on the media queries and layout styles for screen widths >= 900px.

### Exact File Paths & Lines:
1. **`styles.css` (Lines 3152-3264) - Desktop Layout Overrides**:
   ```css
   @media (min-width: 900px) {
     ...
     /* Sibling scroll triggers that lock the browser scrolling */
     .story-trigger {
       height: 100vh;
       scroll-snap-align: start;
       ...
     }

     /* Full screen slide panels */
     .story-slide {
       position: absolute;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       ...
     }

     /* Custom overrides for split-screen layouts to fit side-by-side */
     .story-slide#hero .hero-inner {
       max-width: min(44vw, 680px);
     }

     .story-slide#gestures .section-inner {
       max-width: min(48vw, 840px);
     }
     .story-slide#gestures .gestures-grid {
       grid-template-columns: repeat(4, 1fr);
       gap: var(--space-xs);
     }

     .story-slide#fancyzone .fancyzone-inner {
       max-width: min(48vw, 840px);
       grid-template-columns: 1fr;
       gap: var(--space-m);
     }

     .story-slide#how-it-works .section-inner {
       max-width: min(46vw, 780px);
     }
     .story-slide#how-it-works .methods-grid {
       grid-template-columns: repeat(3, 1fr);
       gap: var(--space-xs);
     }

     .story-slide#analytics .analytics-inner {
       max-width: min(48vw, 840px);
       grid-template-columns: 1fr;
       gap: var(--space-m);
     }

     .story-slide#pricing .section-inner {
       max-width: min(44vw, 720px);
     }
     .story-slide#pricing .pricing-grid {
       grid-template-columns: repeat(2, 1fr);
       gap: var(--space-s);
     }
     ...
   }
   ```

2. **`styles.css` (Lines 1365-1375) - Default Method Card Padding**:
   ```css
   .method-card {
     background: var(--bg);
     border: 1px solid rgba(100, 100, 100, 0.08);
     border-radius: var(--r-l);
     padding: var(--space-l);
     position: relative;
     overflow: hidden;
     transition: border-color 0.4s var(--ease-out), box-shadow 0.4s var(--ease-out), transform 0.4s var(--ease-out);
     display: flex;
     flex-direction: column;
   }
   ```

3. **`styles.css` (Line 49) - Spacing Token**:
   ```css
   --space-l: clamp(1.5rem, 3vw, 2.5rem);
   ```

4. **`styles.css` (Lines 2983-2996) - Gesture Labels**:
   ```css
   .gesture-label {
     display: flex;
     align-items: center;
     gap: 0.55em;
     padding: 0.75em 1em;
     font-size: 0.82rem;
     font-weight: 500;
     color: var(--ink-muted);
     border-top: 1px solid var(--ink-faint);
   }
   .gesture-label em {
     font-style: normal;
     color: var(--ink-faint);
   }
   ```

5. **`script.js` (Lines 875-887) - Viewport Width Detection**:
   ```javascript
   function update() {
     if (window.innerWidth < 900) {
       // Reset all inline styles on mobile to ensure vertical layout works
       Object.values(slides).forEach(slide => {
         if (slide) {
           slide.style.removeProperty('--slide-tx');
           slide.style.removeProperty('--slide-opacity');
           slide.style.removeProperty('--content-tx');
           slide.classList.remove('active-slide');
         }
       });
       return;
     }
     ...
   }
   ```

6. **`script.js` (Lines 983-999) - Custom CSS Properties Application**:
   ```javascript
   // Apply configs to slides
   Object.keys(slides).forEach(key => {
     const slide = slides[key];
     const conf = configs[key];
     if (slide && conf) {
       slide.style.setProperty('--slide-tx', `${conf.slideTx}vw`);
       slide.style.setProperty('--slide-opacity', conf.opacity);
       slide.style.setProperty('--content-tx', `${conf.contentTx}vw`);
       
       if (conf.opacity > 0.15) {
         slide.classList.add('active-slide');
       } else {
         slide.classList.remove('active-slide');
       }
     }
   });
   ```

---

## 2. Logic Chain
1. **Severe Cramping at Breakpoint Edge (900px)**:
   - On a viewport width of exactly 900px:
     - For `#gestures`: `.section-inner` has `max-width: min(48vw, 840px)`, which is `432px`.
     - With `grid-template-columns: repeat(4, 1fr)` and `gap` around `8px`, each of the 8 gesture cards is constrained to a width of **`102px`**.
     - For `#how-it-works`: `.section-inner` has `max-width: min(46vw, 780px)`, which is `414px`.
     - With `grid-template-columns: repeat(3, 1fr)` and `gap` around `8px`, each of the 3 how-it-works cards has a width of **`132px`**.
2. **Text Clipping & Wrapping Invalidation**:
   - The default padding for `.method-card` is `var(--space-l)`, which scales down to `3vw` (27px on each side) on a 900px viewport. This leaves only `132px - 54px = 78px` of content width inside the card.
   - A `78px` content width makes it impossible for card content (such as a 52px wide `.method-icon` and text like "Keyboard shortcuts") to layout without severe wrapping (single word per line), text clipping, and vertical overflow.
   - For `.gesture-card`, the label text includes a long explanatory tag (e.g. `Swipe Right <em>· Right Half</em>` in HTML, or localized equivalents in `translations.js`). At `102px` total card width, this text overlaps and wraps across multiple lines, causing vertical stretching and clipping.
3. **No macOS System Settings Aesthetics**:
   - The desktop panels currently float in the middle of the screen as plain, borderless items on a generic background, with no structural borders, elevated shadow depth, or window titlebar widgets that would mimic a premium macOS System Settings layout.
4. **Lack of Layout Adaptation for Centered Slides**:
   - The `styles.css` media query hardcodes the single-column vertical stack (`grid-template-columns: 1fr`) and restricted max-width (`48vw`) for `#fancyzone` and `#analytics` even when they are centered (at progress 3 and 6 respectively). This results in squeezed layouts on large desktop viewports.

---

## 3. Caveats
- This investigation assumes that the viewport height can be low (e.g. 600px - 700px), requiring panels to dynamically fit in height. To handle this, we assume that adding scroll containment (`max-height: 85vh` with a customized thin scrollbar) is acceptable as a failsafe.
- We did not examine screen sizes below 900px since the breakpoint contract disables absolute positioning and reverts to standard vertical flow, which is out of scope.

---

## 4. Conclusion & Recommendations
To achieve the premium macOS settings look and resolve all card cramping and overflow on viewports >= 900px, the following changes are recommended:

### A. Recommendations for `styles.css`

1. **Implement macOS Settings Window Styling for Desktop Panels**:
   Style the active panel containers within `.story-slide` to resemble macOS system settings windows (translucent background, subtle borders, high-elevation shadow, rounded corners, and a simulated titlebar header):
   ```css
   @media (min-width: 900px) {
     .story-slide .hero-inner,
     .story-slide .section-inner,
     .story-slide .fancyzone-inner,
     .story-slide .analytics-inner,
     .story-slide .download-inner {
       background: rgba(246, 246, 246, 0.85); /* macOS Light Settings Background */
       border: 1px solid rgba(0, 0, 0, 0.12);
       border-radius: 16px;
       box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05);
       padding: 40px var(--space-l) var(--space-l); /* Top padding leaves space for dots */
       position: relative;
       max-height: 85vh; /* Prevent vertical clipping */
       overflow-y: auto; /* Fallback scroll */
       backdrop-filter: blur(20px);
       -webkit-backdrop-filter: blur(20px);
     }

     [data-theme="dark"] .story-slide .hero-inner,
     [data-theme="dark"] .story-slide .section-inner,
     [data-theme="dark"] .story-slide .fancyzone-inner,
     [data-theme="dark"] .story-slide .analytics-inner,
     [data-theme="dark"] .story-slide .download-inner {
       background: rgba(30, 30, 30, 0.85); /* macOS Dark Settings Background */
       border: 1px solid rgba(255, 255, 255, 0.08);
       box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
     }

     /* macOS style titlebar buttons (Red, Yellow, Green window control dots) via CSS */
     .story-slide .hero-inner::before,
     .story-slide .section-inner::before,
     .story-slide .fancyzone-inner::before,
     .story-slide .analytics-inner::before,
     .story-slide .download-inner::before {
       content: '';
       position: absolute;
       top: 14px;
       left: 16px;
       height: 12px;
       width: 52px;
       background-image: 
         radial-gradient(circle at 6px 6px, #ff5f56 5px, transparent 6px),
         radial-gradient(circle at 26px 6px, #ffbd2e 5px, transparent 6px),
         radial-gradient(circle at 46px 6px, #27c93f 5px, transparent 6px);
       background-size: 52px 12px;
       background-repeat: no-repeat;
       z-index: 10;
     }

     /* Elegant Custom Thin Scrollbar for macOS panels */
     .story-slide .hero-inner::-webkit-scrollbar,
     .story-slide .section-inner::-webkit-scrollbar,
     .story-slide .fancyzone-inner::-webkit-scrollbar,
     .story-slide .analytics-inner::-webkit-scrollbar,
     .story-slide .download-inner::-webkit-scrollbar {
       width: 6px;
     }
     .story-slide .hero-inner::-webkit-scrollbar-thumb,
     .story-slide .section-inner::-webkit-scrollbar-thumb,
     .story-slide .fancyzone-inner::-webkit-scrollbar-thumb,
     .story-slide .analytics-inner::-webkit-scrollbar-thumb,
     .story-slide .download-inner::-webkit-scrollbar-thumb {
       background: var(--ink-faint);
       border-radius: 3px;
     }
   }
   ```

2. **Optimize Gesture Cards (Gestures Panel)**:
   Hide the long `em` description tag on desktop split-screen viewports, and reduce icon/label spacing to fit perfectly inside `102px` columns:
   ```css
   @media (min-width: 900px) {
     .story-slide#gestures .gesture-label {
       padding: 6px 8px;
     }
     .story-slide#gestures .gesture-label em {
       display: none; /* Hide '· Right Half' on small desktop split screens */
     }
     .story-slide#gestures .gesture-icon {
       width: 18px;
       height: 18px;
       font-size: 0.8rem;
     }
     .story-slide#gestures .gestures-grid {
       gap: 6px;
     }
   }
   ```

3. **Optimize How-It-Works Cards**:
   Override card paddings, reduce header sizes, and scale the demo and icon elements to fit the narrow `132px` column size:
   ```css
   @media (min-width: 900px) {
     .story-slide#how-it-works .method-card {
       padding: var(--space-s); /* Reduce padding from large default */
     }
     .story-slide#how-it-works .method-icon {
       width: 36px;
       height: 36px;
       margin-bottom: 8px;
     }
     .story-slide#how-it-works .method-icon svg {
       width: 18px;
       height: 18px;
     }
     .story-slide#how-it-works .method-card h3 {
       font-size: 1rem;
       margin-bottom: 4px;
     }
     .story-slide#how-it-works .method-card p {
       font-size: 0.8rem;
       line-height: 1.4;
       margin-bottom: 8px;
     }
     .story-slide#how-it-works .method-demo {
       height: 60px; /* Reduce demo wrapper height */
     }
   }
   ```

4. **Responsive Layout for Centered vs Split-Screen Slides**:
   Introduce a CSS selector to expand the width and layout structure to 2-columns when `#fancyzone` and `#analytics` are centered (no horizontal translation):
   ```css
   @media (min-width: 900px) {
     /* CSS Hack: Match centered state when style has "--content-tx: 0vw" */
     .story-slide[style*="--content-tx: 0vw"] .fancyzone-inner,
     .story-slide[style*="--content-tx: -0vw"] .fancyzone-inner {
       max-width: min(85vw, 1160px);
       grid-template-columns: 1fr 1.5fr;
     }
     .story-slide[style*="--content-tx: 0vw"] .analytics-inner,
     .story-slide[style*="--content-tx: -0vw"] .analytics-inner {
       max-width: min(85vw, 1160px);
       grid-template-columns: 1.2fr 1fr;
     }

     /* Restore single-column layout when shifted side-by-side */
     .story-slide:not([style*="--content-tx: 0vw"]):not([style*="--content-tx: -0vw"]) .fancyzone-inner {
       max-width: min(48vw, 840px);
       grid-template-columns: 1fr;
     }
     .story-slide:not([style*="--content-tx: 0vw"]):not([style*="--content-tx: -0vw"]) .analytics-inner {
       max-width: min(48vw, 840px);
       grid-template-columns: 1fr;
     }
   }
   ```

### B. Recommendations for `index.html`
- No critical HTML edits are strictly required to fix the layout issues since CSS variables, selectors, and pseudo-elements can accomplish the visual redesign without changing the DOM.
- However, if the implementer prefers an explicit HTML tag for the macOS titlebar window buttons, we recommend inserting a `.window-titlebar` div at the top of each inner container:
  ```html
  <div class="macbook-window-titlebar" aria-hidden="true">
    <span class="window-dot red"></span>
    <span class="window-dot yellow"></span>
    <span class="window-dot green"></span>
  </div>
  ```

### C. Recommendations for `script.js` (Optional but Preferred)
If the pure CSS style-attribute selector is deemed too fragile, a minor modification to `script.js` can be recommended:
In the scroll animation update loop, apply state classes `.layout-centered` and `.layout-split` to the slides:
```javascript
if (conf.contentTx === 0) {
  slide.classList.add('layout-centered');
  slide.classList.remove('layout-split');
} else {
  slide.classList.add('layout-split');
  slide.classList.remove('layout-centered');
}
```
Then use `.layout-centered` and `.layout-split` classes in `styles.css` for clean column formatting.

---

## 5. Verification Method
1. **Visual Inspection**:
   - Check the layout on browser viewports starting from `900px` to `1200px`. Verify that the 8 gesture cards and 3 how-it-works cards sit cleanly inside their panels.
   - Verify that text labels like "Keyboard shortcuts" and localized descriptions do not wrap to single-character words, overlap, or clip.
   - Confirm that the macOS window dots (red/yellow/green) are visible at the top-left of each panel, with refined rounded corners and a premium shadow.
2. **Scroll Validation**:
   - Scroll slowly through the page at `900px` viewport width and verify that the panels slide in next to each other cleanly without overlapping.
   - Verify that when `#fancyzone` and `#analytics` are centered in the viewport, they stretch to 2-column layouts, and collapse back to single-columns when split-screen side-by-side.
