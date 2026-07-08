# Original User Request

## 2026-07-07T09:09:48Z

Overhaul and optimize the desktop storytelling scroll snap layout of the SnapZone website to ensure visual excellence, premium spacing, and flawless responsiveness.

Working directory: /Users/michele/Documents/SnapZone/SnapZoneWeb
Integrity mode: development

## Requirements

### R1. Spatial & Visual Layout Optimization
Redesign the split-screen panels and centered slides to resemble a premium macOS system settings window with generous breathing room. Adjust padding, margin, font sizes, and container widths so elements have comfort and elegance, avoiding dense or cramped grids.

### R2. Fade-based Non-overlapping Transitions
Orchestrate slide transitions using smooth fade-in/fade-out curves. Content cards and text inside shifting panels must fade out before they reach overlapping regions, avoiding collisions. 

### R3. Responsive Cleanliness
Ensure the layout shifts cleanly back to a standard, vertically flowing page on viewports narrower than 900px, with no residual storytelling classes or absolute positioning side-effects.

## Acceptance Criteria

### Visual & Layout Quality
- [ ] No element overlapping or collision during the scroll snap steps on viewports >= 900px.
- [ ] Elements in split-screen slides (such as the 8 gesture cards and 3 how-it-works cards) stack or size down cleanly to fit their respective half-panes without text clipping or horizontal page overflows.
- [ ] Transition animations utilize native ease-out curves (`cubic-bezier(0.2, 0.8, 0.2, 1)`) or similar, responding smoothly to scroll snapping.

### Technical Integrity
- [ ] Standard JavaScript syntax is preserved (all IIFEs close properly, zero parser errors).
- [ ] All third-party connections (like YouTube iframe) remain completely lazy-loaded until click consent is given.
- [ ] Zero external requests (no Google Fonts) are made on initial page load (strict self-hosted assets).
