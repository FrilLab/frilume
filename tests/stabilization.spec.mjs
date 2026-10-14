import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import postcss from 'postcss';

const skinHtml = await readFile(new URL('../skin.html', import.meta.url), 'utf8');
const skinCss = await readFile(new URL('../skin.css', import.meta.url), 'utf8');
const contract = JSON.parse(await readFile(new URL('./tistory-contract.json', import.meta.url), 'utf8'));
const inlineScripts = [...skinHtml.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
const copyScript = inlineScripts.at(-1)?.[1] ?? '';

function countMatches(source, regex) {
  return [...source.matchAll(regex)].reduce((counts, match) => {
    counts[match[0]] = (counts[match[0]] || 0) + 1;
    return counts;
  }, {});
}

function contrastRatio(foreground, background) {
  const channels = value => value.match(/[\d.]+/g).slice(0, 3).map(channel => {
    const srgb = Number(channel) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  const luminance = color => {
    const [red, green, blue] = channels(color);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('Tistory contract is unchanged and source parses', async () => {
  const placeholders = countMatches(skinHtml, /\[##_.*?_##\]/g);
  const tistoryTags = countMatches(skinHtml, /<\/?s_[\w-]+/g);
  const placeholderSequence = [...skinHtml.matchAll(/\[##_.*?_##\]/g)].map(match => match[0]);
  const tistoryTagSequence = [...skinHtml.matchAll(/<\/?s_[\w-]+/g)].map(match => match[0]);
  expect(placeholders).toEqual(contract.placeholders);
  expect(tistoryTags).toEqual(contract.tistoryTags);
  expect(placeholderSequence).toEqual(contract.placeholderSequence);
  expect(tistoryTagSequence).toEqual(contract.tistoryTagSequence);
  expect(skinHtml).toContain('[##_search_onclick_submit_##]');
  expect(skinHtml).toContain('src="./images/script.js"');
  expect(() => postcss.parse(skinCss, { from: 'skin.css' })).not.toThrow();
  expect(copyScript).not.toBe('');
  expect(() => new Function(copyScript)).not.toThrow();
});

for (const colorScheme of ['light', 'dark']) {
  for (const width of [390, 768, 1024, 1440]) {
    test(`${width}px ${colorScheme}: route layout, contrast, and overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error') pageErrors.push(message.text());
      });
      await page.goto('/tests/fixture.html');

      for (const [view, bodyId] of [['home', 'tt-body-index'], ['category', 'tt-body-category'], ['search', 'tt-body-search'], ['article', 'tt-body-page']]) {
        await page.locator(`[data-view="${view}"]`).click();
        await expect(page.locator('body')).toHaveAttribute('id', bodyId);
        await expect(page.locator(`[data-screen="${view}"]`)).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      }

      const theme = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        const body = getComputedStyle(document.body);
        const content = document.querySelector('.content-wrap');
        const title = document.querySelector('#article-view h2');
        const paragraph = document.querySelector('#article-view p');
        const openGraph = document.querySelector('.og-text');
        const cover = document.querySelector('.post-cover');
        const layer = document.querySelector('.layer_edit.layer_open');
        return {
          text: root.getPropertyValue('--fril-text').trim(),
          heading: root.getPropertyValue('--fril-heading').trim(),
          background: getComputedStyle(content).backgroundColor,
          bodyText: body.color,
          title: getComputedStyle(title).color,
          paragraph: getComputedStyle(paragraph).color,
          paragraphBackground: getComputedStyle(paragraph).backgroundColor,
          link: getComputedStyle(document.querySelector('#article-view a')).color,
          emphasis: getComputedStyle(document.querySelector('#article-view strong')).color,
          emphasisWeight: Number(getComputedStyle(document.querySelector('#article-view strong')).fontWeight),
          quoteBackground: getComputedStyle(document.querySelector('#article-view blockquote')).backgroundColor,
          quoteText: getComputedStyle(document.querySelector('#article-view blockquote p')).color,
          quoteTextBackground: getComputedStyle(document.querySelector('#article-view blockquote p')).backgroundColor,
          tableHeaderBackground: getComputedStyle(document.querySelector('#article-view th')).backgroundColor,
          tableHeaderText: getComputedStyle(document.querySelector('#article-view th')).color,
          cardBackground: getComputedStyle(openGraph).backgroundColor,
          coverOverflow: getComputedStyle(cover).overflow,
          layerVisible: layer.getBoundingClientRect().width > 0 && layer.getBoundingClientRect().height > 0,
          aside: document.querySelector('#aside').getBoundingClientRect().toJSON(),
          content: document.querySelector('#content').getBoundingClientRect().toJSON(),
          codePadding: getComputedStyle(document.querySelector('#article-view pre')).padding,
          codeInnerPadding: getComputedStyle(document.querySelector('#article-view pre > code')).padding,
          codeInnerBorder: getComputedStyle(document.querySelector('#article-view pre > code')).borderWidth,
          codeOverflow: getComputedStyle(document.querySelector('#article-view pre')).overflowX,
          shortCodeHeight: document.querySelector('#article-view pre.short-code').getBoundingClientRect().height,
          fallbackText: getComputedStyle(document.querySelector('.related-articles figure:not(:has(img))'), '::after').content
        };
      });

      expect(theme.coverOverflow).toBe('visible');
      expect(theme.layerVisible).toBeTruthy();
      expect(theme.codeInnerPadding).toBe('0px');
      expect(theme.codeInnerBorder).toBe('0px');
      expect(theme.codeOverflow).toBe('auto');
      expect(theme.shortCodeHeight).toBeLessThan(80);
      expect(theme.fallbackText).toContain('FRILLAB / ARTICLE');
      expect(theme.cardBackground).not.toBe('rgba(0, 0, 0, 0)');
      expect(theme.quoteBackground).toBe('rgb(238, 248, 232)');
      expect(theme.quoteText).toBe('rgb(35, 70, 26)');
      expect(theme.quoteTextBackground).toBe('rgb(255, 255, 255)');
      expect(theme.tableHeaderBackground).toBe('rgb(240, 229, 188)');
      expect(theme.tableHeaderText).toBe('rgb(32, 48, 64)');
      expect(contrastRatio(theme.bodyText, theme.background)).toBeGreaterThan(4.5);
      expect(contrastRatio(theme.title, theme.background)).toBeGreaterThan(4.5);
      expect(contrastRatio(theme.link, theme.background)).toBeGreaterThan(4.5);
      expect(contrastRatio(theme.emphasis, theme.background)).toBeGreaterThan(4.5);
      expect(theme.emphasisWeight).toBeGreaterThanOrEqual(600);

      if (colorScheme === 'dark') {
        const expectedText = `rgb(${theme.text.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16)).join(', ')})`;
        expect(theme.paragraph).toBe(expectedText);
        expect(theme.paragraphBackground).toBe('rgba(0, 0, 0, 0)');
      }
      if (width === 1440) {
        expect(theme.content.x + theme.content.width).toBeLessThanOrEqual(theme.aside.x + 1);
      }
      if (width === 390) {
        await page.locator('[data-view="search"]').click();
        const pager = page.locator('[data-pager="search"]');
        const dimensions = await pager.evaluate(node => ({ width: node.clientWidth, scroll: node.scrollWidth, wrap: getComputedStyle(node).flexWrap }));
        expect(dimensions.wrap).toBe('nowrap');
        expect(dimensions.scroll).toBeGreaterThan(dimensions.width);
      }

      expect(pageErrors).toEqual([]);
    });
  }
}

test('search opens without submitting and submits by Enter or button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tests/fixture.html');
  const input = page.locator('#mock-search');
  await page.locator('.fril-search-open').click();
  await expect(input).toBeFocused();
  expect(await page.evaluate(() => window.__searchSubmissions)).toEqual([]);
  await expect(page.locator('.fril-search-submit')).toBeVisible();
  await input.fill('css tokens');
  await input.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__searchSubmissions)).toEqual(['css tokens']);

  await page.reload();
  await page.locator('.fril-search-open').click();
  await page.locator('#mock-search').fill('tistory skin');
  await page.locator('.fril-search-submit').click();
  await expect.poll(() => page.evaluate(() => window.__searchSubmissions)).toEqual(['tistory skin']);
});

for (const colorScheme of ['light', 'dark']) {
  test(`comment and Namecard colors stay readable in ${colorScheme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme });
    await page.goto('/tests/fixture.html');
    await page.locator('[data-view="article"]').click();
    const styles = await page.evaluate(() => {
      const style = (selector, pseudo = null) => getComputedStyle(document.querySelector(selector), pseudo);
      return {
        text: style('.tt-comments-wrap').color,
        composer: style('.tt-box-textarea').backgroundColor,
        composerText: style('.tt-cmt').color,
        placeholder: style('textarea', '::placeholder').color,
        author: style('.tt-link-user').color,
        comment: style('.tt_desc').color,
        date: style('.tt_date').color,
        reply: style('.tt-link-comment').color,
        cardBackground: style('.tt_box_namecard').backgroundColor,
        cardTitle: style('.tt_tit_cont').color,
        cardDescription: style('[data-tistory-react-app="Namecard"] .tt_desc').color,
        cardHeight: document.querySelector('.tt_box_namecard').getBoundingClientRect().height,
        avatar: document.querySelector('.tt_thumb_g img').getBoundingClientRect().toJSON()
      };
    });
    expect(styles.composer).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.cardBackground).not.toBe('rgb(255, 255, 255)');
    expect(styles.cardHeight).toBeLessThan(130);
    expect(styles.avatar.width).toBe(48);
    expect(styles.avatar.height).toBe(48);
    expect(contrastRatio(styles.author, styles.cardBackground)).toBeGreaterThan(4.5);
    expect(contrastRatio(styles.comment, styles.cardBackground)).toBeGreaterThan(4.5);
    expect(contrastRatio(styles.placeholder, styles.composer)).toBeGreaterThan(4.5);
    expect(contrastRatio(styles.date, styles.cardBackground)).toBeGreaterThan(3);
    expect(styles.reply).not.toBe(styles.comment);
  });
}

test('code copy preserves source text, drops line numbers, and binds only once', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async text => {
        window.__copiedText = text;
        window.__copyCalls = (window.__copyCalls || 0) + 1;
      } }
    });
  });
  await page.goto('/tests/fixture.html');
  await page.locator('[data-view="article"]').click();
  const button = page.locator('.fril-code-copy').first();
  await expect(button).toHaveCSS('opacity', '0');
  await button.focus();
  await expect(button).toHaveCSS('opacity', '1');
  await page.addScriptTag({ content: copyScript });
  await button.click();
  await expect(button).toHaveText('복사 완료');
  expect(await page.evaluate(() => window.__copyCalls)).toBe(1);
  expect(await page.evaluate(() => window.__copiedText)).toBe('.card {\n  color: #2764e8;\n\n  padding: 12px;\n}');
  expect(await button.getAttribute('aria-label')).toBe('코드 복사 완료');
});

