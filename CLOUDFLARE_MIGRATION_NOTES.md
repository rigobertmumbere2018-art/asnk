# ASNK — préparation Cloudflare

Cette branche prépare un build Cloudflare Workers sans remplacer la branche principale.

## Ce que le build vérifie

- Extraction du projet TanStack Start depuis l'archive source.
- Remplacement de l'adaptateur Lovable/Nitro par le plugin Vite officiel Cloudflare.
- Conservation de l'entrée serveur personnalisée `src/server.ts`.
- Conservation de Supabase comme base de données.
- Génération des types Worker, contrôle TypeScript, build Vite et `wrangler deploy --dry-run`.

## Éléments qui restent à configurer avant une mise en production

1. Ajouter `SUPABASE_SERVICE_ROLE_KEY` comme secret du Worker Cloudflare. Cette clé n'est pas présente dans l'archive source et ne doit jamais être commitée ni envoyée dans une conversation.
2. Migrer les images qui utilisent encore les chemins Lovable `/__l5e/assets-v1/...` vers un stockage contrôlé par l'ASNK (par exemple R2). Les références sont conservées pendant cette étape afin de ne pas les remplacer par des images fictives.
3. Tester l'authentification, les fonctions d'administration, les formulaires, les actualités, les documents et les albums avant toute bascule DNS.

Aucun déploiement de production ni changement DNS n'est effectué par ce script.
