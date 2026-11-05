import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../frontend')
const require = createRequire(path.join(root, 'package.json'))
const sharp = require('sharp')
const [atlasPath, tianmuPath] = process.argv.slice(2)
if (!atlasPath || !tianmuPath) {
  throw new Error('Usage: node platform/tools/import-geography-pages.mjs <atlas.html> <tianmu.html>')
}

const output = path.join(root, 'public/lessons')
const imagePattern = /data:image\/[\w.+-]+;base64,[A-Za-z0-9+/=]+/g
const imageUrls = new Map()
const imageMetadata = []

async function save(relative, content) {
  const target = path.resolve(output, relative)
  if (!target.startsWith(output + path.sep)) throw new Error(`Invalid output path: ${relative}`)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, content)
}

function scripts(html) {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1])
}

// Read the JSON boundary without evaluating any supplied JavaScript.
function assignment(source, name) {
  const marker = `${name}=`
  const start = source.indexOf(marker) + marker.length
  if (start < marker.length) throw new Error(`Missing assignment: ${name}`)
  let depth = 0, quoted = false, escaped = false
  for (let index = start; index < source.length; index++) {
    const char = source[index]
    if (quoted) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') quoted = false
    } else if (char === '"') quoted = true
    else if (char === '{' || char === '[') depth++
    else if (char === '}' || char === ']') {
      depth--
      if (!depth) return JSON.parse(source.slice(start, index + 1))
    }
  }
  throw new Error(`Unclosed JSON: ${name}`)
}

// Every patch is matched by an exact string. A missed or ambiguous anchor must fail the import
// instead of silently shipping an unpatched library.
function patch(source, find, replacement, label) {
  const hits = source.split(find).length - 1
  if (hits !== 1) throw new Error(`Patch "${label}": expected 1 match, found ${hits}`)
  return source.replace(find, replacement)
}
function patchPattern(source, pattern, replacement, label) {
  if (!pattern.global) throw new Error(`Patch "${label}": pattern must be global`)
  const hits = [...source.matchAll(pattern)].length
  if (hits !== 1) throw new Error(`Patch "${label}": expected 1 match, found ${hits}`)
  return source.replace(pattern, replacement)
}

// Landmark photos keep their supplied file names so cards can be replaced or added by hand.
function imageTarget(dataUrl, landmarkNames) {
  const original = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
  const digest = createHash('sha256').update(original).digest('hex')
  const landmarkKey = landmarkNames.get(dataUrl)
  const relative = landmarkKey ? landmarkKey.replace(/^assets\//, 'tianmu/') : `images/${digest.slice(0, 20)}.webp`
  return { original, digest, relative }
}

async function extractImages(source, landmarkNames = new Map()) {
  for (const match of source.matchAll(imagePattern)) {
    const dataUrl = match[0]
    if (imageUrls.has(dataUrl)) continue
    const { original, digest, relative } = imageTarget(dataUrl, landmarkNames)
    const converted = await sharp(original).webp({ quality: 90, effort: 5 }).toBuffer()
    await save(relative, converted)
    imageUrls.set(dataUrl, `/lessons/${relative}`)
    imageMetadata.push({
      path: relative,
      ...(landmarkNames.has(dataUrl) ? { landmark: landmarkNames.get(dataUrl) } : {}),
      original_sha256: digest,
      bytes: converted.length,
    })
  }
}

function rewrite(value) {
  if (typeof value === 'string') return value.replace(imagePattern, image => imageUrls.get(image) || image)
  if (Array.isArray(value)) return value.map(rewrite)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewrite(item)]))
  return value
}

const [atlas, tianmu] = await Promise.all([readFile(atlasPath, 'utf8'), readFile(tianmuPath, 'utf8')])

