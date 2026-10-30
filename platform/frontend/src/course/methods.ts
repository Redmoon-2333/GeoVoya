import raw from './identification.json'
export interface MethodAsset { asset_id: string; path: string; caption: string; kind: string; creator: string; license: string; license_url: string; source_url: string; notes: string; changes: string }
export interface MethodCard { card_id: string; module: string; title: string; body: string; asset_ids: string[]; source_ids: string[]; observation_prompt: string; role: string; display_note: string }
export interface MethodQuestion { question_id: string; module: string; type: 'single' | 'multi' | 'match'; prompt: string; options: { id: string; text: string }[]; answer_keys: string[] | Record<string, string>; feedback_correct: string; feedback_wrong: string; hint_1: string; hint_2: string; asset_ids: string[]; card_ids: string[]; core: boolean }
export interface MethodProgress { visited_card_ids: string[]; completed_question_ids: string[]; attempt_count: Record<string, number> }
export const methods = raw as unknown as { version: string; default_route: string[]; case_tabs: { name: string; role: string; questions: string[] }[]; cards: MethodCard[]; questions: MethodQuestion[]; assets: MethodAsset[]; references: { id: string; title: string; locator: string; url: string }[] }
export function matchesAnswer(question: MethodQuestion, answer: string[] | Record<string, string>) {
  const keys = question.answer_keys
  if (Array.isArray(keys)) return Array.isArray(answer) && new Set(answer).size === keys.length && keys.every(key => answer.includes(key))
  return !Array.isArray(answer) && question.options.every(option => answer[option.id] === keys[option.id])
}
export function safeSource(url: string) { return /^https?:\/\//i.test(url) ? url : undefined }
export function assetLabel(asset: MethodAsset) { return asset.kind === 'external_photo' ? '外部参考照片 · 非本次实拍' : asset.asset_id === 'C-MATERIAL-AI-01' ? 'AI生成材质类比 · 非真实叶片' : '形态图示' }
