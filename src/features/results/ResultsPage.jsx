import { useMemo, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { hpinetApi } from "@/shared/api/hpinetApi";
import { useQueryResource } from "@/shared/hooks/useQueryResource";
import { LoadingState } from "@/shared/ui/LoadingState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SimplePagination } from "@/shared/ui/SimplePagination";
import { VirtualizedTable } from "@/shared/ui/VirtualizedTable";
import { downloadCsv } from "@/features/results/csv";
import { arrayToCsv, csvToArray } from "@/shared/utils/url";
import { pathogen as pathogenLabels } from "@/shared/content/pathogen";
import { disease as diseaseByPair } from "@/shared/content/disease";

const PAGE_SIZE_OPTIONS = [100, 250, 500, 1000];
const MIN_FILTER_CHARS = 3;
const SOURCE_NOTATION_MAP = {
  hpidb: "HPIDB",
  dip: "DIP",
  mint: "MINT",
  biogrid: "BioGRID",
  intact: "IntAct",
  arabihpi: "Arabihpi",
  string: "STRING",
  "3did": "3DID",
  iddi: "IDDI",
  domine: "DOMINE"
};

function normalizeCategory(category) {
  if (category === "gosim") {
    return "go";
  }
  return category;
}

function renderGoTerms(value) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const parts = raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length <= 3) {
    return parts.join(" | ");
  }
  return `${parts.slice(0, 3).join(" | ")} ... (+${parts.length - 3})`;
}

function pmidLink(value) {
  const pmid = String(value || "").trim();
  if (!pmid) return "-";
  return (
    <a href={`https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(pmid)}/`} target="_blank" rel="noreferrer">
      {pmid}
    </a>
  );
}

function resolveDiseaseLabel(host, pathogen) {
  const directKey = `${host}_${pathogen}`;
  const legacyTypoKey = `${host}_${pathogen === "umaydis" ? "umydis" : pathogen}`;
  return diseaseByPair[directKey] || diseaseByPair[legacyTypoKey] || "";
}

function buildExpressionPubmedQuery({ host, pathogen, pathogenLabel }) {
  const diseaseLabel = resolveDiseaseLabel(host, pathogen);
  if (diseaseLabel) {
    return `"${host}" AND "${diseaseLabel}" AND expression`;
  }
  return `"${host}" AND "${pathogenLabel}" AND expression`;
}

function hostProteinLink(geneId) {
  const gene = String(geneId || "").trim();
  if (!gene) return "";
  return `https://plants.ensembl.org/Multi/Search/Results?species=all;idx=;q=${encodeURIComponent(gene)};site=ensemblunit`;
}

function pathogenProteinLink(geneId) {
  const gene = String(geneId || "").trim();
  if (!gene) return "";
  return `https://www.ncbi.nlm.nih.gov/search/all/?term=${encodeURIComponent(gene)}`;
}

function formatSourceNotation(value) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const parts = raw
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) return "-";
  const normalized = parts.map((item) => SOURCE_NOTATION_MAP[item.toLowerCase()] || item);
  return Array.from(new Set(normalized)).join(" | ");
}

