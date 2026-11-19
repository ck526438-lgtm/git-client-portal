import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/admin-nav'
import { ADMIN_COOKIE, isValidAdminToken } from '@/lib/auth'
import { getStore, githubConfig } from '@/lib/admin/store'
import { getContent } from '@/lib/content'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const jar = await cookies()
  if (!(await isValidAdminToken(jar.get(ADMIN_COOKIE)?.value))) redirect('/admin/connexion')

  const store = getStore()
  const content = await getContent().catch(() => null)
  const studio = content?.project.studio ?? 'Portail'

  return (
    <>
      <AdminNav studio={studio} />
      <main id="contenu" className="shell admin-shell">
        {!store ? (
          <section className="card card-pad setup">
            <h1>Reliez l’éditeur à votre dépôt GitHub</h1>
            <p>
              L’éditeur enregistre chaque modification comme un commit sur votre dépôt, puis votre hébergeur reconstruit
              le portail. Ajoutez ces variables d’environnement chez votre hébergeur, puis redéployez :
            </p>
            <ol className="plain-list">
              <li>
                <code>GITHUB_REPO</code> : <code>votre-compte/votre-depot</code>
              </li>
              <li>
                <code>GITHUB_TOKEN</code> : un jeton « fine-grained » limité à ce dépôt, permission{' '}
                <strong>Contents : Read and write</strong> (GitHub → Settings → Developer settings → Personal access tokens).
              </li>
              <li>
                <code>GITHUB_BRANCH</code> (facultatif) : la branche déployée, <code>main</code> par défaut.
              </li>
            </ol>
          </section>
        ) : (
          <>
            {store.mode === 'local' ? (
              <div className="alert" data-tone="info" style={{ marginTop: 22 }}>
                Mode développement : les modifications sont écrites directement dans <code>content/</code>. En production,
                renseignez <code>GITHUB_TOKEN</code> et <code>GITHUB_REPO</code>.
              </div>
            ) : null}
            {children}
          </>
        )}
        <p className="mono-note admin-foot">
          Stockage : {store ? store.label : 'non configuré'}
          {githubConfig() ? ' · chaque enregistrement crée un commit, le portail se met à jour en 1 minute environ' : ''}
        </p>
      </main>
    </>
  )
}
