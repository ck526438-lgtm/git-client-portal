import fs from 'node:fs'
import path from 'node:path'
import { buildContent } from '../lib/content-io.mjs'

const root = process.cwd()
const out = path.join(root, 'generated')

let content
try {
  content = buildContent(root)
} catch (error) {
  console.error(`\n  Le portail n'a pas pu etre genere.\n  ${error.message}\n`)
  process.exit(1)
}

fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'content.json'), JSON.stringify(content, null, 2))

const { stats } = content
console.log(
  `Contenu genere : ${content.milestones.length} etapes, ${content.updates.length} nouvelles, ` +
    `${content.deliverables.length} livrables, ${content.invoices.length} factures, ${stats.overall}% avance.`,
)
