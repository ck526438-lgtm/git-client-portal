import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Portail client',
  description: "Suivi de projet, livrables et factures.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1115' },
  ],
}

const themeScript = `(function(){try{var s=localStorage.getItem('portail-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=s||d}catch(e){document.documentElement.dataset.theme='light'}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip" href="#contenu">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  )
}
