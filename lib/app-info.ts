// Identifiant reconnu par les applications natives pour vérifier qu'une adresse
// pointe bien vers un portail client (voir /api/health et apps/shell).
export const APP_ID = 'portail-client'
export const APP_VERSION = '1.2.0'

// Où le client télécharge les applications. Surchargeable par portail via
// APP_DOWNLOAD_URL (ex. vos propres releases GitHub).
export const DEFAULT_DOWNLOAD_URL = 'https://github.com/ck526438-lgtm/git-client-portal/releases/latest'

export function downloadUrl(): string {
  const value = process.env.APP_DOWNLOAD_URL?.trim()
  return value && /^https:\/\//.test(value) ? value : DEFAULT_DOWNLOAD_URL
}

/** Lien direct vers un fichier de la dernière release GitHub, sinon la page de téléchargement. */
export function downloadLink(file: string): string {
  const base = downloadUrl()
  return /\/releases\/latest\/?$/.test(base) ? `${base.replace(/\/$/, '')}/download/${file}` : base
}
