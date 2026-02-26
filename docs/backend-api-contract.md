# HPInet Backend API Contract (v1-compatible)

This contract keeps current endpoint paths and query parameter semantics used by the legacy HPInet frontend.

## Base URL

- `VITE_API_BASE_URL` (example: `https://kaabil.net/hpinetbackend`)

## Endpoint Summary

### Job Submission

- `POST /api/ppi/`
  - Purpose: Interolog and consensus job submission.
  - Request body fields:
    - `category`: `interolog | consensus`
    - `hspecies`, `pspecies`
    - `ids`, `genes`, `stype`
    - host/path thresholds: `hi`, `hc`, `he`
    - pathogen thresholds: `pi`, `pc`, `pe`
    - `intdb` (comma string), `domdb` (array)
    - `keyword`, `searchType`, `anotType`, `host`, `pathogen`
  - Response: job/result id string.

- `POST /api/goppi/`
  - Purpose: GO similarity job submission.
  - Request body fields:
    - `category` (`gosim`)
    - `hspecies`, `pspecies`
    - `host_genes`, `pathogen_genes`
    - `method`, `score`, `threshold`
  - Response: job/result id string.

- `POST /api/phyloppi/`
  - Purpose: phylo profiling job submission.
  - Request body fields:
    - `category` (`phylo`)
    - `hspecies`, `pspecies`
    - `host_genes`, `pathogen_genes`
    - `method`, `threshold`
    - optional thresholds: `hi`, `hc`, `he`, `pi`, `pc`, `pe`
  - Response: job/result id string.

### Result Retrieval

- `GET /api/results/?results=<id>&category=<category>&page=<n>&size=<n>`
  - Response:
    - `results: []`
    - `total: number`
    - `hostcount: number`
    - `pathogencount: number`

- `POST /api/domain_results/`
  - Request body fields:
    - `species` (`<host>_<pathogen>`)
    - `page`, `size`
    - `genes` (array)
    - `idt`, `intdb`
    - `keyword`, `searchType`
  - Response:
    - `results: []`
    - `total`, `hostcount`, `pathogencount`
    - `resultid`

- `GET /api/network/?results=<id>`
  - Response:
    - `results: []`
    - `total: number`

### Annotation Retrieval

- `GET /api/go/?species=<id>&sptype=<host|pathogen>&page=<n>&size=<n>`
- `GET /api/kegg/?species=<id>&sptype=<host|pathogen>&page=<n>&size=<n>`
- `GET /api/interpro/?species=<id>&sptype=<host|pathogen>&page=<n>&size=<n>`
- `GET /api/local/?species=<id>&sptype=<host|pathogen>&page=<n>&size=<n>`
- `GET /api/tf/?species=<id>&sptype=<host|pathogen>&page=<n>&size=<n>`
- `GET /api/effector/?species=<id>&page=<n>&size=<n>`

Response shape for list endpoints:
- `data: []` (or `results: []` accepted by frontend)
- `total: number`

### Combined Annotation Bundle

- `GET /api/annotation/?host=<host>&pathogen=<pathogen>&hid=<hostProtein>&pid=<pathogenProtein>`
  - Response fields:
    - `hgo`, `pgo`, `hkegg`, `pkegg`, `hlocal`, `plocal`, `htf`, `peff`, `hint`, `pint`

## Error Contract

- Error responses should include:
  - HTTP status code
  - JSON body with `message` and optional `details`

## Optional API Evolution

- Add explicit status and polling routes while preserving `/api/...`
- Introduce async job polling endpoint:
  - `GET /api/jobs/:id`
- Standardize paging response:
  - `{ items, total, page, size }`
