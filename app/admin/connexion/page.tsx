import type { Metadata } from 'next'
import { isAdminConfigured } from '@/lib/auth'
import { getContent } from '@/lib/content'

export const metadata: Metadata = { title: 'Connexion à l’éditeur' }

const MESSAGES: Record<string, string> = {
  motdepasse: 'Mot de passe incorrect.',
  trop_essais: 'Trop de tentatives. Réessayez dans quinze minutes.',
  configuration: 'Le mot de passe de l’éditeur n’est pas configuré.',
  deconnecte: 'Vous êtes déconnecté de l’éditeur.',
}

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams
  const content = await getContent().catch(() => null)

  return (
    <div className="login-wrap">
      <form className="login-card" method="post" action="/api/admin/login">
        <p className="eyebrow">{content?.project.studio ?? 'Portail client'} · éditeur</p>
        <h1>Gérer le portail</h1>
        <p className="lede">
          Publiez des nouvelles, des livrables et des factures sans toucher au code. Cet espace est réservé à l’équipe :
          votre client n’y a pas accès.
        </p>

        {erreur && MESSAGES[erreur] ? (
          <div className="alert" data-tone={erreur === 'deconnecte' ? 'info' : 'bad'} role="alert">
            {MESSAGES[erreur]}
          </div>
        ) : null}

        {!isAdminConfigured() ? (
          <div className="alert" data-tone="info">
            Ajoutez la variable <code>ADMIN_PASSWORD</code> (8 caractères minimum, différente du mot de passe client)
            chez votre hébergeur ou dans <code>.env.local</code>, puis redémarrez.
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="motdepasse">Mot de passe de l’éditeur</label>
          <input id="motdepasse" name="motdepasse" type="password" autoComplete="current-password" required minLength={8} />
        </div>
        <button className="btn primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}>
          Ouvrir l’éditeur
        </button>
      </form>
    </div>
  )
}
