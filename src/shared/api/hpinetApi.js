import { request } from "@/shared/api/httpClient";
import {
  normalizeAnnotationBundle,
  normalizeJobId,
  normalizePagedResponse
} from "@/shared/api/mappers";

export const hpinetApi = {
  getResults: async ({ resultId, category, page, size, q, signal }) => {
    const data = await request("/api/results/", {
      query: { results: resultId, category, page, size, q },
      signal
    });
    return normalizePagedResponse(data);
  },

  getNetwork: async ({ resultId, category, signal }) => {
    const data = await request("/api/network/", {
      query: { results: resultId, category },
      signal
    });
    return normalizePagedResponse(data);
  },

  postDomainResults: async ({ body, signal }) => {
    const data = await request("/api/domain_results/", {
      method: "POST",
      body,
      signal
    });
    return {
      ...normalizePagedResponse(data),
      hostcount: Number(data?.hostcount || 0),
      pathogencount: Number(data?.pathogencount || 0),
      resultid: String(data?.resultid || "")
    };
  },

  submitInterolog: async ({ body, signal }) => {
    const data = await request("/api/ppi/", {
      method: "POST",
      body,
      timeoutMs: 600_000,
      signal
    });
    return normalizeJobId(data);
  },

  submitGoSim: async ({ body, signal }) => {
    const data = await request("/api/goppi/", {
      method: "POST",
      body,
      timeoutMs: 600_000,
      signal
    });
    return normalizeJobId(data);
  },

  submitPhylo: async ({ body, signal }) => {
    const data = await request("/api/phyloppi/", {
      method: "POST",
      body,
      timeoutMs: 3_600_000,
      signal
    });
    return normalizeJobId(data);
  },

  getGo: async ({ species, sptype, page, size, signal }) =>
    request("/api/go/", { query: { species, sptype, page, size }, signal }),

  getKegg: async ({ species, sptype, page, size, signal }) =>
    request("/api/kegg/", { query: { species, sptype, page, size }, signal }),

  getInterpro: async ({ species, sptype, page, size, signal }) =>
    request("/api/interpro/", { query: { species, sptype, page, size }, signal }),

  getLocal: async ({ species, sptype, page, size, signal }) =>
    request("/api/local/", { query: { species, sptype, page, size }, signal }),

  getTf: async ({ species, sptype, page, size, signal }) =>
    request("/api/tf/", { query: { species, sptype, page, size }, signal }),

  getVirulence: async ({ species, page, size, signal }) =>
    request("/api/effector/", { query: { species, page, size }, signal }),

  getPlantSnapshot: async ({ host, pathogen, signal }) =>
    request("/api/plant_snapshot/", { query: { host, pathogen }, signal }),

  getAnnotationBundle: async ({ host, pathogen, hid, pid, signal }) => {
    const data = await request("/api/annotation/", {
      query: { host, pathogen, hid, pid },
      signal
    });
    return normalizeAnnotationBundle(data);
  },

  getSequencePair: async ({ host, hid, pathogen, pid, signal }) =>
    request("/api/sequence_pair/", { query: { host, hid, pathogen, pid }, signal })
};
