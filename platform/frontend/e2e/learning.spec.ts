import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { readFileSync } from 'node:fs'
import type { MethodQuestion } from '../src/course/methods'

const methods = JSON.parse(readFileSync(new URL('../src/course/identification.json', import.meta.url), 'utf8')) as { questions: MethodQuestion[]; default_route: string[] }
const isDemo = (info: TestInfo) => info.project.name.includes('demo')
async function visit(page: Page, path: string, info: TestInfo) {
  await page.goto(`${path}${isDemo(info) ? (path.includes('?') ? '&demo=1' : '?demo=1') : ''}`)
  await expect(page.locator('.main-content h1').first()).toBeVisible()
}
async function stage(page: Page, title: string, state: string) {
  await expect(page.locator('.journey-nav a').filter({ hasText: title })).toContainText(state)
}
async function count(page: Page, value: number) {
  await expect(page.locator('.journey-progress strong')).toHaveText(new RegExp(`^${value}\\s*/\\s*5$`))
}
async function checkAnswer(page: Page, question: MethodQuestion) {
  if (Array.isArray(question.answer_keys)) {
    for (const key of question.answer_keys) {
      await page.locator('.method-option').filter({ hasText: question.options.find(item => item.id === key)!.text }).locator('input').check()
    }
  } else {
    for (const [key, value] of Object.entries(question.answer_keys)) {
      await page.getByLabel(`配对${question.options.find(item => item.id === key)!.text}`, { exact: true }).selectOption(value)
    }
  }
  await page.getByRole('button', { name: '检查答案', exact: true }).click()
  await expect(page.locator('.method-result')).toContainText('回答正确')
}

