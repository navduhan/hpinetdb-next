# HPInet MongoDB Schema Design

Target database: MongoDB (backend remains separate from this repository).

## Collections

## `hosts`

Purpose: Host species metadata.

Fields:
- `_id`
- `code` (e.g., `Wheat`)
- `scientific_name`
- `common_name`
- `taxonomy_id`
- `created_at`, `updated_at`

Indexes:
- `{ code: 1 }` unique
- `{ scientific_name: 1 }`

## `pathogens`

Purpose: Pathogen metadata.

Fields:
- `_id`
- `code` (e.g., `tindica`)
- `scientific_name`
- `pathogen_type` (`fungi|bacteria|virus`)
- `taxonomy_id`
- `created_at`, `updated_at`

Indexes:
- `{ code: 1 }` unique
- `{ pathogen_type: 1, scientific_name: 1 }`

## `host_pathogen_pairs`

Purpose: Valid pair mappings and disease metadata.

Fields:
- `_id`
- `host_code`
- `pathogen_code`
- `disease_name`
- `enabled`

Indexes:
- `{ host_code: 1, pathogen_code: 1 }` unique
- `{ disease_name: "text" }`

## `jobs`

Purpose: Asynchronous submitted jobs.

Fields:
- `_id` (job id / result id)
- `category` (`interolog|consensus|domain|go|phylo`)
- `status` (`queued|running|done|failed`)
- `host_code`, `pathogen_code`
- `request_payload`
- `error_message`
- `created_at`, `started_at`, `finished_at`
- `expires_at` (TTL target)

Indexes:
- `{ status: 1, created_at: -1 }`
- `{ host_code: 1, pathogen_code: 1, category: 1, created_at: -1 }`
- `{ expires_at: 1 }` TTL

## `interaction_results`

Purpose: Result table rows for non-network workflows.

Fields:
- `_id`
- `result_id`
- `category`
- `host_protein`
- `pathogen_protein`
- `source_db` (`intdb_x`/`intdb`)
- evidence fields (`method`, `type`, `confidence`, `score`, `pmid`, `host_go`, `pathogen_go`, etc.)
- `created_at`

Indexes:
- `{ result_id: 1, category: 1 }`
- `{ result_id: 1, host_protein: 1 }`
- `{ result_id: 1, pathogen_protein: 1 }`
- `{ host_protein: 1 }`
- `{ pathogen_protein: 1 }`

## `network_edges`

Purpose: Precomputed graph edges per result.

Fields:
- `_id`
- `result_id`
- `host_protein`
- `pathogen_protein`
- `source_db`
- `edge_type`
- `weight`

Indexes:
- `{ result_id: 1 }`
- `{ result_id: 1, host_protein: 1 }`
- `{ result_id: 1, pathogen_protein: 1 }`

## `annotations`

Purpose: GO, KEGG, localization, TF, virulence list records.

Fields:
- `_id`
- `species_code`
- `species_type` (`host|pathogen`)
- `annotation_type` (`go|kegg|interpro|local|tf|virulence`)
- `gene`
- content fields (`term`, `description`, `definition`, `pathway`, `location`, `tf_family`, etc.)
- `length`

Indexes:
- `{ species_code: 1, species_type: 1, annotation_type: 1 }`
- `{ species_code: 1, annotation_type: 1, gene: 1 }`
- text index on key description fields

## `domains`

Purpose: Domain-specific inference and lookups.

Fields:
- `_id`
- `result_id`
- `host_protein`, `pathogen_protein`
- `domain_a`, `domain_b`
- `interpro_a`, `interpro_b`
- `source_db`
- `score`

Indexes:
- `{ result_id: 1 }`
- `{ domain_a: 1, domain_b: 1 }`

## `audit_logs`

Purpose: Traceability and operations.

Fields:
- `_id`
- `event_type`
- `result_id`
- `meta`
- `created_at`
- `expires_at`

Indexes:
- `{ event_type: 1, created_at: -1 }`
- `{ result_id: 1, created_at: -1 }`
- `{ expires_at: 1 }` TTL

## Query Patterns and Index Fit

- Result page: `result_id + category + paging` -> covered by `interaction_results` compound index.
- Network page: `result_id` -> covered by `network_edges` index.
- Annotation page: `species_code + species_type + annotation_type + paging` -> covered by `annotations` index.
- Protein lookup: `host_protein` / `pathogen_protein` -> covered by dedicated indexes.

## Retention Strategy

- Keep stable reference collections (`hosts`, `pathogens`, `host_pathogen_pairs`) permanent.
- Use TTL for transient computation artifacts (`jobs`, optional `interaction_results`/`network_edges` snapshots depending storage policy).