const tianmuScripts = scripts(tianmu)
if (tianmuScripts.length !== 13) throw new Error(`Unexpected Tianmu script structure: ${tianmuScripts.length} scripts, expected 13`)
const dataScript = tianmuScripts[0], libraryScript = tianmuScripts[tianmuScripts.length - 1]
if (!libraryScript.includes('global.TianmuStudy=library')) throw new Error('Unexpected Tianmu library script')
const rawData = assignment(dataScript, 'window.TIANMU_DATA')
const rawDiagrams = assignment(dataScript, 'window.TIANMU_DIAGRAMS')
const rawAssets = assignment(dataScript, 'window.TIANMU_OFFLINE_ASSETS')
const version = rawData.version
if (!libraryScript.includes(`const VERSION='${version}'`)) throw new Error(`Library version does not match data version ${version}`)
if (!Array.isArray(rawData.pages) || !rawData.pages.length) throw new Error('Tianmu data has no pages')

// Course wording and card changes supplied by the project team. Applied to the parsed data before
// any image is extracted, so added photos go through the same WebP, path and manifest pipeline.
const overridesPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tianmu-overrides.json')
const overrides = JSON.parse(await readFile(overridesPath, 'utf8'))
const repoRoot = path.resolve(root, '../..')
const userPhoto = Object.values(rawData.landmarks.photos).find(photo => photo.caption?.startsWith('柳杉干基部'))
if (!userPhoto) throw new Error('Overrides: cannot find a user-collected photo to copy attribution from')
const userAttribution = {
  author: userPhoto.author, credit: userPhoto.credit, license: userPhoto.license,
  license_url: userPhoto.license_url, source: userPhoto.source, source_url: userPhoto.source_url,
}

function findCard(id) {
  const card = rawData.landmarks.cards.find(item => item.id === id)
  if (!card) throw new Error(`Overrides: unknown landmark card "${id}"`)
  return card
}
function photoKey(photo) {
  if (!photo.file) return photo.path
  return photo.file.startsWith('assets/') ? photo.file : `assets/landmarks/${photo.file}`
}
// A local file becomes a new landmark asset whose data URL is rewritten by extractImages.
function addLocalPhoto(photo, id) {
  if (!photo.source) throw new Error(`Overrides: photo for "${id}" has no local source file`)
  return { ...photo, __source: path.resolve(repoRoot, photo.source) }
}

for (const [id, change] of Object.entries(overrides.landmark_cards)) {
  const card = findCard(id)
  for (const removed of change.remove_photos ?? []) {
    const index = card.photos.findIndex(photo => photoKey(photo) === removed)
    if (index < 0) throw new Error(`Overrides: card "${id}" has no photo ${removed}`)
    card.photos.splice(index, 1)
  }
  for (const added of change.add_photos ?? []) {
    const photo = addLocalPhoto({ ...added }, id)
    const position = photo.position ?? card.photos.length
    if (position < 0 || position > card.photos.length) throw new Error(`Overrides: bad position ${position} for "${id}"`)
    card.photos.splice(position, 0, photo)
  }
  for (const [key, caption] of Object.entries(change.photo_captions ?? {})) {
    const photo = card.photos.find(item => photoKey(item) === key)
    if (!photo) throw new Error(`Overrides: card "${id}" has no photo ${key} to caption`)
    // Captions live on the card's own photo entry; the shared landmarks.photos note is left alone.
    photo.caption = caption
    photo.alt = photo.alt || caption
  }
}

for (const addition of overrides.new_cards ?? []) {
  const anchor = rawData.landmarks.cards.findIndex(card => card.id === addition.after)
  if (anchor < 0) throw new Error(`Overrides: unknown insert position after "${addition.after}"`)
  if (rawData.landmarks.cards.some(card => card.id === addition.card.id)) throw new Error(`Overrides: card "${addition.card.id}" already exists`)
  const card = { ...addition.card, photos: addition.card.photos.map(photo => addLocalPhoto({ ...photo }, addition.card.id)) }
  rawData.landmarks.cards.splice(anchor + 1, 0, card)
}
rawData.landmarks.cards.forEach((card, index) => { card.index = index })

for (const change of overrides.vegetation ?? []) {
  const entry = rawData.vegetation.find(item => item.vegetation_id === change.vegetation_id)
  if (!entry) throw new Error(`Overrides: unknown vegetation "${change.vegetation_id}"`)
  Object.assign(entry, { species: change.species, appearance: change.appearance })
}

