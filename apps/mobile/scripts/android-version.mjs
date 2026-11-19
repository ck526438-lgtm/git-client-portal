// Aligne versionName/versionCode du projet Android sur package.json
// (1.2.3 → versionCode 10203) pour que les mises à jour de l'APK s'installent par-dessus.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const [major, minor, patch] = version.split('.').map((part) => Number.parseInt(part, 10) || 0)
const code = major * 10000 + minor * 100 + patch

const gradle = path.join(root, 'android', 'app', 'build.gradle')
if (!fs.existsSync(gradle)) {
  console.error('android/app/build.gradle introuvable : lancez « npx cap add android » d’abord.')
  process.exit(1)
}
const source = fs
  .readFileSync(gradle, 'utf8')
  .replace(/versionCode \d+/, `versionCode ${code}`)
  .replace(/versionName "[^"]*"/, `versionName "${version}"`)
fs.writeFileSync(gradle, source)
console.log(`Android : versionName ${version}, versionCode ${code}`)
