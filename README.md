# HPInet (Parallel Rewrite)

This is a full frontend rewrite of HPInet using React 19, Vite, and React-Bootstrap.

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_BASE_URL` (router basename)
- `VITE_API_BASE_URL` (backend API origin)
  - Local development (recommended): `/hpinetbackend` (uses Vite proxy)
  - Direct backend (server CORS must be correct): `https://kaabil.net/hpinetbackend`
- `VITE_DEV_PROXY_TARGET` (dev-server proxy target, defaults to `https://kaabil.net`)

## Scripts

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
