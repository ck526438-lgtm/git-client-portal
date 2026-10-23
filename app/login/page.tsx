import type { Metadata } from 'next'
import { isConfigured } from '@/lib/auth'
import { getContent } from '@/lib/content'

export const metadata: Metadata = { title: 'Accès au portail' }

interface Props {
  searchParams: Promise<{ error?: string; retour?: string }>
}

const MESSAGES: Record<string, string> = {
  motdepasse: 'Mot de passe incorrect. Vérifiez la majuscule et le pavé numérique.',
  trop_essais: 'Trop de tentatives. Réessayez dans quinze minutes.',
  configuration: 'Le mot de passe du portail n’est pas encore configuré côté hébergeur.',
  deconnecte: 'Vous êtes déconnecté. Saisissez à nouveau votre mot de passe.',
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, retour } = await searchParams
  const content = await getContent().catch(() => null)
  const project = content?.project
  const target = retour && retour.startsWith('/') && !retour.startsWith('//') ? retour : '/'

  return (
    <div className="login-wrap">
      <form className="login-card" method="post" action="/api/login">
        <p className="eyebrow">{project ? project.studio : 'Espace client'}</p>

        {project ? (
          <h1>{project.title}</h1>
        ) : (
          <h1>Portail de suivi de projet</h1>
        )}

        <p className="lede">
          {project
            ? `Suivi partagé avec ${project.client}${project.reference ? ` · dossier ${project.reference}` : ''}. `
            : 'Cet espace est réservé. '}
          Tout est tenu à jour par l’équipe, sans compte à créer.
        </p>

        {error && MESSAGES[error] ? (
          <div className="alert" data-tone={error === 'configuration' ? 'info' : 'bad'} role="alert">
            {MESSAGES[error]}
          </div>
        ) : null}

        {!isConfigured() ? (
          <div className="alert" data-tone="info">
            Déploiement incomplet : renseignez la variable <code>PORTAL_PASSWORD</code> dans les réglages de
            l’hébergeur, puis redéployez.
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="motdepasse">Mot de passe</label>
          <input
            id="motdepasse"
            name="motdepasse"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            placeholder="••••••••"
          />
        </div>

        <input type="hidden" name="retour" value={target} />

        <button className="btn primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}>
          Entrer dans le portail
        </button>

        <p className="mono-note" style={{ marginTop: 16, marginBottom: 0 }}>
          Un mot de passe, aucune base de données. Le contenu provient d’un dépôt Git, révisable à tout moment.
        </p>
      </form>
    </div>
  )
}
