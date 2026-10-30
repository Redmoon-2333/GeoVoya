import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import type { MethodQuestion } from '../src/course/methods'
const methods = JSON.parse(readFileSync(new URL('../src/course/identification.json', import.meta.url), 'utf8')) as { questions: MethodQuestion[]; default_route: string[]; case_tabs: { name: string; questions: string[] }[] }

async function correctAnswer(page: Page, q: MethodQuestion) {
  if (Array.isArray(q.answer_keys)) {
    for (const key of q.answer_keys) {
      const label = page.locator('.method-option').filter({ hasText: q.options.find(o => o.id === key)!.text })
      await label.locator('input').check()
    }
  } else {
    for (const [key, value] of Object.entries(q.answer_keys)) await page.getByLabel(`配对${q.options.find(o => o.id === key)!.text}`, { exact: true }).selectOption(value)
  }
  await page.getByRole('button', { name: '检查答案', exact: true }).click()
  await expect(page.locator('.method-result')).toContainText('回答正确')
}

test('all package questions grade correctly, complete the default route and persist', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await page.goto('/methods?demo=1')
  await expect(page.getByRole('heading', { name: '望闻问切', exact: true })).toBeVisible()
  expect(await page.locator('.method-option input').first().evaluate(el => el.getBoundingClientRect().width)).toBe(17)
  expect(await page.locator('.method-option').first().evaluate(el => el.getBoundingClientRect().height)).toBeLessThan(120)
  await expect(page.getByRole('button', { name: /完成入门学习后解锁图鉴/ })).toBeDisabled()
  for (const id of methods.default_route) {
    const q = methods.questions.find(q => q.question_id === id)!
    await page.locator('.method-steps').getByRole('button', { name: new RegExp(q.prompt.replace(/[？。]/g, '.')) }).click()
    await correctAnswer(page, q)
  }
  await expect(page.locator('.methods-progress')).toContainText('10 / 10')
  await page.getByRole('button', { name: '打开方法图鉴', exact: true }).click()
  await expect(page.locator('.method-atlas')).toBeVisible()
  await page.locator('.method-atlas').getByRole('button', { name: /根系怎么观察/ }).click()
  await expect(page.locator('#method-card-title')).toContainText('根系怎么观察')
  await page.locator('dialog:not(.method-image-dialog) .method-image-button').first().click()
  await expect(page.locator('.method-image-dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#method-card-title')).toBeVisible()
  await page.keyboard.press('Escape')
  for (const route of methods.case_tabs) {
    await page.locator('.methods-tabs').getByRole('button', { name: route.name, exact: true }).click()
    for (const id of route.questions) {
      const q = methods.questions.find(q => q.question_id === id)!
      await page.locator('.method-steps').getByRole('button', { name: new RegExp(q.prompt.replace(/[？。]/g, '.')) }).click()
      await correctAnswer(page, q)
      for (const img of await page.locator('.method-images img:visible').all()) {
        await expect(img).toHaveJSProperty('complete', true)
        expect(await img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
        expect(await img.evaluate(el => getComputedStyle(el).objectFit)).toBe('contain')
      }
    }
  }
  await page.reload()
  await expect(page.locator('.methods-progress')).toContainText('10 / 10')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('geovoya:methods-v3')!).completed_question_ids.length)).toBe(26)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出学习记录', exact: true }).click()
  expect(await readFile((await (await download).path())!, 'utf8')).toContain('已完成')
  await page.goto('/feedback?demo=1'); await expect(page.locator('.common-feedback').first()).toContainText('10 / 10')
  await page.screenshot({ path: info.outputPath('method-progress.png'), fullPage: true })
  expect(errors).toEqual([])
})

test('wrong answers reveal guidance, multi-choice requires exact matches, labels and zoom stay visible', async ({ page }, info) => {
  await page.goto('/methods?demo=1')
  await page.locator('.method-option input').nth(1).check()
  await page.getByRole('button', { name: '检查答案', exact: true }).click()
  await expect(page.locator('.method-result')).toContainText(methods.questions[0]!.hint_1)
  await page.getByRole('button', { name: '检查答案', exact: true }).click()
  await expect(page.locator('.method-cards')).toHaveAttribute('open', '')
  await expect(page.locator('.method-cards')).toContainText('柳杉')
  await expect(page.locator('.media-kind').first()).toHaveText('外部参考照片 · 非本次实拍')
  await page.getByRole('button', { name: '放大柳杉整株参考', exact: true }).click()
  await expect(page.locator('.method-image-dialog')).toBeVisible()
  await expect(page.locator('.method-image-dialog')).toContainText('Luis Miguel')
  await page.keyboard.press('Escape')
  await page.locator('.method-steps button').nth(3).click()
  await page.locator('.method-option input').nth(1).check()
  await page.getByRole('button', { name: '检查答案', exact: true }).click()
  await expect(page.locator('.method-result')).toContainText('再观察一下')
  await page.locator('.method-option input').nth(2).check(); await page.locator('.method-option input').nth(3).check()
  await page.getByRole('button', { name: '检查答案', exact: true }).click()
  await expect(page.locator('.method-result')).toContainText('回答正确')
  await page.locator('.method-steps button').last().click()
  await expect(page.locator('.media-kind').first()).toHaveText('AI生成材质类比 · 非真实叶片')
  await expect(page.locator('.method-task')).not.toContainText('识别为')
  await page.screenshot({ path: info.outputPath('method-task.png'), fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