function formatConfidence(row) {
  const raw = row?.Confidence ?? row?.Score ?? row?.score;
  if (raw === null || raw === undefined || raw === "") return "-";
  const n = Number(raw);
  if (!Number.isFinite(n)) return String(raw);
  return n.toFixed(4);
}

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const initialQueryFilter = searchParams.get("q") || "";
  const [filterInput, setFilterInput] = useState(initialQueryFilter);
  const [activeFilter, setActiveFilter] = useState(initialQueryFilter);
  const [pageSize, setPageSize] = useState(500);
  const [sequenceTarget, setSequenceTarget] = useState(null);

  const resultId = searchParams.get("id") || "";
  const category = normalizeCategory(searchParams.get("category") || "interolog");
  const host = searchParams.get("host") || "";
  const pathogen = searchParams.get("pathogen") || "";
  const idt = searchParams.get("ids") || "host";
  const genes = searchParams.get("genes") || "";
  const keyword = searchParams.get("keyword") || "";
  const searchType = searchParams.get("searchType") || "protein";
  const domdb = csvToArray(searchParams.get("domdb"));
  const pathogenLabel = pathogenLabels[pathogen] || pathogen;
  const expressionPubmedQuery = buildExpressionPubmedQuery({ host, pathogen, pathogenLabel });
  const trimmedFilterInput = filterInput.trim();
  const canApplyFilter = trimmedFilterInput.length === 0 || trimmedFilterInput.length >= MIN_FILTER_CHARS;
  const returnTo = `${location.pathname}?${searchParams.toString()}`;

  const applyFilter = () => {
    if (!canApplyFilter) return;
    setPage(0);
    setActiveFilter(trimmedFilterInput);
    const next = new URLSearchParams(searchParams);
    if (trimmedFilterInput) {
      next.set("q", trimmedFilterInput);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };

  const query = useQueryResource({
    key: ["results", category, resultId, page, pageSize, activeFilter, host, pathogen, genes, domdb.join(";")],
    enabled: Boolean(category && (resultId || category === "domain")),
    staleTime: 15_000,
    queryFn: async ({ signal }) => {
      if (category === "domain") {
        return hpinetApi.postDomainResults({
          body: {
            species: `${host}_${pathogen}`,
            page,
            size: pageSize,
            genes: csvToArray(genes),
            idt,
            intdb: domdb.map((item) => String(item).toUpperCase()),
            keyword,
            searchType,
            q: activeFilter
          },
          signal
        });
      }
      return hpinetApi.getResults({ resultId, category, page, size: pageSize, q: activeFilter, signal });
    }
  });
  const sequenceQuery = useQueryResource({
    key: ["sequence-pair", host, pathogen, sequenceTarget?.hid || "", sequenceTarget?.pid || ""],
    enabled: Boolean(host && pathogen && sequenceTarget?.hid && sequenceTarget?.pid),
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      hpinetApi.getSequencePair({
        host: String(host || "").toLowerCase(),
        pathogen: String(pathogen || "").toLowerCase(),
        hid: sequenceTarget.hid,
        pid: sequenceTarget.pid,
        signal
      })
  });

  const rows = query.data?.results || [];
  const total = Number(query.data?.total || 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const finalResultId = query.data?.resultid || resultId;
  const seedGenes = csvToArray(genes);
  const hasSearchContext =
    Boolean(host) ||
    Boolean(pathogen) ||
    Boolean(resultId) ||
    Boolean(finalResultId) ||
    Boolean(keyword.trim()) ||
    seedGenes.length > 0 ||
    domdb.length > 0 ||
    Boolean(activeFilter);

  const filteredRows = useMemo(() => rows, [rows]);

  const columns = useMemo(
    () => [
      {
        key: "idx",
        header: "#",
        width: "60px",
        render: (_, index) => page * pageSize + index + 1
      },
      {
        key: "Host_Protein",
        header: "Host Protein",
        width: "2fr",
        render: (row) => {
          const hid = row.Host_Protein || row.ProteinA;
          if (!hid) return "-";
          return (
            <a className="hp-protein-link" href={hostProteinLink(hid)} target="_blank" rel="noreferrer">
              {hid}
            </a>
          );
        }
      },
      {
        key: "expression",
        header: "Expression",
        width: "1.4fr",
        render: (row) => {
          const hid = row.Host_Protein || row.ProteinA;
          if (!hid) return "-";
          return (
            <div className="d-flex gap-1 flex-wrap">
              <a
                className="hp-annot-row-link"
                href={`https://www.ebi.ac.uk/gxa/genes/${encodeURIComponent(String(hid).split(".")[0])}`}
                target="_blank"
                rel="noreferrer"
              >
                Exp Atlas
              </a>
              <a
                className="hp-annot-row-link"
                href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(expressionPubmedQuery)}`}
                target="_blank"
                rel="noreferrer"
              >
                PubMed
              </a>
            </div>
          );
        }
      },
      {
        key: "Pathogen_Protein",
        header: "Pathogen Protein",
        width: "2fr",
        render: (row) => {
          const pid = row.Pathogen_Protein || row.ProteinB;
          if (!pid) return "-";
          return (
            <a className="hp-protein-link" href={pathogenProteinLink(pid)} target="_blank" rel="noreferrer">
              {pid}
            </a>
          );
        }
      },
      ...(category === "go"
        ? []
        : [
            {
              key: "src",
              header: "Source",
              width: "1fr",
              render: (row) => formatSourceNotation(row.intdb_x || row.intdb)
            }
          ]),
      {
        key: "confidence",
        header: "Confidence",
        width: "1fr",
        render: (row) => formatConfidence(row)
      },
      ...(category === "interolog" || category === "consensus"
        ? [
            {
              key: "Method",
              header: "Method",
              width: "1fr",
              render: (row) => row.Method || "-"
            },
            {
              key: "Type",
              header: "Type",
              width: "1fr",
              render: (row) => row.Type || "-"
            },
            {
              key: "PMID",
              header: "PubMed ID",
              width: "1fr",
              render: (row) => pmidLink(row.PMID)
            }
          ]
        : []),
      ...(category === "domain" || category === "consensus"
        ? [
            {
              key: "DomainA_name",
              header: "InteractorA Name",
              width: "1.5fr",
              render: (row) => row.DomainA_name || row.DomianA_name || "-"
            },
            {
              key: "DomainA_interpro",
              header: "InteractorA InterPro",
              width: "1.2fr",
              render: (row) => row.DomainA_interpro || row.DomianA_interpro || "-"
            },
            {
              key: "DomainB_name",
              header: "InteractorB Name",
              width: "1.5fr",
              render: (row) => row.DomainB_name || row.DomianB_name || "-"
            },
            {
              key: "DomainB_interpro",
              header: "InteractorB InterPro",
              width: "1.2fr",
              render: (row) => row.DomainB_interpro || row.DomianB_interpro || "-"
            }
          ]
        : []),
      ...(category === "go"
        ? [
            {
              key: "Host_GO",
              header: "Host GO Terms",
              width: "2fr",
              render: (row) => renderGoTerms(row.Host_GO)
            },
            {
              key: "Pathogen_GO",
              header: "Pathogen GO Terms",
              width: "2fr",
              render: (row) => renderGoTerms(row.Pathogen_GO)
            }
          ]
        : []),
      {
        key: "annotation",
        header: "Annotation",
        width: "1.3fr",
        render: (row) =>
          row.Host_Protein && row.Pathogen_Protein ? (
            <Link
              to={`/annotation?host=${host}&pathogen=${pathogen}&hid=${encodeURIComponent(
                row.Host_Protein
              )}&pid=${encodeURIComponent(row.Pathogen_Protein)}&from=results&category=${encodeURIComponent(
                category
              )}&returnTo=${encodeURIComponent(returnTo)}`}
              className="hp-annot-row-link"
            >
              Show
            </Link>
          ) : (
            "-"
          )
      },
      {
        key: "fasta",
        header: "FASTA",
        width: "1fr",
        render: (row) => {
          const hid = row.Host_Protein || row.ProteinA;
          const pid = row.Pathogen_Protein || row.ProteinB;
          if (!hid || !pid) return "-";
          return (
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setSequenceTarget({ hid, pid })}
            >
              FASTA
            </Button>
          );
        }
      }
    ],
    [category, expressionPubmedQuery, host, page, pageSize, pathogen, returnTo]
  );

  const renderTable = () => {
    if (filteredRows.length > 1000) {
      return (
        <VirtualizedTable
          columns={columns}
          rows={filteredRows}
          rowKey={(row, idx) => `${row.Host_Protein || "h"}-${row.Pathogen_Protein || "p"}-${idx}`}
          height={560}
        />
      );
    }

    return (
      <div className="hp-results-table-wrap">
        <Table responsive hover>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={`${row.Host_Protein || "h"}-${row.Pathogen_Protein || "p"}-${idx}`}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row, idx) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  function copyText(text) {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      return;
    }
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  function downloadFasta(name, text) {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.fasta`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="hp-fade-up">
      <PageHeader
        title="Interaction Results"
        subtitle={`Method: ${category.toUpperCase()} | Showing page ${page + 1} of ${pageCount}`}
        actions={
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button variant="outline-secondary" onClick={() => downloadCsv(filteredRows, category)}>
              Download CSV
            </Button>
            {finalResultId ? (
              <Link
                to={`/network?resultid=${encodeURIComponent(finalResultId)}&rtype=${encodeURIComponent(category)}&sourcePage=${encodeURIComponent(page)}&sourceSize=${encodeURIComponent(pageSize)}&sourceTotal=${encodeURIComponent(total)}`}
                className="btn btn-primary hp-btn-primary"
              >
                Open Network
              </Link>
            ) : null}
          </div>
        }
      />

      {hasSearchContext ? (
        <div className="hp-card mb-3">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {host ? <span className="hp-stat-pill">Host: {host}</span> : null}
            {pathogen ? <span className="hp-stat-pill">Pathogen: {pathogenLabel}</span> : null}
            <span className="hp-stat-pill">Method: {category.toUpperCase()}</span>
            {searchType ? <span className="hp-stat-pill">Search type: {searchType}</span> : null}
            {idt ? <span className="hp-stat-pill">ID class: {idt}</span> : null}
            {seedGenes.length ? <span className="hp-stat-pill">Genes: {seedGenes.length}</span> : null}
            {keyword.trim() ? <span className="hp-stat-pill">Keyword: {keyword.trim()}</span> : null}
            {domdb.length ? <span className="hp-stat-pill">Domain DBs: {domdb.join(", ")}</span> : null}
            {finalResultId ? <span className="hp-stat-pill">Result ID: {finalResultId}</span> : null}
            {activeFilter ? <span className="hp-stat-pill">Quick filter: "{activeFilter}"</span> : null}
          </div>
        </div>
      ) : null}

      <div className="hp-card mb-3">
        <small className="hp-muted d-block mb-2">
          Confidence score uses weighted evidence (method, source, cross-method support, annotation) and is normalized to 0-1.
          Tier guide: High &gt;= 0.75, Medium &gt;= 0.50, Low &lt; 0.50.
        </small>
        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Label>Quick filter (all pages)</Form.Label>
            <Form.Control
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyFilter();
                }
              }}
              placeholder={`Protein ID, source, method... (min ${MIN_FILTER_CHARS} chars)`}
            />
          </Col>
          <Col md={3}>
            <Form.Label>Rows per page</Form.Label>
            <Form.Select
              value={pageSize}
              onChange={(e) => {
                setPage(0);
                setPageSize(Number(e.target.value));
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={5}>
            <div className="d-flex gap-2 align-items-end mb-1">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={applyFilter}
                disabled={!canApplyFilter}
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  setPage(0);
                  setFilterInput("");
                  setActiveFilter("");
                  const next = new URLSearchParams(searchParams);
                  next.delete("q");
                  setSearchParams(next, { replace: true });
                }}
              >
                Clear
              </Button>
            </div>
            <small className="hp-muted d-block">
              Total matching records: {total.toLocaleString()} | Current page rows: {filteredRows.length.toLocaleString()}
            </small>
            {!canApplyFilter ? (
              <small className="text-warning d-block">Type at least {MIN_FILTER_CHARS} characters, or clear to show all records.</small>
            ) : null}
            {activeFilter ? <small className="hp-muted d-block">Active filter: "{activeFilter}"</small> : null}
          </Col>
        </Row>
      </div>

      {!resultId && category !== "domain" ? (
        <Alert variant="warning">No result ID was provided. Submit a job first.</Alert>
      ) : null}

      {query.isLoading ? <LoadingState label="Loading results" /> : null}
      {query.error ? <ErrorState message={query.error.message} /> : null}

      {!query.isLoading && !query.error ? (
        <div className="hp-card">
          {filteredRows.length === 0 ? (
            <Alert variant="light" className="mb-0">
              No results found. Consider changing your parameters or returning to Interactome to run again.
            </Alert>
          ) : (
            renderTable()
          )}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <SimplePagination page={page} pageCount={pageCount} onPageChange={setPage} />
            {category === "domain" && query.data?.resultid ? (
              <Button
                variant="outline-secondary"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set("id", query.data.resultid);
                  next.set("genes", arrayToCsv(csvToArray(genes)));
                  setSearchParams(next);
                }}
              >
                Persist Domain Result ID
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <Modal show={Boolean(sequenceTarget)} onHide={() => setSequenceTarget(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>FASTA Sequences</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="hp-muted mb-2">
            Host: {sequenceTarget?.hid || "-"} | Pathogen: {sequenceTarget?.pid || "-"}
          </p>
          {sequenceQuery.isLoading ? <p className="hp-muted mb-0">Loading sequences...</p> : null}
          {sequenceQuery.error ? <Alert variant="danger" className="mb-0">{sequenceQuery.error.message}</Alert> : null}
          {!sequenceQuery.isLoading && !sequenceQuery.error && sequenceQuery.data ? (
            <div className="d-flex flex-column gap-3">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong>Host FASTA ({sequenceQuery.data.host?.length || 0} aa)</strong>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => copyText(sequenceQuery.data.host?.fasta || "")}>
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => downloadFasta(sequenceQuery.data.host?.gene || "host-sequence", sequenceQuery.data.host?.fasta || "")}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="hp-seq-box">{sequenceQuery.data.host?.fasta || "-"}</pre>
              </div>
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong>Pathogen FASTA ({sequenceQuery.data.pathogen?.length || 0} aa)</strong>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-secondary" onClick={() => copyText(sequenceQuery.data.pathogen?.fasta || "")}>
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() =>
                        downloadFasta(sequenceQuery.data.pathogen?.gene || "pathogen-sequence", sequenceQuery.data.pathogen?.fasta || "")
                      }
                    >
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="hp-seq-box">{sequenceQuery.data.pathogen?.fasta || "-"}</pre>
              </div>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSequenceTarget(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
