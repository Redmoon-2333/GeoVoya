import { test, expect, type Page } from '@playwright/test'

const KEY = 'geovoya:onboarding:v1'
const TOTAL = 3
const steps = [
  { selector: '#current-task' },
  { selector: '#study-route' },
  { selector: '.sidebar-tools', mobileSelector: '#module-tools' },
]

async function visit(page: Page, url = '/') {
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}demo=1`)
  await expect(page.locator('.main-content h1').first()).toBeVisible()
}

async function startTour(page: Page) {
  await page.getByRole('button', { name: '查看引导', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '先看当前任务' })).toBeVisible()
}

async function expectStep(page: Page, index: number) {
  const step = steps[index]!
  const dialog = page.locator('.tour-box')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.tour-progress')).toContainText(`${index + 1} / ${TOTAL}`)
  await expect(page).toHaveURL(/\/.*demo=1/)
  await expect(page.locator('.tour-spotlight')).toHaveCount(1, { timeout: 8000 })
  await expect(page.locator('.tour-box.centered')).toHaveCount(0)
  const framed = await page.evaluate(({ desktop, mobile }) => {
    const spot = document.querySelector('.tour-spotlight')!.getBoundingClientRect()
    const candidates = (window.innerWidth <= 760 ? [mobile, desktop] : [desktop, mobile]).filter(Boolean) as string[]
    return candidates.some(selector => {
      const element = document.querySelector<HTMLElement>(selector)
      if (!element) return false
      const raw = element.getBoundingClientRect()
      const box = {
        top: Math.max(raw.top, 0), left: Math.max(raw.left, 0),
        right: Math.min(raw.right, window.innerWidth), bottom: Math.min(raw.bottom, window.innerHeight),
      }
      if (box.right - box.left < 8 || box.bottom - box.top < 8) return false
      const cx = spot.left + spot.width / 2, cy = spot.top + spot.height / 2
      return cx >= box.left - 6 && cx <= box.right + 6 && cy >= box.top - 6 && cy <= box.bottom + 6
    })
  }, { desktop: step.selector, mobile: step.mobileSelector })
  expect(framed, `step ${index + 1} highlights ${step.selector}`).toBe(true)
  const fits = await page.evaluate(() => {
    const box = document.querySelector('.tour-box')!.getBoundingClientRect()
    return box.left >= 0 && box.right <= window.innerWidth + 1 && box.top >= 0 && box.bottom <= window.innerHeight + 1
  })
  expect(fits).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
}

async function stored(page: Page) {
  return page.evaluate(key => localStorage.getItem(key), KEY)
}

test('three-step tour explains task, route and tools without interrupting the course', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await visit(page)
  await expect(page.getByRole('heading', { name: '第一次来？三步熟悉研学路线和工具' })).toBeVisible()
  await expect(page.locator('.tour-box')).toHaveCount(0)
  await startTour(page)
  await expect(page.getByRole('button', { name: '上一步', exact: true })).toBeDisabled()
  for (let index = 0; index < TOTAL; index += 1) {
    await expectStep(page, index)
    if (index < TOTAL - 1) await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
  }
  await page.getByRole('button', { name: '完成引导', exact: true }).click()
  await expect(page).toHaveURL(/\/\?demo=1/)
  await expect(page.locator('.tour-box')).toHaveCount(0)
  expect(JSON.parse((await stored(page))!)).toEqual({ status: 'done', step: 0 })
  await visit(page)
  await expect(page.getByRole('heading', { name: '第一次来？三步熟悉研学路线和工具' })).toHaveCount(0)
  expect(errors).toEqual([])
})

test('direct start and skipping hide the invitation after reload', async ({ page }) => {
  await visit(page)
  await page.getByRole('button', { name: '直接开始', exact: true }).click()
  await expect(page.getByRole('heading', { name: '第一次来？三步熟悉研学路线和工具' })).toHaveCount(0)
  expect(JSON.parse((await stored(page))!)).toEqual({ status: 'skipped', step: 0 })
  await page.reload()
  await expect(page.locator('.main-content h1').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: '第一次来？三步熟悉研学路线和工具' })).toHaveCount(0)
})

async function expectRestartFocused(page: Page) {
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

  if ((await page.viewportSize())!.width <= 760) await page.getByRole('button', { name: '打开研学导航', exact: true }).click()
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
  await expect(page.locator('.tour-box h2')).toHaveText('需要回看时，打开工具')
})

test('the tour stays read-only and adds only its own storage key', async ({ page }) => {
  await visit(page, '/explore')
  await visit(page)
  const before = await page.evaluate(() => Object.keys(localStorage).sort())
  await startTour(page)
  await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
  await page.getByRole('button', { name: '我知道了，下一步', exact: true }).click()
  await page.waitForTimeout(300)
  const after = await page.evaluate(() => Object.keys(localStorage).sort())
  expect(after.filter(key => !before.includes(key)).sort()).toEqual([KEY].sort())
  const demo = await page.evaluate(() => JSON.parse(localStorage.getItem('geovoya:demo:v1') || 'null'))
  expect(demo?.observations ?? []).toEqual([])
  expect(demo?.analyses ?? []).toEqual([])
  expect(demo?.artifacts ?? []).toEqual([])
  expect(demo?.reflection ?? null).toBeNull()
})

test('the tour restarts from the sidebar and the guide panel', async ({ page }) => {
  await visit(page)
  await page.getByRole('button', { name: '直接开始', exact: true }).click()
  if ((await page.viewportSize())!.width <= 760) await page.getByRole('button', { name: '打开研学导航', exact: true }).click()
  await page.getByRole('button', { name: '新手引导', exact: true }).click()
  await expect(page.locator('.tour-progress')).toContainText(`1 / ${TOTAL}`)
  await page.getByRole('button', { name: '跳过引导', exact: true }).click()
  await page.getByRole('button', { name: '打开小目导学', exact: true }).click()
  await page.getByRole('button', { name: '重新查看新手引导', exact: true }).click()
  await expect(page.locator('.tour-progress')).toContainText(`1 / ${TOTAL}`)
})