// Page summaries, body sentences and diagram labels are replaced by exact old value, so a changed
// source text fails the import instead of silently keeping the sentence the project team removed.
for (const change of overrides.pages ?? []) {
  const page = rawData.pages.find(item => item.page_id === change.page_id)
  if (!page) throw new Error(`Overrides: unknown page "${change.page_id}"`)
  if (page.summary !== change.summary.from) throw new Error(`Overrides: page "${change.page_id}" summary does not match the expected text`)
  page.summary = change.summary.to
  for (const sentence of change.body ?? []) {
    const matches = page.body.flatMap((paragraph, index) => paragraph.includes(sentence.from) ? [index] : [])
    if (matches.length !== 1) throw new Error(`Overrides: page "${change.page_id}" body sentence found in ${matches.length} paragraphs, expected 1`)
    page.body[matches[0]] = patch(page.body[matches[0]], sentence.from, sentence.to, `page ${change.page_id} body`)
  }
}
for (const change of overrides.diagrams ?? []) {
  if (typeof rawDiagrams[change.diagram_id] !== 'string') throw new Error(`Overrides: unknown diagram "${change.diagram_id}"`)
  rawDiagrams[change.diagram_id] = patch(rawDiagrams[change.diagram_id], change.from, change.to, `diagram ${change.diagram_id}`)
}

// New photos join TIANMU_OFFLINE_ASSETS as data URLs, so the existing extract/rewrite/manifest
// pipeline stores them exactly like the inline photos and reports them in NOTICE.md.
const mimePrefix = `data:image/webp;base64,`
for (const card of rawData.landmarks.cards) {
  for (const photo of card.photos) {
    if (!photo.__source) continue
    const file = photo.file.replace(/^assets\/landmarks\//, '')
    const original = await readFile(photo.__source)
    const digest = createHash('sha256').update(original).digest('hex')
    // Only photos added from local files are capped; inline lesson photos keep their size.
    const source = await sharp(original).metadata()
    const scaled = source.width > 2000 || source.height > 2000
    const converted = await sharp(original)
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90, effort: 5 })
      .toBuffer()
    if ((await sharp(converted).metadata()).exif) throw new Error(`Overrides: ${file} kept EXIF data`)
    // The manifest and NOTICE must describe what actually happened to this file.
    if (scaled) photo.changes = '缩放至长边不超过 2000 px，转换为 WebP，未裁剪'
    // extractImages picks this URL up after landmarkNames is built and stores it under the
    // supplied file name, so the file, manifest entry and NOTICE line are produced once.
    rawAssets[`assets/landmarks/${file}`] = mimePrefix + converted.toString('base64')
    rawData.landmarks.photos[file.replace(/\.webp$/, '')] = {
      ...userAttribution, file: `assets/landmarks/${file}`, path: `assets/landmarks/${file}`,
      file_name: file, caption: photo.caption, alt: photo.alt, changes: photo.changes,
    }
    photo.file = `assets/landmarks/${file}`
    delete photo.__source
    delete photo.position
    delete photo.source
  }
}

const landmarkNames = new Map()
for (const [key, value] of Object.entries(rawAssets)) {
  if (key.startsWith('assets/landmarks/') && typeof value === 'string' && value.includes(';base64,')) landmarkNames.set(value, key)
}
if (!landmarkNames.size) throw new Error('No inline landmark photos found in TIANMU_OFFLINE_ASSETS')

