# ASNK — Scouts du Nord-Kivu

- Source control: GitHub
- Runtime: Cloudflare Workers
- Database: Cloudflare D1 (`asnk-scouts-db`)
- Media: Cloudflare R2 (`asnk-media`)

## Build

```bash
npm install
npm run build
```

The build restores the original image files and R2 asset descriptors from the preserved `Kivu Scouts Hub.zip`, then builds the TanStack Start app for Cloudflare.

## Deploy

```bash
npx wrangler deploy
```

The Worker uses the D1 and R2 bindings in `wrangler.toml`. No Supabase service, Supabase URL, or Lovable hosting is needed at runtime. The legacy-named client adapter under `src/integrations/supabase/client.ts` is a local compatibility layer: it sends requests to same-origin `/api` endpoints handled by `src/lib/cloudflare-api.ts`.

## Database

`migrations/0001_initial.sql` records the live D1 schema for reproducible setup. Do not reapply it to an already initialized database.
