import type { CSSProperties, ReactNode } from 'react'
import PortalHeader from '@/components/portal-header'
import TimeAgo from '@/components/time-ago'
import { getContent } from '@/lib/content'
import { frDate } from '@/lib/format'

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const content = await getContent()
  const project = content.project
  const last = content.stats.last_update

  return (
    <div style={{ '--accent': project.accent } as CSSProperties}>
      <PortalHeader
        studio={project.studio}
        tagline={project.tagline || project.title}
        projectTitle={project.title}
        canSync={Boolean(process.env.REDEPLOY_HOOK_URL)}
      />
      <main id="contenu" className="shell">
        {children}
      </main>
      <div className="shell">
        <footer className="footer">
          <span>
            {project.studio}
            {project.reference ? ` · dossier ${project.reference}` : ''}
            {project.email ? (
              <>
                {' · '}
                <a href={`mailto:${project.email}`}>{project.email}</a>
              </>
            ) : null}
          </span>
          <span>
            {last ? (
              <>
                Dernière publication le {frDate(last.date)}
                <TimeAgo date={last.date} />
              </>
            ) : (
              'Portail prêt'
            )}
          </span>
        </footer>
      </div>
    </div>
  )
}
