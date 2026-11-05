import { test, expect, type Page } from '@playwright/test'

const KEY = 'geovoya:onboarding:v1'
const TOTAL = 15
const steps = [
  { route: '/', selector: '.main-nav' },
  { route: '/', selector: '.journey-nav', mobileSelector: '.module-grid' },
  { route: '/', selector: '.intro-video-grid' },
  { route: '/methods', selector: '.method-task' },
  { route: '/explore', selector: '.tab-bar' },
  { route: '/explore', selector: '.observation-panel' },
  { route: '/explore', selector: '.module-subnav' },
  { route: '/inquiry', tab: 'questions', selector: '.inquiry-tabs' },
  { route: '/inquiry', tab: 'workbench', selector: '.workbench-layout, .empty-state' },
  { route: '/inquiry', tab: 'board', selector: '.board-heading' },
  { route: '/outcomes', selector: '.template-actions' },
  { route: '/feedback', selector: '.module-progress-list' },
  { route: '/feedback', selector: '#reflection-text' },
  { route: '/', selector: '.sidebar-tools', mobileSelector: '.module-tools' },
  { route: '/', selector: '.overview-banner' },
]

async function visit(page: Page, url = '/') {
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}demo=1`)
  await expect(page.locator('.main-content h1').first()).toBeVisible()
}

async function startTour(page: Page) {
  await page.getByRole('button', { name: '开始引导', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '顶部导航：五个研学板块' })).toBeVisible()
}

async function expectStep(page: Page, index: number) {
  const step = steps[index]!
  const dialog = page.locator('.tour-box')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.tour-progress')).toContainText(`${index + 1} / ${TOTAL}`)
  await expect(page).toHaveURL(new RegExp(`${step.route.replace(/[/.?]/g, m => `\\${m}`)}.*demo=1`))
  if (step.tab) await expect(page).toHaveURL(new RegExp(`tab=${step.tab}`))
  // Every step target exists at both widths, so the spotlight must frame it instead of the centred fallback.
  await expect(page.locator('.tour-spotlight'), `step ${index + 1} frames ${step.selector}`).toHaveCount(1, { timeout: 8000 })
  await expect(page.locator('.tour-box.centered')).toHaveCount(0)
  const framed = await page.evaluate(({ desktop, mobile }) => {
    const spot = document.querySelector('.tour-spotlight')!.getBoundingClientRect()
    const candidates = (window.innerWidth <= 760 ? [mobile, desktop] : [desktop, mobile]).filter(Boolean) as string[]
    return candidates.some(selector => selector.split(',').some(part => {
      const element = document.querySelector<HTMLElement>(part.trim())
      if (!element) return false
      const raw = element.getBoundingClientRect()
      // The spotlight frames the part of the target that is actually on screen.
      const box = {
        top: Math.max(raw.top, 0), left: Math.max(raw.left, 0),
        right: Math.min(raw.right, window.innerWidth), bottom: Math.min(raw.bottom, window.innerHeight),
      }
      if (box.right - box.left < 8 || box.bottom - box.top < 8) return false
      const cx = spot.left + spot.width / 2, cy = spot.top + spot.height / 2
      return cx >= box.left - 6 && cx <= box.right + 6 && cy >= box.top - 6 && cy <= box.bottom + 6
    }))
  }, { desktop: step.selector, mobile: step.mobileSelector })
  expect(framed, `step ${index + 1} highlights ${step.selector}`).toBe(true)
  const fits = await page.evaluate(() => {
    const box = document.querySelector('.tour-box')!.getBoundingClientRect()
    return box.left >= 0 && box.right <= window.innerWidth + 1 && box.top >= 0 && box.bottom <= window.innerHeight + 1
  })
  expect(fits, `step ${index + 1} keeps the box inside the viewport`).toBe(true)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

async function stored(page: Page) {
  return page.evaluate(key => localStorage.getItem(key), KEY)
}

test('tour steps through every route, then lands on methods with status done', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await visit(page)
  await expect(page.getByRole('heading', { name: '第一次来？跟着引导走一遍' })).toBeVisible()
  // The invitation card alone must never open an overlay.
  await expect(page.locator('.tour-box')).toHaveCount(0)
  await startTour(page)
  await expect(page.getByRole('button', { name: '上一步', exact: true })).toBeDisabled()
  for (let index = 0; index < TOTAL; index += 1) {
    await expectStep(page, index)
    if (index === 3) await expect(page.locator('.tour-example')).toBeVisible()
    if (index === TOTAL - 1) break
    await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
  }
  await page.getByRole('button', { name: '开始学习', exact: true }).click()
  await expect(page).toHaveURL(/\/methods.*demo=1/)
  await expect(page.locator('.tour-box')).toHaveCount(0)
  expect(JSON.parse((await stored(page))!)).toEqual({ status: 'done', step: 0 })
  await visit(page)
  await expect(page.getByRole('heading', { name: '第一次来？跟着引导走一遍' })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('skipping stores status and hides the invitation after reload', async ({ page }) => {
  await visit(page)
  await page.getByRole('button', { name: '以后再说', exact: true }).click()
  await expect(page.getByRole('heading', { name: '第一次来？跟着引导走一遍' })).toHaveCount(0)
  expect(JSON.parse((await stored(page))!)).toEqual({ status: 'skipped', step: 0 })
  await page.reload()
  await expect(page.locator('.main-content h1').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: '第一次来？跟着引导走一遍' })).toHaveCount(0)
})

async function expectRestartFocused(page: Page) {
  // The invitation card unmounts when the tour is skipped, so focus lands on a visible restart control.
  const name = await page.evaluate(() => {
    const active = document.activeElement
    if (!(active instanceof HTMLElement)) return ''
    if (active.classList.contains('sidebar-tour')) return '新手引导'
    if (active.getAttribute('aria-label') === '打开小目导学') return '打开小目导学'
    return active.textContent?.trim() || ''
  })
  expect(['新手引导', '打开小目导学']).toContain(name)
}

test('skip button and Escape close the tour and return focus', async ({ page }) => {
  await visit(page)
  await startTour(page)
  await page.getByRole('button', { name: '跳过引导', exact: true }).click()
  await expect(page.locator('.tour-box')).toHaveCount(0)
  await expectRestartFocused(page)
  expect(JSON.parse((await stored(page))!)).toEqual({ status: 'skipped', step: 0 })

  const width = (await page.viewportSize())!.width
  if (width <= 760) await page.getByRole('button', { name: '打开研学导航', exact: true }).click()
  await page.getByRole('button', { name: '新手引导', exact: true }).click()
  await expect(page.locator('.tour-box')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.tour-box')).toHaveCount(0)
  await expectRestartFocused(page)
})

test('reload resumes the tour at the same step', async ({ page }) => {
  await visit(page)
  await startTour(page)
  await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
  await expect(page.locator('.tour-progress')).toContainText(`2 / ${TOTAL}`)
  await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
  await expect(page.locator('.tour-progress')).toContainText(`3 / ${TOTAL}`)
  expect(JSON.parse((await stored(page))!)).toEqual({ status: 'active', step: 2 })
  await page.reload()
  await expect(page.locator('.tour-box')).toBeVisible()
  await expect(page.locator('.tour-progress')).toContainText(`3 / ${TOTAL}`)
  await expect(page.locator('.tour-box h2')).toHaveText('先看一看，再出发')
})

test('the tour stays read-only and adds only its own storage key', async ({ page }) => {
  // Visiting /explore first lets the store write its own baseline before the tour starts.
  await visit(page, '/explore')
  await visit(page)
  const before = await page.evaluate(() => Object.keys(localStorage).sort())
  await startTour(page)
  for (let index = 1; index < steps.length; index += 1) {
    await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
    await expect(page.locator('.tour-progress')).toContainText(`${index + 1} / ${TOTAL}`)
  }
  await page.waitForTimeout(300)
  const after = await page.evaluate(() => Object.keys(localStorage).sort())
  // Visiting /explore initialises the demo store; the tour itself only writes its own key.
  expect(after.filter(key => !before.includes(key)).sort()).toEqual([KEY].sort())
  const demo = await page.evaluate(() => JSON.parse(localStorage.getItem('geovoya:demo:v1') || 'null'))
  expect(demo?.observations ?? []).toEqual([])
  expect(demo?.analyses ?? []).toEqual([])
  expect(demo?.artifacts ?? []).toEqual([])
  expect(demo?.reflection ?? null).toBeNull()
})

test('a cancelled navigation keeps the step and explains why', async ({ page }) => {
  await visit(page)
  await startTour(page)
  for (let index = 1; index <= 6; index += 1) {
    await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
    await expect(page.locator('.tour-progress')).toContainText(`${index + 1} / ${TOTAL}`)
  }
  await expect(page).toHaveURL(/\/explore/)
  // Typing into the observation form marks the page dirty; the existing guard then blocks leaving.
  await page.locator('#observation-fact').fill('还没保存的观察。')
  page.once('dialog', dialog => { void dialog.dismiss() })
  await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
  await expect(page.locator('.tour-note')).toContainText('未保存')
  await expect(page.locator('.tour-progress')).toContainText(`7 / ${TOTAL}`)
  await expect(page).toHaveURL(/\/explore/)
  expect(JSON.parse((await stored(page))!)).toEqual({ status: 'active', step: 6 })
  await expect(page.locator('#observation-fact')).toHaveValue('还没保存的观察。')
})

test('the tour restarts from the sidebar and the guide panel', async ({ page }) => {
  await visit(page)
  await page.getByRole('button', { name: '以后再说', exact: true }).click()
  const width = (await page.viewportSize())!.width
  if (width <= 760) await page.getByRole('button', { name: '打开研学导航', exact: true }).click()
  await page.getByRole('button', { name: '新手引导', exact: true }).click()
  await expect(page.locator('.tour-box')).toBeVisible()
  await expect(page.locator('.tour-progress')).toContainText(`1 / ${TOTAL}`)
  await page.getByRole('button', { name: '跳过引导', exact: true }).click()
  await page.getByRole('button', { name: '打开小目导学', exact: true }).click()
  await page.getByRole('button', { name: '重新查看新手引导', exact: true }).click()
  await expect(page.locator('.tour-box')).toBeVisible()
  await expect(page.locator('.tour-progress')).toContainText(`1 / ${TOTAL}`)
})
