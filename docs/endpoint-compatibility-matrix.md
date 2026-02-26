# Endpoint Compatibility Matrix

| Area | Legacy Endpoint | Rewritten Frontend Uses | Notes |
|---|---|---|---|
| Interolog/Consensus submit | `POST /api/ppi/` | Yes | Same request fields preserved |
| GO similarity submit | `POST /api/goppi/` | Yes | Same request fields preserved |
| Phylo submit | `POST /api/phyloppi/` | Yes | Same request fields preserved |
| Results list | `GET /api/results/` | Yes | `results`, `category`, `page`, `size` unchanged |
| Domain results | `POST /api/domain_results/` | Yes | Same request shape |
| Network | `GET /api/network/` | Yes | Same query `results=<id>` |
| GO list | `GET /api/go/` | Yes | Same query style |
| KEGG list | `GET /api/kegg/` | Yes | Same query style |
| InterPro list | `GET /api/interpro/` | Yes | Same query style |
| Localization list | `GET /api/local/` | Yes | Same query style |
| TF list | `GET /api/tf/` | Yes | Same query style |
| Virulence list | `GET /api/effector/` | Yes | Same query style |
| Bundle annotation | `GET /api/annotation/` | Yes | Same query shape |