await extractImages(atlas)
await extractImages(tianmu, landmarkNames)
// extractImages only reads the source HTML, so photos added from local files are stored here.
for (const [key, dataUrl] of Object.entries(rawAssets)) {
  if (!imageUrls.has(dataUrl)) {
    const converted = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
    const relative = key.replace(/^assets\//, 'tianmu/')
    await save(relative, converted)
    imageUrls.set(dataUrl, `/lessons/${relative}`)
    imageMetadata.push({ path: relative, landmark: key, original_sha256: createHash('sha256').update(converted).digest('hex'), bytes: converted.length })
  }
}

const data = rewrite(rawData)
const diagrams = rewrite(rawDiagrams)
const assets = rewrite(rawAssets)
await save('tianmu/data.json', JSON.stringify(data))
await save('tianmu/diagrams.json', JSON.stringify(diagrams))
await save('tianmu/assets.json', JSON.stringify(assets))

const atlasScripts = scripts(atlas)
if (atlasScripts.length !== 3) throw new Error('Unexpected atlas script structure')
await save('vegetation-atlas/three.js', atlasScripts[0])
await save('vegetation-atlas/atlas.js', atlasScripts[2]
  .replace("$('probe').hidden=m==='nature';", "$('probe').hidden=!['temp','rain'].includes(m);")
  .replace('camera.aspect=w/h;camera.updateProjectionMatrix();', 'camera.aspect=w/h;camera.zoom=Math.min(1,w/760);camera.updateProjectionMatrix();'))
const atlasAssets = rewrite(assignment(atlasScripts[1], 'const ASSETS'))
const atlasStyles = [...atlas.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n')
await save('vegetation-atlas/atlas.css', atlasStyles)
let scriptIndex = 0
const atlasDocument = atlas
  .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
  .replace('</head>', '<link rel="stylesheet" href="./atlas.css"><link rel="stylesheet" href="./embedded.css"></head>')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, () => [
    '<script src="./three.js"></script>',
    `<script>const ASSETS=${JSON.stringify(atlasAssets)};</script>`,
    '<script src="./atlas.js"></script><script src="./host.js"></script>',
  ][scriptIndex++])
await save('vegetation-atlas/index.html', atlasDocument)

const styles = [...tianmu.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1])
if (styles[0].trim() !== 'html,body{margin:0;padding:0}') throw new Error('Unexpected leading Tianmu style block')
await save('tianmu/study.css', styles.slice(1).join('\n').replace(/[ \t]+$/gm, ''))

let library = tianmuScripts.slice(1).join('\n;\n')
// Keep original documents local; the lesson keeps citations and chart comparisons but not the reader.
library = patchPattern(
  library,
  /<div class="tm-original-reading">[\s\S]*?<\/div>/g,
  '',
  'drop original-reader links',
)
library = patch(
  library,
  'requestAnimationFrame(()=>tour?.maybeStart());',
  'requestAnimationFrame(()=>{if(options.autoTour!==false&&!signal.aborted)tour?.maybeStart()});',
  'allow the host to disable the automatic tour',
)
library = patch(
  library,
  'const visited=unique([...loaded.visited,...state.visited]);',
  'if(signal.aborted)return api;const visited=unique([...loaded.visited,...state.visited]);',
  'skip restored state after destroy',
)
library = patch(
  library,
  "await persist();post('tianmu:ready'",
  "if(signal.aborted)return api;await persist();post('tianmu:ready'",
  'skip ready persistence after destroy',
)
library = patch(
  library,
  "persist().then(stored=>{if(stored)announce(options.storageAdapter?'观察已保存。':'观察已记录在当前浏览器。')});q('[data-dialog=note]').close();render();break;}",
  "persist().then(stored=>{if(stored){q('[data-dialog=note]').close();render();announce(options.storageAdapter?'观察已保存。':'观察已记录在当前浏览器。')}});break;}",
  'keep the observation dialog open when persistence fails',
)
// The VE05 "群落外貌" line is hard-coded in the library, not read from data, so it is patched here.
library = patch(
  library,
  "'出现包括黄山松在内的针叶树，与落叶阔叶树共同分布。'",
  `'${rawData.vegetation.find(item => item.vegetation_id === 'course_upper_mixed').appearance}'`,
  'use the upper-belt community description from the vegetation data',
)
// The mountain sketch pins the six original stops by name and position; the new summit stop is added
// next to the 仙人顶 label so the numbered marker list keeps matching data.landmarks.cards.
library = patch(
  library,
  "['禅源寺','约325—350 m',26,84],['三里亭','约640 m',44,66],['七里亭','约960 m',57,45],['大树王','约1010 m',64,41],['开山老殿','约1020—1100 m',69,36],['古道柳杉','沿古道观察',35,76]]",
  "['禅源寺','约325—350 m',26,84],['三里亭','约640 m',44,66],['七里亭','约960 m',57,45],['大树王','约1010 m',64,41],['开山老殿','约1020—1100 m',69,36],['仙人顶','1506 m',93,13],['古道柳杉','沿古道观察',35,76]]",
  'add the summit stop to the mountain sketch',
)
await save('tianmu/study.js', library)

