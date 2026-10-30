import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { access, mkdir, readdir } from 'node:fs/promises'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(new URL('../frontend/package.json', import.meta.url))
const sharp = require('sharp')

const source = process.env.GEOVR_PHOTO_DIR
  ? path.resolve(process.env.GEOVR_PHOTO_DIR)
  : path.resolve(root, '../天目山柳杉照片-2026/天目山照片-202608/普通照片-ziyao')
const destination = path.join(root, 'frontend/public/media')
const photos = [
  ['IMG_20260820_111143.jpg', 'forest-floor'],
  ['IMG_20260820_122236.jpg', 'forest-detail'],
  ['IMG_20260820_124918.jpg', 'forest-canopy'],
]
for (const [filename] of photos) {
  try {
    await access(path.join(source, filename))
  } catch (error) {
    throw new Error(`Missing ${filename}. Set GEOVR_PHOTO_DIR to your authorized local photo directory.`, { cause: error })
  }
}
await mkdir(destination, { recursive: true })
for (const [filename, name] of photos) {
  await sharp(path.join(source, filename))
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(destination, `${name}.webp`))
  await sharp(path.join(source, filename))
    .rotate()
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(destination, `${name}-thumb.webp`))
}
console.log(`Prepared ${photos.length} photographs (${(await readdir(destination)).length} files). Originals unchanged.`)

const panoramaSource = process.env.GEOVR_PANORAMA_DIR
  ? path.resolve(process.env.GEOVR_PANORAMA_DIR)
  : path.resolve(source, '../../天目山全景图片-202608/CAM_001')
const panoramas = ['CAM_20260818103558_0030_D.JPG', 'CAM_20260818103703_0032_D.JPG', 'CAM_20260818103812_0034_D.JPG']
for (const [index, filename] of panoramas.entries()) {
  const input = path.join(panoramaSource, filename)
  try { await access(input) } catch {
    console.log(`Panorama ${index + 1} unavailable. Set GEOVR_PANORAMA_DIR to the authorized CAM_001 folder.`)
    continue
  }
  const metadata = await sharp(input).metadata()
  if (metadata.width !== metadata.height * 2) throw new Error(`${filename} is not a full 2:1 equirectangular panorama.`)
  await sharp(input).resize({ width: 4096, withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(destination, `panorama-${index + 1}.webp`))
}
console.log('Panorama previews prepared when available. Original photos and previews stay outside Git.')
const primaryPanorama = process.env.GEOVR_PANORAMA_PATH || path.join(panoramaSource, panoramas[0])
await sharp(primaryPanorama).resize({ width: 4096, withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(destination, 'tianmu-panorama.webp'))
