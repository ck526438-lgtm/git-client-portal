# Applications « Portail Client »

Une seule application pour tous les portails : le client y colle l'adresse de son portail, puis saisit son mot de
passe sur le portail lui-même. Elle peut suivre plusieurs portails (prestataires différents) et rouvre le dernier
consulté.

```
apps/
├── shell/     écran « Mes portails » partagé (HTML/CSS/JS sans dépendance)
├── desktop/   Electron → Windows (.exe), macOS (.dmg universel), Linux (.AppImage, .deb)
└── mobile/    Capacitor → Android (.apk), iOS (projet Xcode, .ipa non signée)
```

## Comment ça marche

1. L'écran d'accueil vérifie l'adresse avec `GET /api/health` : la réponse doit contenir `"app": "portail-client"`.
   Cette route est ouverte (CORS `*`) mais ne renvoie aucune donnée du projet avant connexion.
2. Le portail s'ouvre dans la fenêtre de l'application ; la session (cookie signé) dure 30 jours.
3. Chaque application ajoute `PortailClientApp/<plateforme>` à son User-Agent : le portail affiche alors un bouton
   « Mes portails » pour revenir à la liste.
4. Bureau : les liens vers d'autres sites, e-mails et fichiers s'ouvrent dans le navigateur ou le logiciel du système.
   Les pages n'ont aucun accès à Node.js (bac à sable activé, `contextIsolation`).

## Publier une version

```bash
# Mettez la même version dans package.json, apps/desktop/package.json et apps/mobile/package.json, puis :
git tag v1.1.0 && git push origin v1.1.0
```

Le workflow `.github/workflows/apps.yml` construit les 5 systèmes en parallèle et publie une release GitHub avec :
`Portail-Client-Setup.exe`, `Portail-Client.dmg`, `Portail-Client.AppImage`, `Portail-Client.deb`,
`Portail-Client.apk`, `Portail-Client-iOS-non-signe.ipa`. La page `/application` du portail pointe directement sur
ces fichiers (`releases/latest/download/…`).

Sur une pull request qui touche `apps/`, les mêmes fichiers sont construits et téléchargeables depuis l'onglet
**Actions** du run, sans release.

## Construire en local

```bash
cd apps/desktop && npm install && npm start          # lancer l'appli de bureau
npm run dist:linux                                   # ou dist:win / dist:mac

cd apps/mobile && npm install
npm run android:init && npm run android              # ouvre Android Studio (SDK requis)
npm run ios:init && npm run ios                      # ouvre Xcode (Mac requis)
```

## Signature (recommandé avant une diffusion large)

| Système | Sans signature | Pour signer |
| --- | --- | --- |
| **Android** | APK signé avec une clé de développement : installable, mais Play Store refusé | Ajoutez les secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` : le workflow signe alors l'APK de production. **Gardez toujours la même clé**, sinon les mises à jour ne s'installent plus. |
| **Windows** | SmartScreen affiche « Éditeur inconnu » → *Informations complémentaires* → *Exécuter quand même* | Certificat de signature de code (secrets `CSC_LINK` / `CSC_KEY_PASSWORD` lus par electron-builder) |
| **macOS** | Premier lancement : clic droit → *Ouvrir* | Compte Apple Developer : `CSC_LINK`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` pour signer et notariser |
| **iOS** | `.ipa` non signée : à signer soi-même (Sideloadly, AltStore, Xcode) | Compte Apple Developer, puis TestFlight / App Store depuis Xcode |

Créer une clé Android :

```bash
keytool -genkey -v -keystore release.jks -alias portail -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.jks   # → secret ANDROID_KEYSTORE_BASE64
```

> Sur iPhone et iPad, l'installation depuis Safari (Partager → Sur l'écran d'accueil) donne une application
> complète, sans App Store ni compte Apple : c'est la voie conseillée tant que l'appli n'est pas publiée.

## Mettre les applications à votre marque

Changez `appId`/`productName` dans `apps/desktop/package.json` et `apps/mobile/capacitor.config.json`, remplacez
`apps/shell/icon.svg`, `apps/desktop/build/icon.png` et `apps/mobile/assets/*.png`, puis renseignez
`APP_DOWNLOAD_URL` sur vos portails pour pointer vers vos propres releases.
