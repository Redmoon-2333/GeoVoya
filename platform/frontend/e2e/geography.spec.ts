import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

const lessonPages = JSON.parse(readFileSync(new URL('../src/course/geography-pages.json', import.meta.url), 'utf8')) as { id: string; title: string }[]

async function openLesson(page: Page, id = 'CL01') {
  await page.goto(`/geography/tianmu?demo=1&page=${id}`)
  await expect(page.locator('.tm-page-heading h2')).toHaveText(lessonPages.find(item => item.id === id)!.title)
  await expect(page.locator('.tianmu-lesson')).toHaveAttribute('aria-busy', 'false')
}

async function openAtlas(page: Page) {
  await page.goto('/geography/atlas?demo=1')
  await expect(page.locator('.atlas-loading')).toHaveCount(0)
  const atlas = page.frameLocator('.atlas-frame')
  await expect(atlas.locator('#boot')).toHaveClass('hidden')
  await expect(atlas.locator('#stage canvas')).toBeVisible()
  return atlas
}

test('all 26 mountain lessons render charts and local media through the course navigation', async ({ page }, info) => {
  test.setTimeout(150000)
  const errors: string[] = [], failed: string[] = [], api: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.url().includes('/lessons/') && response.status() >= 400) failed.push(response.url()) })
  page.on('request', request => { if (request.url().includes('/api/v1')) api.push(request.url()) })
  await openLesson(page)
  for (const [index, lesson] of lessonPages.entries()) {
    await expect(page.locator('.tm-page-heading h2')).toHaveText(lesson.title)
    await expect(page).toHaveURL(new RegExp(`page=${lesson.id}`))
    await expect(page.locator('.tm-content')).toContainText('参考文献')
    await expect.poll(() => page.locator('.tianmu-lesson img').evaluateAll(images => images
      .filter(image => (image as HTMLElement).offsetWidth)
      .filter(image => !(image as HTMLImageElement).complete || !(image as HTMLImageElement).naturalWidth)
      .map(image => (image as HTMLImageElement).src))).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), lesson.id).toBe(true)
    if (['CL01', 'SO01', 'VE01'].includes(lesson.id)) {
      await page.locator('.tm-main').screenshot({ path: info.outputPath(`${lesson.id}.png`) })
    }
    if (index < lessonPages.length - 1) await page.locator('.tm-page-footer [data-page]').last().click()
  }
  expect(errors).toEqual([]); expect(failed).toEqual([]); expect(api).toEqual([])
})

test('sample selection, notes, bookmarks and archive links restore the same lesson', async ({ page }) => {
  await openLesson(page)
  await page.locator('.tm-samples [data-alt$="|1500"]').click()
  await expect(page.locator('.tm-sample-info')).toContainText('1500 m')
  await expect(page.locator('.tm-live-value')).toContainText('9.84')
  await page.locator('.tm-page-footer [data-action="save"]').click()
  await page.locator('.tm-page-footer [data-action="note"]').click()
  const editor = page.locator('[data-dialog="note"]')
  await editor.getByLabel('我的观察', { exact: true }).fill('1500 m 样点气温为 9.84 ℃，继续比较同一研究的低海拔样点。')
  await editor.getByRole('button', { name: '保存观察', exact: true }).click()
  await expect(editor).not.toBeVisible()
  await page.reload()
  await expect(page.locator('.tm-page-footer [data-action="save"]')).toContainText('已收藏')
  await page.locator('.lesson-continuation').getByRole('link', { name: /回看科考档案/ }).click()
  const records = page.locator('.geography-records')
  await expect(records).toContainText('1500 m 样点气温为 9.84')
  const download = page.waitForEvent('download')
  await records.getByRole('button', { name: /导出探究记录/ }).click()
  const file = await (await download).path()
  expect(await readFile(file!, 'utf8')).toContain('9.84')
  await records.locator('a.note-row').click()
  await expect(page).toHaveURL(/geography\/tianmu.*page=CL01/)
  await page.locator('.tm-page-footer [data-action="note"]').click()
  await expect(editor.getByLabel('我的观察', { exact: true })).toHaveValue(/1500 m 样点气温/)
  await editor.getByRole('button', { name: '取消', exact: true }).click()
  await page.locator('.module-subnav').getByRole('link', { name: '星球植被图鉴', exact: true }).click()
  await expect(page.locator('.atlas-frame')).toBeVisible()
})

