// @ts-check
const { test, expect } = require('@playwright/test');
const { FIXTURE } = require('./fixtures');

async function loadApp(page) {
  const data = JSON.parse(JSON.stringify(FIXTURE));
  await page.addInitScript(
    ([fixture]) => {
      // This must be fully self-contained: addInitScript cannot reach
      // outer-scope functions, only the values passed in through args.
      window.__remote = JSON.parse(JSON.stringify(fixture));
      window.claude = {
        use: async (name) => {
          if (name !== 'db') return null;
          return {
            doc: () => ({
              get: async () => ({
                exists: true,
                data: () => JSON.parse(JSON.stringify(window.__remote))
              }),
              set: async (d) => { window.__remote = JSON.parse(JSON.stringify(d)); },
              onSnapshot: () => () => {}
            })
          };
        }
      };
    },
    [data]
  );
  await page.goto('/index.html');
  await page.waitForSelector('tr.bill th.rowhead', { timeout: 10000 });
  await page.selectOption('#view', 'daily').catch(() => {});
  await page.waitForTimeout(300);
}

function rowLocator(page, name) {
  return page.locator('tr.bill, tr.income').filter({ has: page.locator('th.rowhead', { hasText: name }) });
}

test('loads without JavaScript errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await loadApp(page);
  expect(errors).toEqual([]);
  await expect(page.locator('.hero .num')).toBeVisible();
});

test('removing a single payment then saving a new amount does not keep it hidden', async ({ page }) => {
  // Regression test for a real bug: saving over a previously-removed payment
  // silently re-applied the "deleted" flag and kept the cell hidden forever.
  // "Water" also falls on the 1st, so that day's column stays on the grid
  // after Rent's own payment on the 1st is removed.
  await loadApp(page);
  const row = rowLocator(page, 'Rent');

  await row.locator('td.cell[data-date="2024-02-01"]').click();
  await page.click('#popDelete');
  await page.waitForTimeout(300);

  const emptied = row.locator('td.cell.empty[data-date="2024-02-01"]');
  await expect(emptied).toHaveCount(1);

  await emptied.click();
  await page.fill('#popAmt', '999');
  await page.click('#popSave');
  await page.waitForTimeout(300);

  const saved = row.locator('td.cell[data-date="2024-02-01"]');
  await expect(saved).not.toHaveClass(/empty/);
  await expect(saved).toContainText('999');
});

test('entering an amount on an empty day keeps that exact day, not the week start', async ({ page }) => {
  // Regression test for a real bug: an amount typed on an empty day with no
  // scheduled occurrence used to land on the Friday that starts that week
  // instead of the day actually clicked. "Extra Expense" on Jan 17 (a
  // Wednesday) keeps that day's column on the grid even though Rent has
  // nothing due that day.
  await loadApp(page);
  const row = rowLocator(page, 'Rent');

  const cell = row.locator('td.cell.empty[data-date="2024-01-17"]');
  await expect(cell).toHaveCount(1);
  await cell.click();
  await page.fill('#popAmt', '321');
  await page.click('#popSave');
  await page.waitForTimeout(300);

  const landedOnTarget = row.locator('td.cell[data-date="2024-01-17"]');
  await expect(landedOnTarget).toContainText('321');

  // Jan 17's week starts Friday Jan 12 - that cell must stay untouched.
  const weekStartCell = row.locator('td.cell[data-date="2024-01-12"]');
  if (await weekStartCell.count()) {
    await expect(weekStartCell).toHaveClass(/empty/);
  }
});

test('deleting one occurrence leaves the recurring schedule intact', async ({ page }) => {
  // "Insurance" also falls on the 10th, so that day's column stays on the
  // grid after Phone's own payment on the 10th is removed.
  await loadApp(page);
  const row = rowLocator(page, 'Phone');

  const first = row.locator('td.cell[data-date="2024-01-10"]');
  await first.click();
  await page.click('#popDelete');
  await page.waitForTimeout(300);
  await expect(row.locator('td.cell.empty[data-date="2024-01-10"]')).toHaveCount(1);

  // The next month's occurrence of the same recurring bill should still show up untouched.
  const next = row.locator('td.cell[data-date="2024-02-10"]');
  await expect(next).not.toHaveClass(/empty/);
  await expect(next).toContainText('50');
});
