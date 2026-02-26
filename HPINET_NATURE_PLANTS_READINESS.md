# HPInet Platform Improvement Backlog (Frontend + Backend + Data)

Scope: only product/database engineering improvements (no manuscript tasks).

## P0: Data correctness and trust
- [ ] Add `data_release` metadata collection (source version, import date, row counts, checksums).
- [ ] Add collection-level validation script to compare SQLite source counts vs Mongo counts for every table.
- [ ] Add duplicate interaction detection and report (same host/pathogen pair across methods/sources).
- [ ] Add species synonym normalization map (for host/pathogen IDs and FASTA file mapping).
- [ ] Add automated post-migration verification report (pass/fail + missing collections).

## P0: Query speed and stability (backend)
- [x] Add compound indexes for hot paths (scripted via backend index utility).
  - [x] results: `Host_Protein`, `Pathogen_Protein`, `Confidence`, `intdb_x`, `intdb`
  - [x] annotation: species + accession fields
  - [x] GO collections: species + gene fields
- [x] Add server-side projection for table APIs to avoid returning unused fields.
- [ ] Add cursor-based pagination option for very large result sets (keep page/size for compatibility).
- [x] Add response caching for repeated result/network requests with same filters.
- [ ] Add timeout-safe streaming export for large CSV downloads.

## P0: Confidence model transparency
- [x] Store both `RawConfidence` and normalized `Confidence` in API response.
- [x] Return `ConfidenceTier` and `ConfidenceComponents` consistently in all categories.
- [x] Add endpoint `/api/confidence_meta` exposing formula weights and source DB weights.
- [ ] Add backend unit tests for confidence edge cases (`0`, empty, percent strings, invalid values).

## P1: Phylo/GO operational reliability
- [ ] Add explicit blast-cache index file (task -> status -> output path) for fast resume.
- [x] Add preflight validator for DIAMOND DB compatibility before job starts.
- [ ] Add species-level FASTA registry in Mongo (`species_assets`) instead of file-name guessing. (mapped FASTA fallback implemented; Mongo registry pending)
- [x] Add fallback behavior when GO/Phylo data missing (clear API message + suggested fix).
- [ ] Add background cleanup for transient results and tmp files with retention policy.

## P1: Frontend UX clarity
- [x] Unify confidence display format to fixed decimals across all result categories.
- [ ] Add confidence tooltip in Results header (components + tier thresholds). (inline guidance added; tooltip pending)
- [ ] Show normalized source notation everywhere (Results + Network + Annotation). (Results + Network done; Annotation pending)
- [x] Add contextual empty states with direct next actions (change method, relax thresholds, select DBs).
- [ ] Keep workflow context persistent between Plant -> Interactome -> Results (including back navigation).

## P1: Network exploration improvements
- [x] Add legend toggle to hide/show specific source databases.
- [x] Add edge filtering by confidence range and source DB.
- [ ] Add node degree and betweenness quick metrics panel.
- [ ] Add “expand next N interactions” option from selected node.
- [ ] Add network snapshot metadata export (query + filters + timestamp).

## P2: Admin and observability
- [ ] Add `/api/health/deep` (Mongo connectivity, index readiness, storage checks).
- [ ] Add structured logs with request id and job id correlation.
- [ ] Add periodic index health report (missing/unused/slow indexes).
- [ ] Add endpoint latency dashboard (p50/p95/p99 by route).
- [ ] Add automated integrity cron: row-count drift + orphan result collections.

## P2: Developer productivity
- [ ] Add one command for local full stack smoke test.
- [ ] Add seed dataset for fast local testing (small but representative).
- [ ] Add contract tests between frontend expectations and backend response fields.
- [ ] Add changelog generator for schema/API changes.

## Recommended next 2-week execution order
1. Data verification + index audit + confidence tests.
2. Confidence metadata endpoint + consistent response fields.
3. Result/network performance pass (projection, caching, pagination).
4. UX pass (confidence tooltip, empty states, context persistence).
5. Phylo/GO reliability pass (asset registry + preflight validation).

Last updated: 2026-02-26
