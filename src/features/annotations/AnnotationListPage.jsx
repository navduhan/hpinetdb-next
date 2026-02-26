import { useEffect, useMemo, useState } from "react";
import { Alert, Col, Form, Row, Table } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { annotationConfig } from "@/features/annotations/annotationConfig";
import { useQueryResource } from "@/shared/hooks/useQueryResource";
import { LoadingState } from "@/shared/ui/LoadingState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SimplePagination } from "@/shared/ui/SimplePagination";
import { data as speciesMap } from "@/shared/content/display-data";
import plants from "@/shared/content/plants.json";
import { pathogen } from "@/shared/content/pathogen";

const PAGE_SIZE = 25;
const HOST_SPECIES = plants.map((item) => ({
  value: item.name,
  label: `${item.sname} (${item.name})`
}));
const PATHOGEN_SPECIES = Object.entries(pathogen)
  .sort((a, b) => a[1].localeCompare(b[1]))
  .map(([value, label]) => ({ value, label }));

function parseRows(payload) {
  const rows = payload?.data || payload?.results || [];
  const total = Number(payload?.total || rows.length || 0);
  return { rows, total };
}

function normalizeGeneId(value) {
  return String(value || "").trim().split(".")[0].toLowerCase();
}

function proteinLink(species, sptype, gene) {
  const isPathogenLike = sptype === "pathogen" || !["Wheat", "Maize", "Rice", "Sorghum", "Barley", "Rye", "Oat", "Foxtail", "Ragi", "Quinoa"].includes(species);
  if (species === "tindica" || isPathogenLike) {
    return `https://www.ncbi.nlm.nih.gov/search/all/?term=${encodeURIComponent(gene)}`;
  }
  return `https://plants.ensembl.org/Multi/Search/Results?species=all;idx=;q=${encodeURIComponent(gene)};site=ensemblunit`;
}

