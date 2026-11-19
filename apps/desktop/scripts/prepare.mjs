// Copie l'écran d'accueil partagé (apps/shell) dans l'application de bureau.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const source = path.resolve(here, '..', '..', 'shell')
const target = path.resolve(here, '..', 'shell')

fs.rmSync(target, { recursive: true, force: true })
fs.cpSync(source, target, { recursive: true })
console.log(`Écran d'accueil copié dans ${path.relative(process.cwd(), target) || '.'}`)