const pageIndex = data.pages.map(page => ({
  id: page.page_id, title: page.title, group: data.ui_navigation.groups.find(group => group.page_ids.includes(page.page_id)).label,
}))
await writeFile(path.join(root, 'src/course/geography-pages.json'), JSON.stringify(pageIndex, null, 2) + '\n')

const landmarkPhotos = Object.entries(data.landmarks.photos).map(([id, photo]) => ({
  id,
  asset: photo.path,
  caption: photo.caption,
  author: photo.author,
  license: photo.license || null,
  source: photo.source || null,
  changes: photo.changes,
}))
const landmarkManifest = landmarkPhotos.map(photo => {
  const image = imageMetadata.find(item => item.landmark === photo.asset)
  if (!image) throw new Error(`Landmark photo not extracted: ${photo.asset}`)
  return { ...photo, path: image.path, bytes: image.bytes }
})

const manifest = {
  imported_on: '2026-11-05',
  sources: [
    { file: path.basename(atlasPath), sha256: createHash('sha256').update(atlas).digest('hex') },
    { file: path.basename(tianmuPath), sha256: createHash('sha256').update(tianmu).digest('hex') },
  ],
  tianmu_version: data.version,
  pages: data.pages.length,
  datasets: data.datasets.length,
  charts: data.charts.length,
  images: imageMetadata,
  landmarks: { cards: data.landmarks.cards.map(card => ({ id: card.id, title: card.title, photos: card.photos.map(photo => photo.file) })), photos: landmarkManifest },
  original_readers_included: false,
  changes: [
    'Extract inline images as deduplicated WebP files without cropping or resizing.',
    'Store landmark-card photos under tianmu/landmarks/ with their supplied file names so cards can be replaced or added.',
    'Show the climate query only in climate modes so route controls remain clickable.',
    'Fit the globe to narrow workspace widths without clipping either side.',
    'Load Tianmu through its existing mount/destroy API and scoped CSS.',
    'Allow the host to disable the automatic operation tour.',
    'Skip asynchronous state rendering when the mounted lesson has been destroyed.',
    'Keep the observation editor open if browser persistence fails.',
    'Retain citations and source figures; exclude full original-document readers.',
  ],
}
await save('sources.json', JSON.stringify(manifest, null, 2) + '\n')

const landmarkLines = landmarkManifest.map(photo => {
  const credit = [photo.author, photo.license].filter(Boolean).join(' · ')
  const source = photo.source ? `；${photo.source}` : ''
  return `- \`${photo.path}\`（${photo.caption}）：${credit || '来源未注明'}${source}。修改：${photo.changes}。`
})
await save('NOTICE.md', `# Geography lesson sources

Imported on 2026-11-05 from the two HTML lessons supplied by the project team.
Source hashes and transformations are recorded in sources.json.

The vegetation atlas includes Three.js r160, copyright Three.js Authors, MIT.
The Tianmu lesson includes Driver.js, copyright Kamran Ahmed, MIT.
The bundled Three.js notice is retained. Both license texts are in LICENSES.txt.
Teaching images, AI illustrations, figures and dataset citations retain the
provenance supplied in the lessons; importing them does not establish independent
scientific verification or grant a new license. Confirm teaching media rights
before public deployment. Original reference-document readers are excluded.
The optional NASA POWER query and external vegetation reference map require a
network connection; the core lessons use local files.

## 古道地点卡照片

以下照片随课程的古道地点卡发布，作者与许可保留在每张卡片底部。通用林木与林道照片只作沿线环境观察，不作为大树王、三里亭或开山老殿的单株或定位证据；用户采集照片不另行授予第三方许可。

${landmarkLines.join('\n')}

${data.landmarks.source_notes.map(note => `- ${note}`).join('\n')}
`)

console.log(JSON.stringify({
  version: data.version,
  pages: data.pages.length,
  datasets: data.datasets.length,
  charts: data.charts.length,
  images: imageMetadata.length,
  image_bytes: imageMetadata.reduce((sum, image) => sum + image.bytes, 0),
  landmark_cards: data.landmarks.cards.length,
  landmark_photos: landmarkManifest.length,
}, null, 2))
