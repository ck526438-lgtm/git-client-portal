import fs from 'node:fs/promises'
import path from 'node:path'

// Où l'éditeur lit et écrit le contenu du portail.
// - GitHub (production) : chaque enregistrement est un commit sur le dépôt, que
//   l'hébergeur (Vercel, Netlify) détecte pour reconstruire le portail.
// - Disque local (développement, sans GITHUB_TOKEN) : écrit directement dans content/.

export interface StoredFile {
  path: string
  text: string
  sha: string
}

export interface Store {
  mode: 'github' | 'local'
  label: string
  list(dir: string): Promise<string[]>
  read(file: string): Promise<StoredFile | null>
  write(file: string, text: string, message: string, sha?: string): Promise<void>
  remove(file: string, message: string, sha: string): Promise<void>
}

export class StoreError extends Error {}

export function githubConfig() {
  const token = process.env.GITHUB_TOKEN?.trim()
  const repo = process.env.GITHUB_REPO?.trim()
  const branch = process.env.GITHUB_BRANCH?.trim() || 'main'
  if (!token || !repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null
  return { token, repo, branch }
}

function githubStore(config: { token: string; repo: string; branch: string }): Store {
  const base = `https://api.github.com/repos/${config.repo}/contents`

  async function call(url: string, init: RequestInit = {}) {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'portail-client-editeur',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
    if (response.status === 404) return null
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}))
      if (response.status === 401) throw new StoreError('Jeton GitHub refusé : vérifiez GITHUB_TOKEN.')
      if (response.status === 403) throw new StoreError('Le jeton GitHub n’a pas le droit d’écrire sur ce dépôt (permission « Contents : Read and write »).')
      if (response.status === 409) throw new StoreError('Le fichier a changé entre-temps. Rechargez la page puis réessayez.')
      throw new StoreError(`GitHub a répondu ${response.status} : ${(detail as { message?: string }).message ?? 'erreur inconnue'}`)
    }
    return response.json()
  }

  const ref = `ref=${encodeURIComponent(config.branch)}`

  return {
    mode: 'github',
    label: `${config.repo} (branche ${config.branch})`,
    async list(dir) {
      const data = await call(`${base}/${dir}?${ref}`)
      if (!Array.isArray(data)) return []
      return data.filter((item) => item.type === 'file').map((item) => item.name as string)
    },
    async read(file) {
      const data = await call(`${base}/${file}?${ref}`)
      if (!data || Array.isArray(data) || typeof data.content !== 'string') return null
      return { path: file, sha: data.sha, text: Buffer.from(data.content, 'base64').toString('utf8') }
    },
    async write(file, text, message, sha) {
      await call(`${base}/${file}`, {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content: Buffer.from(text, 'utf8').toString('base64'),
          branch: config.branch,
          ...(sha ? { sha } : {}),
        }),
      })
    },
    async remove(file, message, sha) {
      await call(`${base}/${file}`, {
        method: 'DELETE',
        body: JSON.stringify({ message, sha, branch: config.branch }),
      })
    },
  }
}

function localStore(root: string): Store {
  const resolve = (file: string) => {
    const full = path.resolve(root, file)
    if (!full.startsWith(path.resolve(root, 'content') + path.sep)) throw new StoreError('Chemin refusé.')
    return full
  }
  const sha = (text: string) => `${text.length}:${Buffer.from(text).toString('base64').slice(-12)}`

  return {
    mode: 'local',
    label: 'fichiers locaux (mode développement)',
    async list(dir) {
      try {
        return (await fs.readdir(resolve(`${dir}/.`))).filter((name) => !name.startsWith('.'))
      } catch {
        return []
      }
    },
    async read(file) {
      try {
        const text = await fs.readFile(resolve(file), 'utf8')
        return { path: file, text, sha: sha(text) }
      } catch {
        return null
      }
    },
    async write(file, text) {
      const full = resolve(file)
      await fs.mkdir(path.dirname(full), { recursive: true })
      await fs.writeFile(full, text, 'utf8')
    },
    async remove(file) {
      await fs.rm(resolve(file), { force: true })
    },
  }
}

/** Le stockage actif, ou null si l'éditeur n'est pas configuré en production. */
export function getStore(): Store | null {
  const config = githubConfig()
  if (config) return githubStore(config)
  if (process.env.NODE_ENV !== 'production' || process.env.ADMIN_LOCAL_WRITE === '1') return localStore(process.cwd())
  return null
}
