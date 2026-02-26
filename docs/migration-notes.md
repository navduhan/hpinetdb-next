# Migration Notes: Legacy HPInet -> HPInet Rewrite

## Strategy

- New app lives in `hpinetdb-next/`.
- Legacy app under `hpinetdb/` remains untouched.
- Cutover can be done by switching deployment target to `hpinetdb-next` build output.

## Key Changes

- Build system: CRA -> Vite.
- Runtime config: `public/env.js` -> Vite env vars (`VITE_BASE_URL`, `VITE_API_BASE_URL`).
- Architecture: page monoliths -> feature-first modules.
- Data layer: direct axios calls -> centralized API client with retries + abort + dedupe cache.
- State flow: localStorage coupling removed from primary workflows; URLs carry interoperable state.

## Route Compatibility

The following routes are preserved:
- `/`
- `/plants`
- `/interactome`
- `/results`
- `/network`
- `/go`
- `/kegg`
- `/interpro`
- `/local`
- `/tf`
- `/virulence`
- `/datasets`
- `/help`
- `/annotation`
- `/search`

## Deployment Checklist

1. Set `.env` values.
2. Build: `npm run build`.
3. Serve static output.
4. Smoke-test route deep links with query params.