test('clipboard fallback succeeds when supported and displays failure when denied', async ({ page }) => {
  await page.goto('/tests/fixture.html');
  await page.locator('[data-view="article"]').click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    document.execCommand = () => {
      window.__fallbackValue = document.activeElement.value;
      return true;
    };
  });
  const button = page.locator('.fril-code-copy').first();
  await button.click();
  await expect(button).toHaveText('복사 완료');
  expect(await page.evaluate(() => window.__fallbackValue)).toContain('.card {');

  await page.evaluate(() => { document.execCommand = () => false; });
  const nextButton = page.locator('.fril-code-copy').nth(1);
  await nextButton.click();
  await expect(nextButton).toHaveText('복사 실패');
  await expect(nextButton).toHaveClass(/failed/);
});

test('mobile drawer and mobile copy control remain operable', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/tests/fixture.html');
  await page.locator('[data-view="article"]').click();
  const copyButton = page.locator('.fril-code-copy').first();
  await expect(copyButton).toBeVisible();
  await expect(copyButton).toHaveCSS('opacity', '1');
  await page.locator('.fril-mobile-trigger').click();
  await expect(page.locator('#aside')).toHaveCSS('visibility', 'visible');
  await page.locator('.fril-mobile-close').click();
  await expect(page.locator('#fril-mobile-switch')).not.toBeChecked();
  await context.close();
});


test('reduced motion disables smooth scrolling and decorative transitions', async ({ page }) => {
  await page.goto('/tests/fixture.html');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motion = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    copyTransition: getComputedStyle(document.querySelector('.fril-code-copy')).transitionDuration,
    cardTransition: getComputedStyle(document.querySelector('.related-articles figure')).transitionDuration
  }));
  expect(motion.scroll).toBe('auto');
  expect(motion.copyTransition).toMatch(/0s|0\.01ms|1e-05s/);
  expect(motion.cardTransition).toMatch(/0s|0\.01ms|1e-05s/);
});
