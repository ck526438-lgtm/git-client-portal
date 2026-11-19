#!/usr/bin/env node
/**
 * Assistant de démarrage : `npm run init`
 * Pose quelques questions, écrit content/project.yaml et content/milestones.yaml,
 * retire (au choix) le contenu de démonstration, publie une première nouvelle et
 * génère un mot de passe + une clé dans .env.local.
 *
 * Mode non interactif (scripts, CI) : `npm run init -- --oui --studio "Mon studio" --client "Client" --titre "Projet"`
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import yaml from 'js-yaml'

const root = process.cwd()
const content = path.join(root, 'content')
const args = process.argv.slice(2)
const auto = args.includes('--oui')

function flag(name) {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : undefined
}

const today = new Date().toISOString().slice(0, 10)
const inThreeMonths = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10)

const rl = auto ? null : readline.createInterface({ input, output })

async function ask(label, fallback = '', { validate } = {}) {
  const preset = flag(label.key)
  if (preset !== undefined) return preset
  if (auto) return fallback
  for (;;) {
    const answer = (await rl.question(`  ${label.text}${fallback ? ` (${fallback})` : ''} : `)).trim() || fallback
    const problem = validate ? validate(answer) : null
    if (!problem) return answer
    console.log(`    ↳ ${problem}`)
  }
}

async function confirm(text, fallback = true) {
  if (auto) return fallback
  const answer = (await rl.question(`  ${text} ${fallback ? '[O/n]' : '[o/N]'} : `)).trim().toLowerCase()
  if (!answer) return fallback
  return answer.startsWith('o') || answer.startsWith('y')
}

const required = (value) => (value ? null : 'Champ obligatoire.')
const email = (value) => (!value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Adresse e-mail invalide.')
const date = (value) => (!value || /^\d{4}-\d{2}-\d{2}$/.test(value) ? null : 'Format attendu : AAAA-MM-JJ.')
const color = (value) => (/^#[0-9a-fA-F]{6}$/.test(value) ? null : 'Couleur attendue au format #4f46e5.')

function slug(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

console.log('\n  Portail client · configuration en 2 minutes\n')

const studio = await ask({ key: 'studio', text: 'Nom de votre studio ou de votre activité' }, '', { validate: required })
const studioEmail = await ask({ key: 'email', text: 'E-mail de contact' }, '', { validate: email })
const accent = await ask({ key: 'couleur', text: 'Couleur de votre marque' }, '#4f46e5', { validate: color })
const client = await ask({ key: 'client', text: 'Nom du client' }, '', { validate: required })
const contact = await ask({ key: 'contact', text: 'Interlocuteur chez le client (facultatif)' })
const title = await ask({ key: 'titre', text: 'Titre du projet' }, '', { validate: required })
const reference = await ask({ key: 'reference', text: 'Référence du dossier (facultatif)' })
const startedOn = await ask({ key: 'debut', text: 'Date de début' }, today, { validate: date })
const targetOn = await ask({ key: 'fin', text: 'Date de livraison visée' }, inThreeMonths, { validate: date })
const wipe = await confirm('Retirer le contenu de démonstration (nouvelles, livrables, factures) ?', true)

const project = {
  branding: { studio, tagline: 'Portail de suivi de votre projet', accent },
  project: {
    title,
    client,
    ...(contact ? { contact } : {}),
    ...(reference ? { reference } : {}),
    summary: `Suivi partagé du projet « ${title} » pour ${client}.`,
    started_on: startedOn,
    target_on: targetOn,
  },
  status: 'active',
  contact: studioEmail ? { email: studioEmail } : {},
  team: [{ name: studio, role: 'Direction de projet', ...(studioEmail ? { email: studioEmail } : {}) }],
  links: studioEmail ? [{ label: "Écrire à l'équipe", url: `mailto:${studioEmail}`, kind: 'email' }] : [],
  support: { hours: 'Du lundi au vendredi, 9h - 18h', note: 'Réponse sous 24 h ouvrées.' },
  billing: { terms: 'Règlement à 30 jours par virement.' },
}

const milestones = {
  milestones: [
    { id: 'cadrage', title: 'Cadrage', status: 'active', progress: 10, start: startedOn, due: startedOn },
    { id: 'realisation', title: 'Réalisation', status: 'planned', progress: 0, start: startedOn, due: targetOn },
    { id: 'livraison', title: 'Livraison', status: 'planned', progress: 0, start: targetOn, due: targetOn },
  ],
}

if (wipe) {
  for (const folder of ['updates', 'deliverables', 'invoices']) {
    const dir = path.join(content, folder)
    if (fs.existsSync(dir)) for (const file of fs.readdirSync(dir)) if (file.endsWith('.md')) fs.rmSync(path.join(dir, file))
    fs.mkdirSync(dir, { recursive: true })
  }
}

const header = '# Généré par « npm run init ». Modifiez librement : le build valide chaque champ.\n'
fs.writeFileSync(path.join(content, 'project.yaml'), header + yaml.dump(project, { lineWidth: 100, quotingType: '"' }))
fs.writeFileSync(path.join(content, 'milestones.yaml'), header + yaml.dump(milestones, { lineWidth: 100 }))

const welcome = path.join(content, 'updates', `bienvenue-${slug(client) || 'client'}.md`)
fs.writeFileSync(
  welcome,
  `---
date: ${today}
title: "Bienvenue sur votre portail"
kind: note
milestone: cadrage
summary: "Toutes les nouvelles du projet, les livrables et les factures, au même endroit."
---

Bonjour${contact ? ` ${contact}` : ''},

Ce portail rassemble tout ce qui concerne « ${title} » : l'avancement, les documents à valider et la facturation.
Il est mis à jour par l'équipe à chaque étape ; vous n'avez rien à installer ni de compte à créer.

Pour l'avoir sous la main, ouvrez la page **Application** : le portail s'installe sur téléphone et ordinateur.
`,
)

const envFile = path.join(root, '.env.local')
let password = ''
if (!fs.existsSync(envFile) || (await confirm('Un fichier .env.local existe déjà. Le remplacer ?', false))) {
  password = crypto.randomBytes(9).toString('base64url')
  const secret = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(
    envFile,
    `# Généré par « npm run init » — à recopier dans les variables d'environnement de l'hébergeur.\nPORTAL_PASSWORD=${password}\nPORTAL_SECRET=${secret}\nREDEPLOY_HOOK_URL=\n`,
  )
}

rl?.close()

console.log(`
  ✓ content/project.yaml et content/milestones.yaml écrits
  ✓ première nouvelle : ${path.relative(root, welcome)}${wipe ? '\n  ✓ contenu de démonstration retiré' : ''}${
    password ? `\n  ✓ .env.local créé — mot de passe à transmettre au client : ${password}` : ''
  }

  Ensuite :
    npm run dev                       aperçu sur http://localhost:3000
    git add -A && git commit -m "Portail ${client}" && git push
    puis déployez sur Vercel ou Netlify (boutons dans le README).
`)
