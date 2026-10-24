# Signaler une faille

Le portail est distribué sous licence MIT, sans garantie. Il n'existe aucun programme de bug bounty, mais
les rapports sont lus et corrigés.

**Utilisez un [avis de sécurité](https://github.com/ck526438-lgtm/git-client-portal/security/advisories/new)**
plutôt qu'une issue publique : un correctif peut mettre quelques jours à sortir, et une issue ouverte donne
entre-temps la recette à tout le monde.

## Ce qui est dans la portée

- Contournement de la protection par mot de passe (`proxy.ts`, cookie signé dans `lib/auth.ts`).
- Exécution de code ou injection XSS via un fichier Markdown ou YAML du dépôt.
- Fuite de contenu non publié via une route, une API ou un en-tête.
- Redirection ouverte depuis `?retour=` ou l'en-tête `Host`.

## Ce qui n'est PAS une faille

Ces points sont des choix assumés, documentés dans le README. Les signaler ne fait que faire perdre du temps
aux deux parties.

- **Le mot de passe est partagé** : il n'y a pas d'authentification multi-utilisateurs, donc pas de
  cloisonnement entre deux personnes qui connaissent le mot de passe.
- **Tout le contenu du dépôt est lisible par toute personne connectée** : ne stockez ni secret, ni pièce
  d'identité, ni document légal sensible dans le Git.
- **Le dépôt est public sur votre hébergeur** : le mot de passe protège le portail, pas les fichiers sources.
- **Pas de limitation fine du débit** : 8 tentatives par IP sur 15 minutes, en mémoire, sans persistance.
- **Pas de chiffrement au repos** : les fichiers sont en clair dans Git, c'est le principe du projet.
- **`/api/health` est public** et ne renvoie que des compteurs.

## Hygiène côté déploiement

- Renseignez `PORTAL_SECRET` : sans lui, changer `PORTAL_PASSWORD` invalide toutes les sessions, et un
  secret court rend la signature plus facile à brute-forcer.
- Servez le portail en HTTPS (Vercel et Netlify le font par défaut) : le cookie est marqué `Secure`, il ne
  fonctionnera pas en HTTP hors localhost.
- Le bouton « Actualiser » expose une URL de deploy hook dans `REDEPLOY_HOOK_URL` : c'est un secret, ne le
  mettez jamais dans le dépôt.
