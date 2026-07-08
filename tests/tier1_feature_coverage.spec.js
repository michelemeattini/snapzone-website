const { test, expect } = require('@playwright/test');

async function scrollToProgress(page, progress, viewportHeight = 800) {
  const y = Math.round(progress * viewportHeight);
  await page.evaluate((yVal) => {
    window.scrollTo(0, yVal);
  }, y);
  await page.waitForFunction((yVal) => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const target = Math.min(yVal, maxScroll);
    return Math.abs(window.scrollY - target) < 10;
  }, y);
  await page.evaluate(() => new Promise(requestAnimationFrame));
}

test.describe('Tier 1: Feature Coverage (F1-F6)', () => {
  
  // ----------------------------------------------------------------
  // F1: Spatial & Visual Layout (Tests 1-5)
  // ----------------------------------------------------------------
  test.describe('F1: Spatial & Visual Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
    });

    test('1. Sticky container and triggers exist in DOM', async ({ page }) => {
      const container = page.locator('#story-container');
      await expect(container).toBeVisible();

      const sticky = page.locator('#story-sticky');
      await expect(sticky).toBeVisible();

      const triggers = page.locator('.story-trigger');
      await expect(triggers).toHaveCount(9);
    });

    test('2. All story slide sections exist in DOM', async ({ page }) => {
      const slides = ['#hero', '#gestures', '#fancyzone', '#how-it-works', '#analytics', '#pricing', '#download'];
      for (const id of slides) {
        await expect(page.locator(id)).toBeAttached();
      }
    });

    test('3. Initial properties of hero slide at scroll 0', async ({ page }) => {
      const hero = page.locator('#hero');
      const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      const tx = await hero.evaluate(el => el.style.getPropertyValue('--slide-tx'));
      
      expect(opacity.trim()).toBe('1');
      expect(tx.trim()).toBe('0vw');
    });

    test('4. Initial properties of inactive gestures slide at scroll 0', async ({ page }) => {
      const gestures = page.locator('#gestures');
      const opacity = await gestures.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      const tx = await gestures.evaluate(el => el.style.getPropertyValue('--slide-tx'));
      
      expect(opacity.trim()).toBe('0');
      expect(tx.trim()).toBe('100vw');
    });

    test('5. Scroll hint is visible on initial load', async ({ page }) => {
      const hint = page.locator('.hero-scroll-hint');
      await expect(hint).toBeVisible();
    });
  });

  // ----------------------------------------------------------------
  // F2: Fade-based Transitions (Tests 6-10)
  // ----------------------------------------------------------------
  test.describe('F2: Fade-based Transitions', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
    });

    test('6. Slide opacity transitions on scroll', async ({ page }) => {
      const gestures = page.locator('#gestures');
      
      await scrollToProgress(page, 1.5, 800);

      const opacity = await gestures.evaluate(el => parseFloat(el.style.getPropertyValue('--slide-opacity')));
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1.01);
    });

    test('7. Hero slide fades out and translates out on scrolling down', async ({ page }) => {
      const hero = page.locator('#hero');

      await scrollToProgress(page, 3.0, 800);

      const opacity = await hero.evaluate(el => parseFloat(el.style.getPropertyValue('--slide-opacity')));
      const tx = await hero.evaluate(el => el.style.getPropertyValue('--slide-tx'));

      expect(opacity).toBe(0);
      expect(tx.trim()).toBe('-100vw');
    });

    test('8. Active slide class assignment based on opacity', async ({ page }) => {
      const gestures = page.locator('#gestures');
      
      await expect(gestures).not.toHaveClass(/active-slide/);

      await scrollToProgress(page, 1.8, 800);

      await expect(gestures).toHaveClass(/active-slide/);
    });

    test('9. Slide custom transitions properties are verified', async ({ page }) => {
      const slide = page.locator('.story-slide').first();
      const transition = await slide.evaluate(el => getComputedStyle(el).transition);
      expect(transition).toContain('opacity');
      expect(transition).toContain('transform');
    });

    test('10. Slide split-screen translations at progress 2.0', async ({ page }) => {
      await scrollToProgress(page, 2.0, 800);

      const hero = page.locator('#hero');
      const gestures = page.locator('#gestures');

      const heroTx = await hero.evaluate(el => el.style.getPropertyValue('--slide-tx'));
      const gesturesTx = await gestures.evaluate(el => el.style.getPropertyValue('--slide-tx'));

      expect(heroTx.trim()).toBe('0vw');
      expect(gesturesTx.trim()).toBe('0vw');
    });
  });

  // ----------------------------------------------------------------
  // F3: Responsive Cleanliness (Tests 11-15)
  // ----------------------------------------------------------------
  test.describe('F3: Responsive Cleanliness', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
    });

    test('11. Mobile viewport does not have storytelling slide inline variables', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(100);

      const hero = page.locator('#hero');
      const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      const tx = await hero.evaluate(el => el.style.getPropertyValue('--slide-tx'));

      expect(opacity).toBe('');
      expect(tx).toBe('');
    });

    test('12. Mobile scroll does not set inline CSS variables', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 });
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(100);

      const gestures = page.locator('#gestures');
      const opacity = await gestures.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      expect(opacity).toBe('');
    });

    test('13. Mobile viewport removes active-slide class', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(100);

      const slides = page.locator('.story-slide');
      const count = await slides.count();
      for (let i = 0; i < count; i++) {
        await expect(slides.nth(i)).not.toHaveClass(/active-slide/);
      }
    });

    test('14. Mobile viewport yields vertical flow coordinates', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(100);

      const heroBox = await page.locator('#hero').boundingBox();
      const gesturesBox = await page.locator('#gestures').boundingBox();

      expect(gesturesBox.y).toBeGreaterThan(heroBox.y + 100);
    });

    test('15. Resizing back to desktop restores scroll layout properties', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(100);

      await page.setViewportSize({ width: 1200, height: 800 });
      await scrollToProgress(page, 0, 800);

      const hero = page.locator('#hero');
      const opacity = await hero.evaluate(el => el.style.getPropertyValue('--slide-opacity'));
      expect(opacity.trim()).toBe('1');
    });
  });

  // ----------------------------------------------------------------
  // F4: Interactive User Widgets (Tests 16-20)
  // ----------------------------------------------------------------
  test.describe('F4: Interactive User Widgets', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
    });

    test('16. Language translation change to Italian', async ({ page }) => {
      const itButton = page.locator('.lang-btn[data-lang="it"]');
      await itButton.click();

      const headline = page.locator('#gestures-heading');
      await expect(headline).toHaveText(/Ogni gesto, risposta istantanea/);

      const langAttr = await page.locator('html').getAttribute('lang');
      expect(langAttr).toBe('it');
    });

    test('17. Language selection is saved to localStorage', async ({ page }) => {
      const itButton = page.locator('.lang-btn[data-lang="it"]');
      await itButton.click();

      const savedLang = await page.evaluate(() => localStorage.getItem('sz-lang'));
      expect(savedLang).toBe('it');
    });

    test('18. Theme toggle switches dark/light mode', async ({ page }) => {
      const toggle = page.locator('#theme-toggle');
      await toggle.click();

      const theme = await page.locator('html').getAttribute('data-theme');
      expect(theme).toBe('dark');

      await toggle.click();
      const themeLight = await page.locator('html').getAttribute('data-theme');
      expect(themeLight).toBe('light');
    });

    test('19. Theme setting is persisted in localStorage', async ({ page }) => {
      const toggle = page.locator('#theme-toggle');
      await toggle.click();

      const savedTheme = await page.evaluate(() => localStorage.getItem('sz-theme'));
      expect(savedTheme).toBe('dark');
    });

    test('20. Announce bar dismiss closes bar and saves to sessionStorage', async ({ page }) => {
      const announceBar = page.locator('#announce-bar');
      await expect(announceBar).toBeVisible();

      const closeButton = page.locator('#announce-close');
      await closeButton.click();

      await expect(announceBar).toHaveClass(/dismissed/);
      const dismissed = await page.evaluate(() => sessionStorage.getItem('sz-announce-dismissed'));
      expect(dismissed).toBe('1');
    });
  });

  // ----------------------------------------------------------------
  // F5: GDPR Lazy Video Consent (Tests 21-25)
  // ----------------------------------------------------------------
  test.describe('F5: GDPR Lazy Video Consent', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/');
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; scroll-snap-type: none !important; }' });
      await scrollToProgress(page, 3.5, 800);
    });

    test('21. Video placeholder is present in the DOM', async ({ page }) => {
      const placeholder = page.locator('.video-consent-placeholder');
      await expect(placeholder).toBeVisible();
    });

    test('22. No iframe loaded on initial page load', async ({ page }) => {
      const iframe = page.locator('#video-wrapper iframe');
      await expect(iframe).toHaveCount(0);
    });

    test('23. Play button exists inside video placeholder', async ({ page }) => {
      const playBtn = page.locator('.video-play-btn');
      await expect(playBtn).toBeVisible();
    });

    test('24. Clicking placeholder lazy loads the video iframe', async ({ page }) => {
      const wrapper = page.locator('#video-wrapper');
      await wrapper.click();

      const iframe = page.locator('#video-wrapper iframe');
      await expect(iframe).toBeVisible();
    });

    test('25. Lazy loaded video uses no-cookie YouTube domain', async ({ page }) => {
      const wrapper = page.locator('#video-wrapper');
      await wrapper.click();

      const iframe = page.locator('#video-wrapper iframe');
      const src = await iframe.getAttribute('src');
      expect(src).toContain('https://www.youtube-nocookie.com/embed/');
    });
  });

  // ----------------------------------------------------------------
  // F6: Strict Asset Self-Hosting (Tests 26-30)
  // ----------------------------------------------------------------
  test.describe('F6: Strict Asset Self-Hosting', () => {
    test('26. Local stylesheet and script links check', async ({ page }) => {
      await page.goto('/');

      const cssLink = page.locator('link[rel="stylesheet"]');
      const cssHref = await cssLink.getAttribute('href');
      expect(cssHref).toBe('styles.css');

      const scriptTags = page.locator('script[src]');
      const srcs = await scriptTags.evaluateAll(tags => tags.map(t => t.getAttribute('src')));
      expect(srcs).toContain('script.js');
      expect(srcs).toContain('translations.js');
    });

    test('27. Logo assets load from local directories', async ({ page }) => {
      await page.goto('/');
      
      const logoPng = page.locator('link[rel="alternate icon"]');
      const logoPngHref = await logoPng.getAttribute('href');
      expect(logoPngHref).toBe('assets/logo.png');

      const logoSvg = page.locator('link[rel="icon"]');
      const logoSvgHref = await logoSvg.getAttribute('href');
      expect(logoSvgHref).toBe('assets/logo.svg');
    });

    test('28. No external font requests check', async ({ page }) => {
      const externalRequests = [];
      await page.route('**/*', route => {
        const url = route.request().url();
        if (url.includes('fonts.googleapis') || url.includes('gstatic') || url.includes('use.typekit')) {
          externalRequests.push(url);
        }
        route.continue();
      });

      await page.goto('/');
      expect(externalRequests.length).toBe(0);
    });

    test('29. Intercept initial load to verify no third-party API calls', async ({ page }) => {
      const thirdPartyHosts = [];
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname !== 'localhost' && !url.hostname.includes('127.0.0.1')) {
          thirdPartyHosts.push(url.hostname);
        }
        route.continue();
      });

      await page.goto('/');
      expect(thirdPartyHosts.length).toBe(0);
    });

    test('30. Favicon elements reference local assets', async ({ page }) => {
      await page.goto('/');
      const favicon = page.locator('link[rel="icon"]');
      await expect(favicon).toBeAttached();
      const href = await favicon.getAttribute('href');
      expect(href).toBe('assets/logo.svg');
    });
  });
});
