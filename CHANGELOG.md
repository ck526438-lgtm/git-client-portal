# Journal des versions

## 1.1.0 — 2026-11-19

### Nouveau
- **Design « verre & ciel »** : cadre d'accueil aux grands arrondis avec titre XXL, surfaces en verre dépoli,
  trois pilules flottantes en haut (studio · dossier · actions), rail de boutons ronds à gauche devenu barre
  d'onglets sur mobile, police Outfit servie localement, thème sombre retravaillé.
- Image de couverture facultative pour l'accueil : `branding.cover` dans `project.yaml`.
- **Portail installable (PWA)** : manifeste, icônes aux couleurs du studio, lecture hors ligne des pages déjà
  consultées, bouton d'installation, nouvelle page `/application`.
- **Applications natives** pour Windows, macOS, Linux (Electron) et Android, iOS (Capacitor), construites et
  publiées automatiquement par GitHub Actions sur chaque tag `v*`.
- **Assistant `npm run init`** : configure un nouveau portail en deux minutes (marque, client, dates, mot de passe).
- CI : validation du contenu, des types et du build sur chaque pull request.

### Sécurité
- Next.js 16.4.6 (corrige GHSA-mfr8-8qww-v76h et GHSA-vc7v-qv4w-wrv8).
- `/api/health` ne révèle plus le titre ni l'avancement du projet avant connexion.
- Vérification du mot de passe en temps constant ; la table anti-force brute ne grossit plus sans limite.
- Le cache hors ligne est vidé à la déconnexion.

## 1.0.0
- Première version : tableau de bord, journal, livrables, factures, documents, accès par mot de passe.