export default function AnnotationListPage({ type }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [localFilter, setLocalFilter] = useState("");

  const config = annotationConfig[type];
  const isVirulence = type === "virulence";
  const requestedClass = searchParams.get("class");
  const sptype = isVirulence ? "pathogen" : requestedClass === "pathogen" ? "pathogen" : "host";
  const requestedSpecies = isVirulence
    ? searchParams.get("species") || (searchParams.get("id") === "effector_and_secretory" ? "" : searchParams.get("id"))
    : searchParams.get("id");
  const speciesOptions = sptype === "host" ? HOST_SPECIES : PATHOGEN_SPECIES;
  const fallbackSpecies = speciesOptions[0]?.value || "";
  const species = speciesOptions.some((option) => option.value === requestedSpecies) ? requestedSpecies : fallbackSpecies;
  const speciesLabel = speciesMap[species] || pathogen[species] || species;

  const keywordFilter = searchParams.get("keyword") || "";
  const accessionFilter = searchParams.get("accession") || "";
  const minLen = Number(searchParams.get("minLen") || "0");
  const maxLen = Number(searchParams.get("maxLen") || "0");

  useEffect(() => {
    if (!config || !species) {
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    let changed = false;

    if (isVirulence) {
      if (nextParams.get("id") !== "effector_and_secretory") {
        nextParams.set("id", "effector_and_secretory");
        changed = true;
      }
      if (nextParams.get("species") !== species) {
        nextParams.set("species", species);
        changed = true;
      }
      if (nextParams.has("class")) {
        nextParams.delete("class");
        changed = true;
      }
    } else {
      if (nextParams.get("id") !== species) {
        nextParams.set("id", species);
        changed = true;
      }
      if (nextParams.get("class") !== sptype) {
        nextParams.set("class", sptype);
        changed = true;
      }
      if (nextParams.has("species")) {
        nextParams.delete("species");
        changed = true;
      }
    }

    if (changed) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [config, isVirulence, searchParams, setSearchParams, species, sptype]);

  function onClassChange(nextClass) {
    const nextType = nextClass === "pathogen" ? "pathogen" : "host";
    const nextOptions = nextType === "host" ? HOST_SPECIES : PATHOGEN_SPECIES;
    const nextSpecies = nextOptions[0]?.value || "";
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("class", nextType);
    nextParams.set("id", nextSpecies);
    nextParams.delete("species");
    setPage(0);
    setSearchParams(nextParams);
  }

  function onSpeciesChange(nextSpecies) {
    const nextParams = new URLSearchParams(searchParams);
    if (isVirulence) {
      nextParams.set("id", "effector_and_secretory");
      nextParams.set("species", nextSpecies);
      nextParams.delete("class");
    } else {
      nextParams.set("id", nextSpecies);
      nextParams.set("class", sptype);
      nextParams.delete("species");
    }
    setPage(0);
    setSearchParams(nextParams);
  }

  const query = useQueryResource({
    key: ["annotation", type, species, sptype, page],
    enabled: Boolean(config && species),
    staleTime: 45_000,
    queryFn: ({ signal }) => {
      if (type === "virulence") {
        return config.fetcher({ species, page, size: PAGE_SIZE, signal });
      }
      return config.fetcher({ species, sptype, page, size: PAGE_SIZE, signal });
    }
  });

  const parsed = parseRows(query.data);

  const filteredRows = useMemo(() => {
    return parsed.rows.filter((row) => {
      if (keywordFilter) {
        const exists = Object.values(row).some((value) => String(value).toLowerCase().includes(keywordFilter.toLowerCase()));
        if (!exists) return false;
      }
      if (accessionFilter) {
        const rowGene = String(row.gene || "").toLowerCase();
        const rowGeneBase = normalizeGeneId(row.gene);
        const queryGene = String(accessionFilter).toLowerCase();
        const queryGeneBase = normalizeGeneId(accessionFilter);
        const matches =
          rowGene.includes(queryGene) ||
          rowGene.includes(queryGeneBase) ||
          rowGeneBase.includes(queryGene) ||
          rowGeneBase.includes(queryGeneBase);
        if (!matches) return false;
      }
      if (minLen && Number(row.length || 0) < minLen) return false;
      if (maxLen && Number(row.length || 0) > maxLen) return false;
      if (localFilter) {
        const exists = Object.values(row).some((value) => String(value).toLowerCase().includes(localFilter.toLowerCase()));
        if (!exists) return false;
      }
      return true;
    });
  }, [accessionFilter, keywordFilter, localFilter, maxLen, minLen, parsed.rows]);

  const pageCount = Math.max(1, Math.ceil(parsed.total / PAGE_SIZE));
  const startRow = parsed.total ? page * PAGE_SIZE + 1 : 0;
  const endRow = parsed.total ? Math.min((page + 1) * PAGE_SIZE, parsed.total) : 0;

  if (!config) {
    return <ErrorState message={`Unsupported annotation type: ${type}`} />;
  }

  return (
    <section className="hp-fade-up">
      <PageHeader
        title={`${config.title}${speciesLabel ? ` - ${speciesLabel}` : ""}`}
        subtitle={`Showing ${startRow} to ${endRow} of ${parsed.total.toLocaleString()} records`}
      />

      <div className="hp-card mb-3 hp-annotation-toolbar">
        <Row className="g-3 align-items-end">
          {!isVirulence ? (
            <Col md={3}>
              <Form.Label htmlFor="annotation-class-select">Data class</Form.Label>
              <Form.Select id="annotation-class-select" value={sptype} onChange={(e) => onClassChange(e.target.value)}>
                <option value="host">Host</option>
                <option value="pathogen">Pathogen</option>
              </Form.Select>
            </Col>
          ) : null}
          <Col md={isVirulence ? 8 : 5}>
            <Form.Label htmlFor="annotation-species-select">Species</Form.Label>
            <Form.Select id="annotation-species-select" value={species} onChange={(e) => onSpeciesChange(e.target.value)}>
              {speciesOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={isVirulence ? 4 : 4}>
            <Form.Label htmlFor="annotation-local-filter">Local filter</Form.Label>
            <Form.Control id="annotation-local-filter" value={localFilter} onChange={(e) => setLocalFilter(e.target.value)} />
          </Col>
        </Row>
        <small className="hp-muted d-block mt-2">
          {isVirulence
            ? "Select a pathogen species to view virulence and effector proteins."
            : "Choose host or pathogen and species to load corresponding annotation records."}
        </small>
      </div>

      {query.isLoading ? <LoadingState label="Loading annotations" /> : null}
      {query.error ? <ErrorState message={query.error.message} /> : null}

      {!query.isLoading && !query.error ? (
        <div className="hp-card">
          {!filteredRows.length ? (
            <Alert variant="light" className="mb-3">
              No records found for the selected options and filters.
            </Alert>
          ) : null}
          <Table responsive hover>
            <thead>
              <tr>
                {config.columns.map((col) => (
                  <th key={col.key}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr key={`${row.gene || row.term || row.pathway || idx}-${idx}`}>
                  {config.columns.map((col) => {
                    if (col.key === "gene") {
                      return (
                        <td key={col.key}>
                          <a href={proteinLink(species, sptype, row.gene)} target="_blank" rel="noreferrer">
                            {row.gene}
                          </a>
                        </td>
                      );
                    }
                    if (col.key === "term" && row.term) {
                      return (
                        <td key={col.key}>
                          <a href={`http://amigo.geneontology.org/amigo/term/${row.term}`} target="_blank" rel="noreferrer">
                            {row.term}
                          </a>
                        </td>
                      );
                    }
                    if (col.key === "pathway" && row.pathway) {
                      return (
                        <td key={col.key}>
                          <a href={`https://www.kegg.jp/pathway/${row.pathway}`} target="_blank" rel="noreferrer">
                            {row.pathway}
                          </a>
                        </td>
                      );
                    }
                    if (col.key === "interpro_id" && row.interpro_id) {
                      return (
                        <td key={col.key}>
                          <a href={`https://www.ebi.ac.uk/interpro/entry/InterPro/${row.interpro_id}/`} target="_blank" rel="noreferrer">
                            {row.interpro_id}
                          </a>
                        </td>
                      );
                    }
                    return <td key={col.key}>{row[col.key] || "-"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
          <SimplePagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </div>
      ) : null}
    </section>
  );
}
