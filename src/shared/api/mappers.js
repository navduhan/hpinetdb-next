/**
 * @typedef {Object} InteractionResult
 * @property {string} Host_Protein
 * @property {string} Pathogen_Protein
 * @property {string=} intdb_x
 * @property {string=} intdb
 * @property {string=} Score
 */

/**
 * @typedef {Object} NetworkEdge
 * @property {string} source
 * @property {string} target
 * @property {string} id
 * @property {string=} Host_Protein
 * @property {string=} Pathogen_Protein
 */

/**
 * @typedef {Object} AnnotationRecord
 * @property {string} gene
 * @property {string=} term
 * @property {string=} description
 * @property {string=} definition
 */

/**
 * @typedef {Object} JobStatus
 * @property {string} resultId
 * @property {"queued"|"running"|"done"|"failed"} status
 */

/**
 * @template T
 * @typedef {Object} PagedResponse
 * @property {T[]} results
 * @property {number} total
 */

export function normalizePagedResponse(raw) {
  const results = raw?.results || raw?.data || [];
  const total = Number(raw?.total || results.length || 0);
  return { results, total };
}

export function normalizeJobId(raw) {
  return String(raw?.resultid || raw?.id || raw || "");
}

export function normalizeAnnotationBundle(raw) {
  return {
    hgo: raw?.hgo || [],
    pgo: raw?.pgo || [],
    hkegg: raw?.hkegg || [],
    pkegg: raw?.pkegg || [],
    hlocal: raw?.hlocal || [],
    plocal: raw?.plocal || [],
    htf: raw?.htf || [],
    peff: raw?.peff || [],
    hint: raw?.hint || [],
    pint: raw?.pint || []
  };
}
