# Journal des versions

## 1.2.0 — 2026-11-19

### Nouveau
- **Éditeur web `/admin`** : publier des nouvelles, des livrables et des factures, mettre à jour le planning et les
  informations du projet avec des formulaires, sans Git ni éditeur de code.
  - Chaque enregistrement est un commit sur le dépôt GitHub (API Contents) : l'hébergeur reconstruit le portail
    tout seul. Toujours zéro base de données, et tout l'historique reste dans Git.
  - Les fichiers sont vérifiés avec les mêmes règles que le build **avant** l'enregistrement : l'éditeur ne peut
    pas casser le portail.
  - Factures : numéro suivant proposé, lignes avec total en direct, bouton « Marquer payée ».
  - Mot de passe séparé (`ADMIN_PASSWORD`) : le cookie du client ne donne jamais accès à l'éditeur.
  - En développement, sans jeton GitHub, l'éditeur écrit directement dans `content/`.
- `npm run init` génère aussi le mot de passe de l'éditeur.
- En développement, la CSP autorise `eval` (nécessaire aux outils de React) ; la production reste stricte.

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