test('a new learner completes all five outputs without running the tour', async ({ page }, info) => {
  test.setTimeout(150000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await visit(page, '/', info)
  await count(page, 0)
  await expect(page.locator('.journey-nav a').filter({ hasText: '未开始' })).toHaveCount(5)
  await expect(page.locator('#current-task .primary')).toHaveCount(1)
  await expect(page.locator('.intro-videos')).toHaveCount(0)
  await page.getByRole('link', { name: '开始方法学习', exact: true }).click()
  for (const [index, id] of methods.default_route.entries()) {
    await checkAnswer(page, methods.questions.find(item => item.question_id === id)!)
    if (index < methods.default_route.length - 1) {
      await stage(page, '望闻问切', '进行中')
      await count(page, 0)
      await page.getByRole('button', { name: '下一题', exact: true }).click()
    }
  }
  await stage(page, '望闻问切', '基础任务完成')
  await count(page, 1)
  await page.locator('.method-pagination').getByRole('link', { name: '开始山地观察', exact: true }).click()
  await page.locator('#observation-fact').fill('树干与地表植物之间可见倒木。')
  await page.getByRole('button', { name: '保存观察', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('观察记录已保存')
  await expect(page.locator('.observation-form .primary')).toHaveCount(1)
  await expect(page.locator('.observation-form .primary')).toHaveText('用这份资料分析问题')
  await stage(page, '空间探索', '进行中')
  await count(page, 1)
  await expect(page.locator('.exploration-tasks')).toContainText('实景观察已保存')
  await expect(page.locator('.exploration-tasks')).toContainText('地带性课程笔记待记录')
  await page.locator('.exploration-tasks').getByRole('link', { name: /地带性课程笔记/ }).click()
  await expect(page.locator('.tianmu-lesson')).toHaveAttribute('aria-busy', 'false')
  await page.locator('.tm-page-footer [data-action="note"]').click()
  await page.locator('[data-dialog="note"]').getByLabel('我的观察', { exact: true }).fill('记录这份植被资料中的群落层次，继续比较气候与土壤资料。')
  await page.locator('[data-dialog="note"]').getByRole('button', { name: '保存观察', exact: true }).click()
  await expect(page.locator('[data-dialog="note"]')).not.toBeVisible()
  await stage(page, '空间探索', '基础任务完成')
  await count(page, 2)
  await page.locator('.exploration-tasks').getByRole('link', { name: /实景观察/ }).click()
  await page.getByRole('button', { name: '用这份资料分析问题', exact: true }).click()
  await page.locator('#analysis-observed').fill('画面中部可见倒木。')
  await page.locator('#analysis-meaning').fill('它记录了当前画面的地表覆盖。')
  await expect(page.getByRole('button', { name: '保存并加入论证板', exact: true })).toBeDisabled()
  await page.locator('#analysis-missing').fill('还需同点位的时间记录与比较样点。')
  await page.getByRole('button', { name: '保存并加入论证板', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('加入论证板')
  await stage(page, '专题探究', '基础任务完成')
  await count(page, 3)
  await page.getByRole('link', { name: '查看证据链', exact: true }).click()
  await expect(page.locator('.argument-item')).toHaveCount(1)
  await page.getByRole('link', { name: '形成成果', exact: true }).click()
  await page.locator('#outcome-title').fill('森林画面与环境差异的研究记录')
  await page.locator('#outcome-content').fill('先记录可见现象，再用环境资料检验解释，当前照片无法独立说明变化成因。')
  await page.locator('.evidence-choice input').check()
  await page.getByRole('button', { name: '保存并归档', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('个人成果已归档')
  await expect(page.locator('.outcome-actions .primary')).toHaveCount(1)
  await expect(page.locator('.outcome-actions .primary')).toContainText('进入学习反思')
  await stage(page, '成果交流', '基础任务完成')
  await count(page, 4)
  await page.getByRole('link', { name: '进入学习反思', exact: true }).click()
  await expect(page.getByRole('button', { name: '保存反思', exact: true })).toBeDisabled()
  await expect(page.locator('.lesson-recap')).toContainText('记录这份植被资料中的群落层次')
  await page.locator('#reflection-text').fill('单张照片只支持画面事实，解释变化还需要时间与对照资料。')
  await page.getByRole('button', { name: '保存反思', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('学习反思已保存')
  await count(page, 5)
  await expect(page.locator('.feedback-summary')).toContainText('已完成 5 / 5')
  await page.reload()
  await count(page, 5)
  await page.getByRole('link', { name: '天目寻境，课程入口', exact: true }).click()
  await expect(page.locator('#current-task')).toContainText('五个基础任务都已完成')
  await expect(page.locator('#current-task .primary')).toHaveAttribute('href', /feedback/)
  await expect(page.locator('.module-card.done')).toHaveCount(5)
  await expect(page.locator('.tour-box')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('resume restores valid questions and lesson pages, preserves old records and separates modes', async ({ page }, info) => {
  await visit(page, '/', info)
  const otherKey = `geovoya:study-location:${isDemo(info) ? 'service' : 'demo'}`
  await page.evaluate(({ otherKey, completed }) => {
    localStorage.setItem(otherKey, '/inquiry?tab=board')
    localStorage.setItem('geovoya:methods-v3', JSON.stringify({ visited_card_ids: ['B1'], completed_question_ids: [completed], attempt_count: { [completed]: 1 } }))
    localStorage.setItem('geovoya:tianmu-causes-v9', JSON.stringify({ saved: ['SO01'], visited: ['SO01'], notes: { SO01: { text: '旧版本课程观察', updated_at: null } } }))
  }, { otherKey, completed: methods.default_route[0]! })
  await page.reload()
  await count(page, 0)
  await stage(page, '望闻问切', '进行中')
  await stage(page, '空间探索', '进行中')
  const questionId = methods.default_route[2]!
  await visit(page, `/methods?question=${questionId}`, info)
  await page.getByRole('link', { name: '天目寻境，课程入口', exact: true }).click()
  await expect(page.locator('#current-task .primary')).toHaveAttribute('href', new RegExp(`question=${questionId}`))
  await visit(page, '/geography/tianmu?page=SO03', info)
  await expect(page.locator('.tianmu-lesson')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('link', { name: '天目寻境，课程入口', exact: true }).click()
  await expect(page.locator('#current-task h2')).toHaveText('空间探索')
  await expect(page.locator('#current-task .primary')).toHaveAttribute('href', /page=SO03/)
  await expect(page.locator('.journey-nav a').filter({ hasText: '望闻问切' })).toHaveAttribute('href', new RegExp(`question=${questionId}`))
  await page.reload()
  await expect(page.locator('#current-task .primary')).toHaveAttribute('href', /page=SO03/)
  expect(await page.evaluate(key => localStorage.getItem(key), otherKey)).toBe('/inquiry?tab=board')
  await visit(page, '/feedback', info)
  await expect(page.locator('.lesson-recap')).toContainText('旧版本课程观察')
  await expect(page.locator('.module-progress-list')).toContainText('实景观察：待记录 · 课程笔记：已保存')
  await page.locator('#reflection-text').fill('   ')
  await expect(page.getByRole('button', { name: '保存反思', exact: true })).toBeDisabled()
  await count(page, 0)
})

test('collection failure retains observation, retry keeps question context and collection stays unique', async ({ page }, info) => {
  await visit(page, '/explore?node=sample-01&question=compare', info)
  await page.locator('#observation-fact').fill('失败重试时保留的观察事实。')
  await page.getByRole('button', { name: '保存观察', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('观察记录已保存')
  if (isDemo(info)) {
    await page.evaluate(() => {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (key === 'geovoya:demo:v1' && JSON.parse(value).favorites.length) throw new DOMException('Quota exceeded', 'QuotaExceededError')
        original.call(this, key, value)
      }
    })
  } else {
    await page.route('**/api/v1/favorites', route => route.fulfill({ status: 503, json: { message: '收藏暂未保存，请重试。' } }))
  }
  await page.getByRole('button', { name: '用这份资料分析问题', exact: true }).click()
  await expect(page.getByRole('status')).toContainText(/未保存/)
  await expect(page).toHaveURL(/explore/)
  await expect(page.locator('#observation-fact')).toHaveValue('失败重试时保留的观察事实。')
  await page.unroute('**/api/v1/favorites')
  await page.reload()
  await page.getByRole('button', { name: '用这份资料分析问题', exact: true }).click()
  await expect(page.locator('#analysis-question')).toHaveValue('compare')
  await page.getByRole('link', { name: '回看原始照片', exact: true }).click()
  await page.getByRole('button', { name: '用这份资料分析问题', exact: true }).click()
  await expect(page.locator('.workbench-sources > button')).toHaveCount(1)
  await stage(page, '专题探究', '进行中')
  await count(page, 0)
  await page.locator('#analysis-observed').fill('尚未保存的分析输入。')
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('tab', { name: /研究论证板/ }).click()
  await expect(page.locator('#analysis-observed')).toHaveValue('尚未保存的分析输入。')
  await expect(page).toHaveURL(/tab=workbench/)
})

test('extension topics cannot open cryptomeria evidence and invalid resume parameters recover', async ({ page }, info) => {
  for (const theme of ['bamboo', 'relict', 'tea']) {
    await visit(page, `/inquiry?theme=${theme}&tab=board`, info)
    await expect(page.locator('.draft-inquiry')).toBeVisible()
    await expect(page.locator('.inquiry-tabs')).toHaveCount(0)
    await expect(page.locator('.analysis-form, .argument-item')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '我的研究计划', exact: true })).toBeVisible()
  }
  const key = `geovoya:study-location:${isDemo(info) ? 'demo' : 'service'}`
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({
    last: '/methods?question=missing-question',
    paths: { methods: '/methods?question=missing-question', explore: '/explore?node=missing-node' },
  })), key)
  await visit(page, '/', info)
  await expect(page.locator('#current-task .primary')).not.toHaveAttribute('href', /missing-question/)
  await page.locator('#current-task .primary').click()
  await expect(page.locator('.method-task h2')).toHaveText(methods.questions.find(item => item.question_id === methods.default_route[0])!.prompt)
  await count(page, 0)
})

test('failed method persistence does not complete the shared learning stage', async ({ page }, info) => {
  await visit(page, '/', info)
  await page.evaluate(ids => localStorage.setItem('geovoya:methods-v3', JSON.stringify({
    visited_card_ids: [], completed_question_ids: ids, attempt_count: {},
  })), methods.default_route.slice(0, -1))
  await visit(page, `/methods?question=${methods.default_route.at(-1)}`, info)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'geovoya:methods-v3') throw new DOMException('Quota exceeded', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await checkAnswer(page, methods.questions.find(item => item.question_id === methods.default_route.at(-1))!)
  await expect(page.locator('.toast-notice')).toContainText('作答记录未保存')
  await expect(page.locator('.methods-progress')).toContainText('9 / 10')
  await expect(page.getByRole('button', { name: '完成入门学习后解锁图鉴', exact: true })).toBeDisabled()
  await stage(page, '望闻问切', '进行中')
  await count(page, 0)
  await page.reload()
  await expect(page.locator('.methods-progress')).toContainText('9 / 10')
})

test('outcome drafts restore by URL and reselecting the current entry protects unsaved edits', async ({ page }, info) => {
  await visit(page, '/outcomes', info)
  await page.locator('#outcome-title').fill('第一份研究草稿')
  await page.locator('#outcome-content').fill('保留这份已保存的研究内容。')
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('成果草稿已保存')
  const firstId = new URL(page.url()).searchParams.get('artifact')!
  await stage(page, '成果交流', '进行中')
  await count(page, 0)
  await page.locator('#outcome-title').fill('未保存的标题')
  await page.locator('.outcome-list > summary').click()
  page.once('dialog', dialog => dialog.dismiss())
  await page.locator('.outcome-list-item.active').click()
  await expect(page.locator('#outcome-title')).toHaveValue('未保存的标题')
  page.once('dialog', dialog => dialog.accept())
  await page.locator('.outcome-list-item.active').click()
  await expect(page.locator('#outcome-title')).toHaveValue('第一份研究草稿')
  await page.getByRole('button', { name: '新建成果', exact: true }).click()
  await expect(page.locator('#outcome-title')).toHaveValue('')
  await expect(page).toHaveURL(/artifact=new/)
  await page.locator('#outcome-title').fill('暂未保存的新草稿')
  page.once('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: '新建成果', exact: true }).click()
  await expect(page.locator('#outcome-title')).toHaveValue('暂未保存的新草稿')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: '新建成果', exact: true }).click()
  await expect(page.locator('#outcome-title')).toHaveValue('')
  await page.locator('#outcome-title').fill('第二份研究草稿')
  await page.getByRole('button', { name: '保存草稿', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('成果草稿已保存')
  await visit(page, `/outcomes?artifact=${firstId}`, info)
  await expect(page.locator('#outcome-title')).toHaveValue('第一份研究草稿')
  await page.reload()
  await expect(page.locator('#outcome-content')).toHaveValue('保留这份已保存的研究内容。')
  await expect(page.locator('.outcome-actions .primary')).toHaveCount(1)
})
