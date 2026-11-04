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

async function extractImages(source) {
  for (const match of source.matchAll(imagePattern)) {
    const dataUrl = match[0]
    if (imageUrls.has(dataUrl)) continue
    const original = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
    const digest = createHash('sha256').update(original).digest('hex').slice(0, 20)
    const relative = `images/${digest}.webp`
    const converted = await sharp(original).webp({ quality: 90, effort: 5 }).toBuffer()
    await save(relative, converted)
    imageUrls.set(dataUrl, `/lessons/${relative}`)
    imageMetadata.push({ path: relative, original_sha256: createHash('sha256').update(original).digest('hex'), bytes: converted.length })
  }
}

function rewrite(value) {
  if (typeof value === 'string') return value.replace(imagePattern, image => imageUrls.get(image) || image)
  if (Array.isArray(value)) return value.map(rewrite)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewrite(item)]))
  return value
}

const [atlas, tianmu] = await Promise.all([readFile(atlasPath, 'utf8'), readFile(tianmuPath, 'utf8')])
await extractImages(atlas)
await extractImages(tianmu)

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

const tianmuScripts = scripts(tianmu)
if (tianmuScripts.length !== 9) throw new Error('Unexpected Tianmu script structure')
const data = rewrite(assignment(tianmuScripts[0], 'window.TIANMU_DATA'))
const diagrams = rewrite(assignment(tianmuScripts[0], 'window.TIANMU_DIAGRAMS'))
const assets = rewrite(assignment(tianmuScripts[0], 'window.TIANMU_OFFLINE_ASSETS'))
await save('tianmu/data.json', JSON.stringify(data))
await save('tianmu/diagrams.json', JSON.stringify(diagrams))
await save('tianmu/assets.json', JSON.stringify(assets))
const styles = [...tianmu.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1])
await save('tianmu/study.css', styles.slice(1).join('\n').replace(/[ \t]+$/gm, ''))

let library = tianmuScripts.slice(1).join('\n;\n')
// Keep original documents local; the lesson retains citations and chart comparisons.
library = library.replace(/<div class="tm-original-reading">[\s\S]*?<\/div>/, '')
library = library.replace(
  "requestAnimationFrame(()=>tour?.maybeStart());",
  "requestAnimationFrame(()=>{if(options.autoTour!==false&&!signal.aborted)tour?.maybeStart()});",
)
library = library.replace(
  'const visited=unique([...loaded.visited,...state.visited]);',
  'if(signal.aborted)return api;const visited=unique([...loaded.visited,...state.visited]);',
)
library = library.replace('await persist();post(\'tianmu:ready\'', 'if(signal.aborted)return api;await persist();post(\'tianmu:ready\'')
library = library.replace(
  "persist().then(stored=>{if(stored)announce(options.storageAdapter?'观察已保存。':'观察已记录在当前浏览器。')});q('[data-dialog=note]').close();render();break;}",
  "persist().then(stored=>{if(stored){q('[data-dialog=note]').close();render();announce(options.storageAdapter?'观察已保存。':'观察已记录在当前浏览器。')}});break;}",
)
await save('tianmu/study.js', library)

const pageIndex = data.pages.map(page => ({
  id: page.page_id, title: page.title, group: data.ui_navigation.groups.find(group => group.page_ids.includes(page.page_id)).label,
}))
await writeFile(path.join(root, 'src/course/geography-pages.json'), JSON.stringify(pageIndex, null, 2) + '\n')

const manifest = {
  imported_on: '2026-11-04',
  sources: [
    { file: path.basename(atlasPath), sha256: createHash('sha256').update(atlas).digest('hex') },
    { file: path.basename(tianmuPath), sha256: createHash('sha256').update(tianmu).digest('hex') },
  ],
  tianmu_version: data.version,
  pages: data.pages.length,
  datasets: data.datasets.length,
  charts: data.charts.length,
  images: imageMetadata,
  original_readers_included: false,
  changes: [
    'Extract inline images as deduplicated WebP files without cropping or resizing.',
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
await save('NOTICE.md', `# Geography lesson sources

Imported on 2026-11-04 from the two HTML lessons supplied by the project team.
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
`)
console.log(JSON.stringify({ pages: data.pages.length, datasets: data.datasets.length, charts: data.charts.length, images: imageMetadata.length, image_bytes: imageMetadata.reduce((sum, image) => sum + image.bytes, 0) }, null, 2))