test('failed lesson loading can retry and failed note persistence keeps the editor', async ({ page }) => {
  await page.route('**/lessons/tianmu/data.json', route => route.fulfill({ status: 503, body: '' }))
  await page.goto('/geography/tianmu?demo=1')
  await expect(page.getByRole('alert')).toContainText('课程资料暂时无法加载')
  await page.unroute('**/lessons/tianmu/data.json')
  await page.getByRole('button', { name: '重新加载课程', exact: true }).click()
  await expect(page.locator('.tm-page-heading h2')).toHaveText(lessonPages.find(item => item.id === 'VE03')!.title)
  await page.locator('.tm-page-footer [data-action="note"]').click()
  const editor = page.locator('[data-dialog="note"]')
  await editor.getByLabel('我的观察', { exact: true }).fill('这条记录保存失败时应留在编辑框。')
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'geovoya:tianmu-causes-v9') throw new DOMException('Quota exceeded', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await editor.getByRole('button', { name: '保存观察', exact: true }).click()
  await expect(editor).toBeVisible()
  await expect(editor.getByLabel('我的观察', { exact: true })).toHaveValue('这条记录保存失败时应留在编辑框。')
  await expect(page.locator('[data-slot="notice"]')).toContainText('暂未')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('geovoya:tianmu-causes-v9')!).notes.VE03)).toBeUndefined()
})

test('the complete directory opens a specific resource and chart focus can restore the mountain', async ({ page }) => {
  await openLesson(page)
  await page.getByRole('button', { name: '完整目录', exact: true }).click()
  const catalog = page.locator('[data-dialog="catalog"]')
  await catalog.getByLabel('搜索主题、图表或来源', { exact: true }).fill('传感器土壤湿度')
  await catalog.getByRole('button', { name: /传感器土壤湿度/ }).click()
  await expect(catalog).not.toBeVisible()
  await expect(page).toHaveURL(/page=SO02/)
  await expect(page.locator('.tm-page-heading h2')).toHaveText(lessonPages.find(item => item.id === 'SO02')!.title)
  await page.getByRole('button', { name: '展开图表', exact: true }).click()
  await expect(page.locator('.tm-aside')).not.toBeVisible()
  await page.getByRole('button', { name: '恢复山体', exact: true }).click()
  await expect(page.locator('.tm-aside')).toBeVisible()
  await page.locator('.lesson-navigation').getByRole('link', { name: '比较植被', exact: true }).click()
  await expect(page).toHaveURL(/page=VE03/)
})

