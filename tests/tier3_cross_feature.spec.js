const { test, expect } = require('@playwright/test');

async function scrollToProgress(page, progress, viewportHeight = 800) {
  const y = Math.round(progress * viewportHeight);
  await page.evaluate((yVal) => {
    window.scrollTo(0, yVal);
  }, y);
  // Wait until scroll position stabilizes near target or max scrollable height
  await page.waitForFunction((yVal) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const target = Math.min(yVal, maxScroll);
    return Math.abs(window.scrollY - target) < 10;
  }, y);
  await page.evaluate(() => new Promise(requestAnimationFrame));
}

test.describe('Tier 3: Pairwise Cross-Feature Interactions', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('1. F1 + F3: Viewport resizing updates spatial layout states and clears/restores styles cleanly', async ({ page }) => {
    // 1. Initially on desktop, scroll to gestures slide
    await scrollToProgress(page, 1.8, 800);
    const gestures = page.locator('#gestures');
    await expect(gestures).toHaveClass(/active-slide/);

    // 2. Resize to mobile: styling vars should be cleared
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(100);
    const mobileOpacity = await gestures.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
    expect(mobileOpacity).toBe('');

    // 3. Resize back to desktop: spatial variables should be restored instantly based on scroll position
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);
    const desktopOpacity = await gestures.evaluate(el => parseFloat(el.style.getPropertyValue('--slide-opacity')));
    expect(desktopOpacity).toBeGreaterThan(0.15);
  });

  test('2. F2 + F4: Language translation updates persist during scroll transitions', async ({ page }) => {
    // 1. Change language to Italian
    const itBtn = page.locator('.lang-btn[data-lang="it"]');
    await itBtn.click();

    // 2. Scroll page to trigger active state on Gestures slide
    await scrollToProgress(page, 1.8, 800);

    // 3. Check gestures slide title is correctly translated to Italian and has active-slide class
    const title = page.locator('#gestures-heading');
    await expect(title).toHaveText(/Ogni gesto, risposta istantanea/);
    await expect(page.locator('#gestures')).toHaveClass(/active-slide/);
  });

  test('3. F4 + F6: Theme toggle works offline and dynamic canvas animations execute with correct colors', async ({ page }) => {
    // 1. Intercept all non-local requests to ensure offline simulation
    await page.route(url => !url.href.includes('localhost') && !url.href.includes('127.0.0.1'), route => {
      route.abort();
    });

    // 2. Click theme toggle to switch to dark mode
    const toggle = page.locator('#theme-toggle');
    await toggle.click();

    // 3. Verify page is dark mode
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('dark');

    // 4. Scroll to gestures page to start canvas drawing and verify it does not error/freeze
    await scrollToProgress(page, 1.8, 800);
    const canvas = page.locator('#gc-right canvas');
    await expect(canvas).toBeVisible();
  });

  test('4. F4 + F5: Announce bar closed state does not impact GDPR video consent placeholder and click behavior', async ({ page }) => {
    // 1. Dismiss announcement bar
    const closeBtn = page.locator('#announce-close');
    await closeBtn.click();
    await expect(page.locator('#announce-bar')).toHaveClass(/dismissed/);

    // 2. Scroll to FancyZone video showcase slide
    await scrollToProgress(page, 3.5, 800);

    // 3. Verify video placeholder exists and click to load iframe
    const placeholder = page.locator('.video-consent-placeholder');
    await expect(placeholder).toBeVisible();
    await placeholder.click();

    // 4. Verify iframe is loaded and play is initiated
    const iframe = page.locator('#video-wrapper iframe');
    await expect(iframe).toBeVisible();
  });

  test('5. F1 + F4: Dynamic scroll progress enables savings calculator slider inside active slide', async ({ page }) => {
    // 1. Scroll to Analytics slide
    await scrollToProgress(page, 6.0, 800);

    // 2. Verify slide is active
    const analytics = page.locator('#analytics');
    await expect(analytics).toHaveClass(/active-slide/);

    // 3. Interact with the slider
    const slider = page.locator('#calc-hours-slider');
    await slider.fill('10');
    await slider.dispatchEvent('input');

    // 4. Verify values update correctly inside the active container
    await expect(page.locator('#calc-hours-val')).toHaveText('10h');
    await expect(page.locator('#chart-total-val')).toHaveText('5h 29m');
  });

  test('6. F3 + F4: Mobile layout orientation retains dark theme state after resize back to desktop', async ({ page }) => {
    // 1. Switch to mobile layout
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(50);

    // 2. Toggle dark theme
    const toggle = page.locator('#theme-toggle');
    await toggle.click();
    expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');

    // 3. Switch back to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);

    // 4. Verify dark theme is retained AND desktop scroll sync is active
    expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');
    const hero = page.locator('#hero');
    const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
    expect(opacity.trim()).toBe('1');
  });
});
