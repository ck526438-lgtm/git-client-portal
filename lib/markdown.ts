import { Marked, type Tokens } from 'marked'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeHref(href: string): string {
  return /^(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : '#'
}

const marked = new Marked({ gfm: true, breaks: false })

marked.use({
  renderer: {
    // Le contenu vient du dépôt : on échappe le HTML brut pour qu'aucun script ne passe.
    html(token: Tokens.HTML | Tokens.Tag | string): string {
      return escapeHtml(typeof token === 'string' ? token : token.text)
    },
    link(token: Tokens.Link): string {
      const href = safeHref(String(token.href ?? ''))
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : ''
      const external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''
      const label = this.parser.parseInline(token.tokens ?? [])
      return `<a href="${escapeHtml(href)}"${title}${external}>${label}</a>`
    },
  },
})

export function renderMarkdown(source: string): string {
  if (!source.trim()) return ''
  return marked.parse(source, { async: false }) as string
}
