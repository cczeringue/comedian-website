import { test, expect } from '@playwright/test';

test.describe('iOS layout smoke (Mobile WebKit)', () => {
    test('home: header, main, hero visible; --site-header-offset resolved', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#sticky-header')).toBeVisible();
        await expect(page.locator('main#main-content')).toBeVisible();
        await expect(page.locator('section.hero')).toBeVisible();

        await page.waitForFunction(() => {
            const raw = getComputedStyle(document.documentElement).getPropertyValue('--site-header-offset').trim();
            return raw.length > 0 && raw !== '0px';
        });
    });

    test('scroll: sticky header gains .scrolled after threshold', async ({ page }) => {
        await page.goto('/');
        const header = page.locator('#sticky-header');
        await expect(header).not.toHaveClass(/scrolled/);
        await page.evaluate(() => window.scrollTo(0, 120));
        await expect(header).toHaveClass(/scrolled/);
    });

    test('past hero: mobile bottom CTA becomes visible', async ({ page }) => {
        await page.goto('/');
        const cta = page.locator('#mobileStickyCta');
        await expect(cta).toBeHidden();

        const pastHeroY = await page.evaluate(() => {
            const el = document.querySelector('.hero');
            if (!el) return 900;
            const rect = el.getBoundingClientRect();
            return Math.ceil(window.scrollY + rect.bottom + 24);
        });
        await page.evaluate((y) => window.scrollTo(0, y), pastHeroY);
        await expect(cta).toHaveClass(/visible/);
        await expect(cta).toBeVisible();
    });

    test('in-page anchor: hero CTA scrolls #contact below header', async ({ page }) => {
        await page.goto('/');
        await page.locator('a.btn-hero-cta[href="#contact"]').first().click();
        const header = page.locator('#sticky-header');
        const contact = page.locator('#contact');
        await expect(contact).toBeVisible();
        const headerBox = await header.boundingBox();
        const contactBox = await contact.boundingBox();
        expect(headerBox).not.toBeNull();
        expect(contactBox).not.toBeNull();
        expect(contactBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 4);
    });

    test('mobile nav: hamburger opens slide-out menu', async ({ page }) => {
        await page.goto('/');
        const menu = page.locator('#navMenu');
        const hamburger = page.locator('#hamburger');
        await expect(menu).not.toHaveClass(/active/);
        await hamburger.click();
        await expect(menu).toHaveClass(/active/);
        await page.locator('#navMenu a[href="#contact"]').first().click();
        await expect(menu).not.toHaveClass(/active/);
    });

    test('sticky CTA visible: body reserves bottom padding (no content trapped)', async ({ page }) => {
        await page.goto('/');
        const pastHeroY = await page.evaluate(() => {
            const el = document.querySelector('.hero');
            if (!el) return 900;
            const rect = el.getBoundingClientRect();
            return Math.ceil(window.scrollY + rect.bottom + 40);
        });
        await page.evaluate((y) => window.scrollTo(0, y), pastHeroY);
        await expect(page.locator('#mobileStickyCta')).toHaveClass(/visible/);

        const paddingBottomPx = await page.evaluate(() => {
            const pad = getComputedStyle(document.body).paddingBottom;
            const m = /^([\d.]+)px$/.exec(pad);
            return m ? parseFloat(m[1]) : 0;
        });
        expect(paddingBottomPx).toBeGreaterThan(32);
    });

    test('viewport meta supports safe-area (viewport-fit=cover)', async ({ page }) => {
        await page.goto('/');
        const content = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(content?.toLowerCase()).toContain('viewport-fit=cover');
    });

    test('hero pulls under header offset (no dead band regression)', async ({ page }) => {
        await page.goto('/');
        const { marginTop, offset } = await page.evaluate(() => {
            const hero = document.querySelector('main#main-content > section.hero:first-of-type');
            const off = getComputedStyle(document.documentElement).getPropertyValue('--site-header-offset').trim();
            if (!hero) return { marginTop: '0', offset: off };
            return { marginTop: getComputedStyle(hero).marginTop, offset: off };
        });
        expect(offset).toMatch(/px$/);
        expect(marginTop).not.toBe('0px');
        expect(marginTop.startsWith('-')).toBe(true);
    });
});
