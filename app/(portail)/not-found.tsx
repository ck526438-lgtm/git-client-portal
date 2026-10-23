import Link from 'next/link'

export default function PortalNotFound() {
  return (
    <>
      <header className="detail-head" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Page introuvable</p>
        <h1>Ce contenu n’existe pas (ou plus)</h1>
        <p className="hero-summary">
          Il a peut-être été renommé lors d’une mise à jour du dépôt. Reprenez depuis le tableau de bord : tout
          l’avancement y est concentré.
        </p>
        <div className="chips">
          <Link className="btn primary" href="/">
            Tableau de bord
          </Link>
          <Link className="btn" href="/activite">
            Journal d’activité
          </Link>
        </div>
      </header>
    </>
  )
}
