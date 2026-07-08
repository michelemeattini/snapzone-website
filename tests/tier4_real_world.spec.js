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

test.describe('Tier 4: Real-World Application Scenarios', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
  });

  test('1. Scroll-through storytelling tour (F1, F2, F3)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Step 1: Start at top (Hero)
    const hero = page.locator('#hero');
    await expect(hero).toHaveClass(/active-slide/);

    // Step 2: Scroll to Gestures
    await scrollToProgress(page, 1.8, 800);
    const gestures = page.locator('#gestures');
    await expect(gestures).toHaveClass(/active-slide/);
    await expect(hero).not.toHaveClass(/active-slide/);

    // Step 3: Scroll to FancyZone
    await scrollToProgress(page, 3.5, 800);
    const fancyzone = page.locator('#fancyzone');
    await expect(fancyzone).toHaveClass(/active-slide/);

    // Step 4: Shrink viewport to mobile
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(100);

    // Step 5: Verify storytelling class residue is removed and slides stack vertically
    await expect(fancyzone).not.toHaveClass(/active-slide/);
    const heroBox = await hero.boundingBox();
    const gesturesBox = await gestures.boundingBox();
    expect(gesturesBox.y).toBeGreaterThan(heroBox.y + 100);
  });

  test('2. Multi-language dark-mode user setup (F4, F6)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Step 1: Toggle dark mode
    const themeBtn = page.locator('#theme-toggle');
    await themeBtn.click();
    expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');

    // Step 2: Switch language to IT
    const itBtn = page.locator('.lang-btn[data-lang="it"]');
    await itBtn.click();

    // Step 3: Verify Italian translation exists in the navbar link
    const navPricing = page.locator('#navbar .nav-links a[href="#pricing"]');
    await expect(navPricing).toHaveText('Prezzi');

    // Step 4: Reload page and verify state persistence
    await page.reload();
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
    await page.waitForTimeout(100);

    expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');
    expect(await page.locator('html').getAttribute('lang')).toBe('it');
    await expect(page.locator('#navbar .nav-links a[href="#pricing"]')).toHaveText('Prezzi');
  });

  test('3. Currency pricing comparison & simulator (F4)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Step 1: Scroll to pricing (progress 8.0)
    await scrollToProgress(page, 8.0, 800);

    // Step 2: Verify default pricing is in USD
    const amount = page.locator('#pricing-pro .pricing-amount');
    await expect(amount).toHaveText('$21.99');

    // Step 3: Change currency to EUR
    const eurBtn = page.locator('#btn-eur');
    await eurBtn.click();
    await expect(amount).toHaveText('€20.99');

    // Step 4: Detach Macbook Pro device slot
    const mbpSlot = page.locator('#pd1');
    await expect(mbpSlot).toHaveClass(/pd-occupied/);
    await mbpSlot.locator('.pd-detach').click();
    await page.waitForTimeout(250); // wait for fade animation

    // Step 5: Verify slot is empty and re-add a Mac
    await expect(mbpSlot).toHaveClass(/pd-empty/);
    await mbpSlot.click();
    await page.waitForTimeout(250);
    await expect(mbpSlot).toHaveClass(/pd-occupied/);
  });

  test('4. Fully interactive walkthrough with video (F4, F5, F6)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Step 1: Scroll to video showcase (progress 3.5)
    await scrollToProgress(page, 3.5, 800);

    // Step 2: Verify only consent placeholder is present, no iframe loaded
    const placeholder = page.locator('.video-consent-placeholder');
    await expect(placeholder).toBeVisible();
    await expect(page.locator('#video-wrapper iframe')).toHaveCount(0);

    // Step 3: Click to play & accept terms
    await placeholder.click();
    await page.waitForTimeout(100);

    // Step 4: Verify iframe loads with nocookie URL
    const iframe = page.locator('#video-wrapper iframe');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('https://www.youtube-nocookie.com/embed/ey1Futp5330');
  });

  test('5. Desktop-to-mobile viewport resizing flow (F1, F2, F3, F4)', async ({ page }) => {
    // Step 1: Desktop mode
    await page.setViewportSize({ width: 1200, height: 800 });
    await scrollToProgress(page, 1.8, 800);

    // Step 2: Toggle dark mode
    await page.locator('#theme-toggle').click();

    // Step 3: Resize to mobile (800px)
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(100);

    // Step 4: Verify absolute positioning and custom variables are stripped
    const hero = page.locator('#hero');
    const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
    expect(opacity).toBe('');
    await expect(hero).not.toHaveClass(/active-slide/);

    // Step 5: Resize back to desktop (1200px)
    await page.setViewportSize({ width: 1200, height: 800 });
    await scrollToProgress(page, 0, 800);

    // Step 6: Verify storytelling scroll sync restores slide vars
    const opacityRestored = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
    expect(opacityRestored.trim()).toBe('1');
  });
});
