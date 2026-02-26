# Backend Readiness Checklist

- [ ] All legacy API paths are available under the configured `VITE_API_BASE_URL`.
- [ ] CORS allows the HPInet frontend origin.
- [ ] `POST /api/ppi/`, `/api/goppi/`, `/api/phyloppi/` return stable result IDs.
- [ ] Result retrieval endpoints support paging with `page` and `size`.
- [ ] Annotation endpoints return `total` and either `data` or `results` arrays.
- [ ] Domain workflow (`/api/domain_results/`) returns `resultid`.
- [ ] Network endpoint returns edge records with host/pathogen fields.
- [ ] Error payloads include `message`.
- [ ] Job and transient-result retention policy is defined.
- [ ] MongoDB indexes for `result_id`, species filters, and TTL are deployed.