test('mountain diagrams and mobile controls fit at narrow and tablet widths', async ({ page }, info) => {
  const widths = info.project.name.startsWith('mobile') ? [390, 320] : [1440, 768]
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 })
    for (const id of ['CL01', 'CL04', 'CL05', 'SO01', 'VE01', 'SY01']) {
      await openLesson(page, id)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width} ${id}`).toBe(true)
      if (id === 'CL04') {
        await page.locator('[data-lab-mode="tianmu"]').click()
        await expect(page.locator('[data-lab-condition]')).toContainText('夏季低层西南气流')
        await page.locator('[data-lab-phase="3"]').click()
        await expect(page.locator('[data-lab-counter]')).toContainText('4 / 5')
      }
      if (id === 'VE01') {
        const viewer = page.locator('.tm-content [data-viewer]').first()
        const before = await viewer.locator('.tm-picture-plane').getAttribute('style')
        await viewer.getByRole('button', { name: '向右旋转', exact: true }).click()
        expect(await viewer.locator('.tm-picture-plane').getAttribute('style')).not.toBe(before)
      }
      await page.evaluate(() => scrollTo(0, 0))
      await page.screenshot({ path: info.outputPath(`${width}-${id}.png`), fullPage: true })
    }
  }
})

test('atlas paints a textured globe, responds to drag, modes and biome selection', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const atlas = await openAtlas(page)
  const canvas = atlas.locator('#stage canvas')
  await expect.poll(async () => {
    const image = await canvas.screenshot()
    const { channels } = await sharp(image).resize(100, 100).stats()
    return Math.max(...channels.slice(0, 3).map(channel => channel.stdev))
  }).toBeGreaterThan(25)
  const initial = await canvas.screenshot()
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + box.width * .35, box.y + box.height * .47)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * .35 + 90, box.y + box.height * .47 + 30, { steps: 10 })
  await page.mouse.up()
  expect((await canvas.screenshot()).equals(initial)).toBe(false)
  await atlas.locator('[data-mode="lat"]').click()
  await expect(atlas.locator('#routeControls')).toBeVisible()
  await expect(atlas.locator('#probe')).not.toBeVisible()
  await atlas.locator('#tripAfrica').click()
  await expect(atlas.locator('#stepTitle')).toContainText('刚果盆地')
  await atlas.locator('[data-mode="temp"]').click()
  await expect(atlas.locator('#legend')).toBeVisible()
  await expect(atlas.locator('#legend')).toContainText('教学示意')
  if (await atlas.locator('#biomeMenu').isVisible()) await atlas.locator('#biomeMenu').click()
  await atlas.locator('[data-biome="taiga"]').click()
  await expect(atlas.locator('[data-biome="taiga"]')).toHaveClass(/active/)
  if (info.project.name.startsWith('mobile')) await expect(atlas.locator('.side')).not.toBeVisible()
  await atlas.locator('[data-mode="nature"]').click()
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); scrollTo(0, 0) })
  await page.screenshot({ path: info.outputPath('atlas.png'), fullPage: true })
  await page.setViewportSize({ width: info.project.name.startsWith('mobile') ? 320 : 768, height: 1000 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await canvas.screenshot({ path: info.outputPath('atlas-narrow.png') })
  await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); scrollTo(0, 0) })
  await page.screenshot({ path: info.outputPath('atlas-narrow-page.png'), fullPage: true })
  if (!info.project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: '全屏查看图鉴', exact: true }).click()
    await expect(page.locator('.atlas-workspace')).toHaveJSProperty('offsetWidth', 768)
    await page.getByRole('button', { name: '退出图鉴全屏', exact: true }).click()
    await expect(page.locator('.atlas-workspace:fullscreen')).toHaveCount(0)
  }
  expect(errors).toEqual([])
})

test('atlas remains interactive without WebGL or optional online references', async ({ page }, info) => {
  await page.addInitScript(() => {
    const context = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type, options) {
      if (type === 'webgl' || type === 'webgl2') return null
      return Reflect.apply(context, this, [type, options])
    } as typeof context
  })
  await page.route(/^https:\/\//, route => route.abort())
  const atlas = await openAtlas(page)
  await expect(atlas.locator('#errorBar')).toContainText('二维纹理球面')
  await atlas.locator('#toggleGrid').click()
  await expect(atlas.locator('#toggleGrid')).toHaveClass(/active/)
  await atlas.locator('[data-mode="rain"]').click()
  await expect(atlas.locator('#legend')).toBeVisible()
  expect((await atlas.locator('#stage canvas').screenshot()).length).toBeGreaterThan(5000)
  await page.screenshot({ path: info.outputPath('atlas-fallback.png'), fullPage: true })
})

test('switching lessons repeatedly releases the previous renderer and preserves records', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await openLesson(page, 'SO01')
  for (let index = 0; index < 3; index++) {
    await page.locator('.module-subnav').getByRole('link', { name: '星球植被图鉴', exact: true }).click()
    await expect(page.locator('.atlas-loading')).toHaveCount(0)
    await expect(page.locator('[data-tianmu-root]')).toHaveCount(0)
    await page.locator('.module-subnav').getByRole('link', { name: '垂直地带性', exact: true }).click()
    await expect(page.locator('.tm-page-heading h2')).toBeVisible()
    await expect(page.locator('.atlas-frame')).toHaveCount(0)
    await expect(page.locator('[data-tianmu-root]')).toHaveCount(1)
  }
  expect(errors).toEqual([])
})
