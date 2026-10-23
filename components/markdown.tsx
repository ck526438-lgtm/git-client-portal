import { renderMarkdown } from '@/lib/markdown'

export default function Markdown({ source }: { source: string }) {
  if (!source.trim()) return null
  return <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />
}
