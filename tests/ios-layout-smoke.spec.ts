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
        await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
        await hamburger.click();
        await expect(menu).toHaveClass(/active/);
        await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
        await page.locator('#navMenu a[href="#contact"]').first().click();
        await expect(menu).not.toHaveClass(/active/);
        await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    test('sticky CTA visible: footer reserves space without trailing document gap', async ({ page }) => {
        await page.goto('/');
        const pastHeroY = await page.evaluate(() => {
            const el = document.querySelector('.hero');
            if (!el) return 900;
            const rect = el.getBoundingClientRect();
            return Math.ceil(window.scrollY + rect.bottom + 40);
        });
        await page.evaluate((y) => window.scrollTo(0, y), pastHeroY);
        await expect(page.locator('#mobileStickyCta')).toHaveClass(/visible/);

        const { footerPaddingBottom, trailingGap } = await page.evaluate(() => {
            const footer = document.querySelector('.site-footer') as HTMLElement | null;
            if (!footer) return { footerPaddingBottom: 0, trailingGap: 999 };
            const footerEnd = footer.offsetTop + footer.offsetHeight;
            const scrollHeight = document.scrollingElement?.scrollHeight || document.documentElement.scrollHeight;
            const pad = getComputedStyle(footer).paddingBottom;
            const match = /^([\d.]+)px$/.exec(pad);
            return {
                footerPaddingBottom: match ? parseFloat(match[1]) : 0,
                trailingGap: Math.abs(scrollHeight - footerEnd),
            };
        });
        expect(footerPaddingBottom).toBeGreaterThan(96);
        expect(trailingGap).toBeLessThanOrEqual(2);
    });

    test('viewport meta supports safe-area (viewport-fit=cover)', async ({ page }) => {
        await page.goto('/');
        const content = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(content?.toLowerCase()).toContain('viewport-fit=cover');
    });

    test('hero pulls under header offset (no dead band regression)', async ({ page }) => {
        await page.goto('/');
        const { marginTop, offset, headerTop, headerBottom, heroTop } = await page.evaluate(() => {
            const header = document.querySelector('#sticky-header');
            const hero = document.querySelector('main#main-content > section.hero:first-of-type');
            const off = getComputedStyle(document.documentElement).getPropertyValue('--site-header-offset').trim();
            if (!hero || !header) return { marginTop: '0', offset: off, headerTop: 999, headerBottom: 0, heroTop: 999 };
            const headerRect = header.getBoundingClientRect();
            const heroRect = hero.getBoundingClientRect();
            return {
                marginTop: getComputedStyle(hero).marginTop,
                offset: off,
                headerTop: headerRect.top,
                headerBottom: headerRect.bottom,
                heroTop: heroRect.top,
            };
        });
        expect(offset).toMatch(/px$/);
        expect(marginTop).not.toBe('0px');
        expect(marginTop.startsWith('-')).toBe(true);
        expect(headerTop).toBe(0);
        expect(heroTop).toBeLessThanOrEqual(headerBottom + 1);
    });

    test('homepage local hero and logo images load', async ({ page }) => {
        await page.goto('/');
        const broken = await page.evaluate(() => {
            const srcs = [...document.querySelectorAll<HTMLImageElement>('img[src^="logos/"], .hero-photo img, .project-feature img[src^="drillmaster-card"]')]
                .map((img) => img.getAttribute('src'))
                .filter(Boolean) as string[];
            return Promise.all(srcs.map(async (src) => {
                const res = await fetch(src);
                return res.ok ? null : src;
            })).then((results) => results.filter(Boolean));
        });
        expect(broken).toEqual([]);
    });

    test('links page local hero, logos, and cards load', async ({ page }) => {
        await page.goto('/links.html');
        const broken = await page.evaluate(() => {
            const srcs = [...document.querySelectorAll<HTMLImageElement>('img')].filter((img) => {
                const src = img.getAttribute('src') || '';
                return src && !src.startsWith('http');
            }).map((img) => img.getAttribute('src')).filter(Boolean) as string[];
            return Promise.all(srcs.map(async (src) => {
                const res = await fetch(src);
                return res.ok ? null : src;
            })).then((results) => results.filter(Boolean));
        });
        expect(broken).toEqual([]);
    });
});
