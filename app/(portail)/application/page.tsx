import type { Metadata } from 'next'
import { InstallNow, PortalAddress } from '@/components/app-install'
import { getContent } from '@/lib/content'
import { downloadLink, downloadUrl } from '@/lib/app-info'

export async function generateMetadata(): Promise<Metadata> {
  const { project } = await getContent()
  return { title: `Application — ${project.studio}` }
}

const PLATFORMS = [
  { name: 'Windows', file: 'Portail-Client-Setup.exe', hint: 'Windows 10 et 11, 64 bits' },
  { name: 'macOS', file: 'Portail-Client.dmg', hint: 'Mac Intel et Apple Silicon' },
  { name: 'Linux', file: 'Portail-Client.AppImage', hint: 'AppImage ou paquet .deb' },
  { name: 'Android', file: 'Portail-Client.apk', hint: 'Android 7 et plus' },
]

export default async function ApplicationPage() {
  const { project } = await getContent()
  const downloads = downloadUrl()

  return (
    <>
      <header className="detail-head" style={{ paddingTop: 40 }}>
        <p className="eyebrow">Sur tous vos appareils</p>
        <h1>Le portail en application</h1>
        <p className="hero-summary">
          Gardez le suivi de « {project.title} » à portée de main : une icône sur votre écran d’accueil ou votre bureau,
          une fenêtre à part, et les pages déjà consultées restent lisibles sans connexion.
        </p>
      </header>

      <div className="stack">
        <section className="card card-pad">
          <div className="panel-title">
            <h2>1 · Le plus simple : installer depuis le navigateur</h2>
            <span className="panel-note">Rien à télécharger</span>
          </div>
          <InstallNow />
          <div className="install-grid">
            <div>
              <h3>iPhone et iPad</h3>
              <p>
                Ouvrez ce portail dans <strong>Safari</strong>, touchez <strong>Partager</strong> puis{' '}
                <strong>Sur l’écran d’accueil</strong>.
              </p>
            </div>
            <div>
              <h3>Android</h3>
              <p>
                Dans <strong>Chrome</strong>, ouvrez le menu <strong>⋮</strong> puis{' '}
                <strong>Installer l’application</strong> (ou « Ajouter à l’écran d’accueil »).
              </p>
            </div>
            <div>
              <h3>Windows, macOS, Linux</h3>
              <p>
                Dans <strong>Chrome</strong> ou <strong>Edge</strong>, cliquez sur l’icône d’installation à droite de la
                barre d’adresse. Sur Mac avec Safari : <strong>Fichier → Ajouter au Dock</strong>.
              </p>
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <div className="panel-title">
            <h2>2 · Ou l’application à télécharger</h2>
            <span className="panel-note">Gratuite, sans compte</span>
          </div>
          <p style={{ marginTop: 0 }}>
            L’application « Portail Client » regroupe tous vos portails de suivi, même s’ils viennent de prestataires
            différents. Au premier lancement, collez l’adresse ci-dessous puis entrez votre mot de passe habituel.
          </p>
          <PortalAddress />
          <div className="download-grid">
            {PLATFORMS.map((platform) => (
              <a className="download" href={downloadLink(platform.file)} key={platform.name} rel="noopener" target="_blank">
                <span className="download-name">{platform.name}</span>
                <span className="download-hint">{platform.hint}</span>
                <span className="mono-note">{platform.file}</span>
              </a>
            ))}
          </div>
          <p className="mono-note" style={{ marginBottom: 0 }}>
            Toutes les versions : <a href={downloads} rel="noopener" target="_blank">page de téléchargement</a>. Sur iPhone et iPad, l’installation depuis Safari (étape 1) offre la même expérience que l’application.
          </p>
        </section>

        <section className="card card-pad">
          <div className="panel-title">
            <h2>Bon à savoir</h2>
          </div>
          <ul className="plain-list">
            <li>Votre mot de passe n’est jamais enregistré dans l’application, seule la session reste ouverte 30 jours.</li>
            <li>Le bouton « Quitter » efface les pages gardées pour la lecture hors ligne.</li>
            <li>Sur un ordinateur partagé, préférez le navigateur en navigation privée.</li>
          </ul>
        </section>
      </div>
    </>
  )
}
