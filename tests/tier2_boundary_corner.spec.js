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

test.describe('Tier 2: Boundary & Corner Cases (F1-F6)', () => {

  // ----------------------------------------------------------------
  // F1: Spatial & Visual Layout (Tests 1-5)
  // ----------------------------------------------------------------
  test.describe('F1: Spatial & Visual Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
      await page.setViewportSize({ width: 1200, height: 800 });
    });

    test('1. Scroll at negative coordinates clips progress at 0.0', async ({ page }) => {
      await page.evaluate(() => window.scrollTo(0, -500));
      await page.waitForTimeout(100);

      const hero = page.locator('#hero');
      const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      const tx = await hero.evaluate(el => el.style.getPropertyValue('--slide-tx'));

      expect(opacity.trim()).toBe('1');
      expect(tx.trim()).toBe('0vw');
    });

    test('2. Scroll way past bottom clips progress at 9.0', async ({ page }) => {
      await scrollToProgress(page, 9.0, 800);

      const download = page.locator('#download');
      const opacity = await download.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      const tx = await download.evaluate(el => el.style.getPropertyValue('--slide-tx'));

      expect(opacity.trim()).toBe('1');
      expect(tx.trim()).toBe('0vw');
    });

    test('3. Intermediate scroll snap boundary calculations', async ({ page }) => {
      await scrollToProgress(page, 3.0, 800);

      const gestures = page.locator('#gestures');
      const opacity = await gestures.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      expect(opacity.trim()).toBe('0');
    });

    test('4. Active slide boundary threshold toggle', async ({ page }) => {
      // Scroll to progress 1.14. Opacity of gestures should be 0.14 <= 0.15. Inactive.
      await scrollToProgress(page, 1.14, 800);
      await expect(page.locator('#gestures')).not.toHaveClass(/active-slide/);

      // Scroll to progress 1.16. Opacity of gestures should be 0.16 > 0.15. Active.
      await scrollToProgress(page, 1.16, 800);
      await expect(page.locator('#gestures')).toHaveClass(/active-slide/);
    });

    test('5. Bounding box coordinates at split-screen layout mode', async ({ page }) => {
      await scrollToProgress(page, 2.0, 800);

      const heroBox = await page.locator('#hero').boundingBox();
      const gesturesBox = await page.locator('#gestures').boundingBox();

      expect(Math.abs(heroBox.y - gesturesBox.y)).toBeLessThan(5);
      expect(heroBox.x).not.toBe(gesturesBox.x);
    });
  });

  // ----------------------------------------------------------------
  // F2: Fade-based Transitions (Tests 6-10)
  // ----------------------------------------------------------------
  test.describe('F2: Fade-based Transitions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
      await page.setViewportSize({ width: 1200, height: 800 });
    });

    test('6. Transition collision prevention: at most 2 active slides simultaneously', async ({ page }) => {
      const scrollPoints = [0.5, 1.5, 2.2, 3.0, 4.0, 5.5, 7.0, 8.5];
      for (const progress of scrollPoints) {
        await scrollToProgress(page, progress, 800);
        
        const activeCount = await page.locator('.story-slide.active-slide').count();
        expect(activeCount).toBeLessThanOrEqual(2);
      }
    });

    test('7. Extreme scroll speed transition recovery', async ({ page }) => {
      await scrollToProgress(page, 9.0, 800);

      const download = page.locator('#download');
      await expect(download).toHaveClass(/active-slide/);
      
      const hero = page.locator('#hero');
      await expect(hero).not.toHaveClass(/active-slide/);
    });

    test('8. Scroll snap alignment properties exist', async ({ page }) => {
      const triggers = page.locator('.story-trigger');
      const snapAlign = await triggers.first().evaluate(el => getComputedStyle(el).scrollSnapAlign);
      expect(snapAlign).toBe('start');
    });

    test('9. Early slides fully hidden at deep progress', async ({ page }) => {
      await scrollToProgress(page, 6.0, 800);

      const heroOpacity = await page.locator('#hero').evaluate(el => parseFloat(el.style.getPropertyValue('--slide-opacity')));
      const gesturesOpacity = await page.locator('#gestures').evaluate(el => parseFloat(el.style.getPropertyValue('--slide-opacity')));
      
      expect(heroOpacity).toBe(0);
      expect(gesturesOpacity).toBe(0);
    });

    test('10. Reverse scroll transitions restore opacity and class states', async ({ page }) => {
      await scrollToProgress(page, 6.0, 800);
      await scrollToProgress(page, 0, 800);

      const hero = page.locator('#hero');
      await expect(hero).toHaveClass(/active-slide/);
      
      const opacity = await hero.evaluate(el => parseFloat(el.style.getPropertyValue('--slide-opacity')));
      expect(opacity).toBe(1);
    });
  });

  // ----------------------------------------------------------------
  // F3: Responsive Cleanliness (Tests 11-15)
  // ----------------------------------------------------------------
  test.describe('F3: Responsive Cleanliness', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
    });

    test('11. Viewport width exactly 899px does not trigger scroll snap styles', async ({ page }) => {
      await page.setViewportSize({ width: 899, height: 800 });
      await page.waitForTimeout(100);

      const hero = page.locator('#hero');
      const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      expect(opacity).toBe('');
    });

    test('12. Viewport width exactly 900px triggers scroll snap styles', async ({ page }) => {
      await page.setViewportSize({ width: 900, height: 800 });
      await page.waitForTimeout(100);

      const hero = page.locator('#hero');
      const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      expect(opacity.trim()).toBe('1');
    });

    test('13. Rapid resize oscillation maintains clean state', async ({ page }) => {
      for (let i = 0; i < 3; i++) {
        await page.setViewportSize({ width: 800, height: 600 });
        await page.waitForTimeout(50);
        await page.setViewportSize({ width: 1000, height: 800 });
        await page.waitForTimeout(50);
      }
      
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(50);

      const hero = page.locator('#hero');
      const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      expect(opacity).toBe('');
    });

    test('14. Mobile layout fits vertical bounds on short screen', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 300 });
      await page.waitForTimeout(100);

      const heroBox = await page.locator('#hero').boundingBox();
      expect(heroBox.height).toBeGreaterThan(0);
    });

    test('15. Desktop high viewport does not break sticky scroll height boundaries', async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1600 });
      await scrollToProgress(page, 0, 1600);

      const hero = page.locator('#hero');
      const opacity = await hero.evaluate(el => parseFloat(el.style.getPropertyValue('--slide-opacity')));
      expect(opacity).toBe(1);
    });
  });

  // ----------------------------------------------------------------
  // F4: Interactive User Widgets (Tests 16-20)
  // ----------------------------------------------------------------
  test.describe('F4: Interactive User Widgets', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
      await page.setViewportSize({ width: 1200, height: 800 });
    });

    test('16. Savings calculator minimum bounds input (2h)', async ({ page }) => {
      await scrollToProgress(page, 6.0, 800);
      const slider = page.locator('#calc-hours-slider');
      await slider.fill('2');
      await slider.dispatchEvent('input');

      const hoursVal = page.locator('#calc-hours-val');
      await expect(hoursVal).toHaveText('2h');

      const totalVal = page.locator('#chart-total-val');
      await expect(totalVal).toHaveText('1h 6m');
    });

    test('17. Savings calculator maximum bounds input (12h)', async ({ page }) => {
      await scrollToProgress(page, 6.0, 800);
      const slider = page.locator('#calc-hours-slider');
      await slider.fill('12');
      await slider.dispatchEvent('input');

      const hoursVal = page.locator('#calc-hours-val');
      await expect(hoursVal).toHaveText('12h');

      const totalVal = page.locator('#chart-total-val');
      await expect(totalVal).toHaveText('6h 35m');
    });

    test('18. Disclaimer popup stays visible if clicked inside, closes on outside click', async ({ page }) => {
      await scrollToProgress(page, 6.0, 800);
      const infoBtn = page.locator('#info-btn');
      await infoBtn.click();

      const popup = page.locator('#info-disclaimer-card');
      await expect(popup).toHaveClass(/visible/);

      await popup.click();
      await expect(popup).toHaveClass(/visible/);

      await page.locator('#analytics-heading').click();
      await expect(popup).not.toHaveClass(/visible/);
    });

    test('19. Currency toggle switches all price displays accurately', async ({ page }) => {
      await scrollToProgress(page, 8.0, 800);
      const eurBtn = page.locator('#btn-eur');
      await eurBtn.click();

      const priceAmount = page.locator('#pricing-pro .pricing-amount');
      await expect(priceAmount).toHaveText('€20.99');

      const usdBtn = page.locator('#btn-usd');
      await usdBtn.click();
      await expect(priceAmount).toHaveText('$21.99');
    });

    test('20. Detachment slots boundary conditions', async ({ page }) => {
      await scrollToProgress(page, 8.0, 800);
      await page.locator('#pd1 .pd-detach').click();
      await page.waitForTimeout(250);
      await page.locator('#pd2 .pd-detach').click();
      await page.waitForTimeout(250);

      const emptySlots = page.locator('.pd-slots .pd-empty');
      await expect(emptySlots).toHaveCount(3);

      await emptySlots.first().click();
      await page.waitForTimeout(250);

      const occupiedSlots = page.locator('.pd-slots .pd-occupied');
      await expect(occupiedSlots).toHaveCount(1);
    });
  });

  // ----------------------------------------------------------------
  // F5: GDPR Lazy Video Consent (Tests 21-25)
  // ----------------------------------------------------------------
  test.describe('F5: GDPR Lazy Video Consent', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
      await page.setViewportSize({ width: 1200, height: 800 });
      await scrollToProgress(page, 3.5, 800);
    });

    test('21. Play icon SVG click lazy loads the video iframe', async ({ page }) => {
      const playIcon = page.locator('.video-play-btn svg');
      await playIcon.click();

      const iframe = page.locator('#video-wrapper iframe');
      await expect(iframe).toBeVisible();
    });

    test('22. Multiple rapid clicks do not create multiple iframe tags', async ({ page }) => {
      const wrapper = page.locator('#video-wrapper');
      await wrapper.click();
      await wrapper.click();
      await wrapper.click();

      const iframes = page.locator('#video-wrapper iframe');
      await expect(iframes).toHaveCount(1);
    });

    test('23. Loaded video iframe scales to parent dimensions', async ({ page }) => {
      const wrapper = page.locator('#video-wrapper');
      await wrapper.click();

      const iframe = page.locator('#video-wrapper iframe');
      const width = await iframe.getAttribute('width');
      const height = await iframe.getAttribute('height');

      expect(width).toBe('100%');
      expect(height).toBe('100%');
    });

    test('24. Reloading resets consent/lazy load state', async ({ page }) => {
      const wrapper = page.locator('#video-wrapper');
      await wrapper.click();
      
      await page.reload();
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
      await scrollToProgress(page, 3.5, 800);
      
      const iframe = page.locator('#video-wrapper iframe');
      await expect(iframe).toHaveCount(0);
      
      const placeholder = page.locator('.video-consent-placeholder');
      await expect(placeholder).toBeVisible();
    });

    test('25. Zero connections to youtube-nocookie.com before consent action', async ({ page }) => {
      const youtubeRequests = [];
      await page.route('**/*', route => {
        const url = route.request().url();
        if (url.includes('youtube')) {
          youtubeRequests.push(url);
        }
        route.continue();
      });

      await page.goto('/');
      await page.waitForTimeout(500);
      expect(youtubeRequests.length).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  // F6: Strict Asset Self-Hosting (Tests 26-30)
  // ----------------------------------------------------------------
  test.describe('F6: Strict Asset Self-Hosting', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
    });

    test('26. Font family declarations are strictly self-hosted in css', async ({ page }) => {
      const stylesContent = await page.evaluate(async () => {
        const res = await fetch('styles.css');
        return await res.text();
      });
      expect(stylesContent).not.toContain('fonts.googleapis.com');
    });

    test('27. Asset paths in HTML use exact relative local structures', async ({ page }) => {
      const images = page.locator('img');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const src = await images.nth(i).getAttribute('src');
        expect(src).not.toContain('http://');
        expect(src).not.toContain('https://');
        expect(src).not.toContain('//');
      }
    });

    test('28. No external script downloads requested in page head', async ({ page }) => {
      const scripts = page.locator('head script');
      const count = await scripts.count();
      for (let i = 0; i < count; i++) {
        const src = await scripts.nth(i).getAttribute('src');
        if (src) {
          expect(src).not.toContain('http://');
          expect(src).not.toContain('https://');
        }
      }
    });

    test('29. Intercept and block non-local resources to check design stability', async ({ page }) => {
      await page.route(url => !url.href.includes('localhost') && !url.href.includes('127.0.0.1'), route => {
        route.abort();
      });
      await page.goto('/');
      
      const headline = page.locator('#hero-headline');
      await expect(headline).toBeVisible();
    });

    test('30. Favicon logo assets are present and loadable locally', async ({ page }) => {
      const response = await page.request.get('assets/logo.svg');
      expect(response.status()).toBe(200);
      
      const responsePng = await page.request.get('assets/logo.png');
      expect(responsePng.status()).toBe(200);
    });
  });
});
