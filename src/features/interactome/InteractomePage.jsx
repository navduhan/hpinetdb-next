import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { hpinetApi } from "@/shared/api/hpinetApi";
import { PageHeader } from "@/shared/ui/PageHeader";
import { csvToArray } from "@/shared/utils/url";
import { host_genes } from "@/shared/content/interactome-genes";
import { pathogen } from "@/shared/content/pathogen";

const interologOptions = ["HPIDB", "DIP", "MINT", "BioGRID", "IntAct", "Arabihpi"];
const domainOptions = ["3DID", "IDDI", "DOMINE"];
const defaultInterologSelection = ["HPIDB", "MINT"];
const defaultDomainSelection = ["3DID", "IDDI"];
const methodOptions = [
  { value: "interolog", label: "Interolog" },
  { value: "consensus", label: "Consensus" },
  { value: "domain", label: "Domain" },
  { value: "gosim", label: "GO Similarity" },
  { value: "phylo", label: "Phylo-profiling" }
];
const RUN_STATUS_LINES = [
  "HPInet is preparing your host-pathogen search space.",
  "Scanning interolog evidence across curated interaction databases.",
  "Matching domain signatures and validating candidate interaction pairs.",
  "Linking proteins to functional context and annotation layers.",
  "Building high-confidence interaction candidates for your selected method.",
  "Assembling the interaction matrix for downstream network analysis.",
  "Writing result records to the HPInet results workspace.",
  "Finalizing output so you can explore results and network views."
];

function toResultCategory(method) {
  if (method === "gosim") {
    return "go";
  }
  return method;
}

function previewGeneList(csvText, previewSize = 2) {
  const ids = csvToArray(csvText || "");
  if (ids.length === 0) return "-";
  if (ids.length <= previewSize) return ids.join(", ");
  return `${ids.slice(0, previewSize).join(", ")} ...`;
}

export default function InteractomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const host = searchParams.get("host") || "";
  const pathogenId = searchParams.get("pathogen") || "";
  const hasSpeciesContext = Boolean(host && pathogenId);
  const idType = searchParams.get("idtype") === "pathogen" ? "pathogen" : "host";
  const searchType = searchParams.get("searchType") === "keyword" ? "keyword" : "protein";
  const genes = searchParams.get("genes") || "";
  const keyword = searchParams.get("keyword") || "";
  const anotType = searchParams.get("anotType") || "go";
  const hasGenesSelected = csvToArray(genes).length > 0;
  const hasKeywordFilter = keyword.trim().length > 0;
  const hasAdvancedFilters =
    hasGenesSelected ||
    hasKeywordFilter ||
    searchType === "keyword" ||
    idType === "pathogen";
  const plantFiltersHref = useMemo(() => {
    const params = new URLSearchParams({
      host,
      pathogen: pathogenId,
      idtype: idType,
      searchType
    });
    if (searchType === "protein" && hasGenesSelected) {
      params.set("genes", csvToArray(genes).join(","));
    }
    if (searchType === "keyword") {
      params.set("anotType", anotType);
      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }
    }
    return `/plants?${params.toString()}`;
  }, [anotType, genes, host, idType, keyword, pathogenId, searchType]);

  const [method, setMethod] = useState("interolog");
  const [hi, setHi] = useState(80);
  const [hc, setHc] = useState(80);
  const [he, setHe] = useState("1e-20");
  const [pi, setPi] = useState(80);
  const [pc, setPc] = useState(80);
  const [pe, setPe] = useState("1e-20");
  const [goMethod, setGoMethod] = useState("wang");
  const [goScore, setGoScore] = useState("max");
  const [goThreshold, setGoThreshold] = useState(0.5);
  const [phyloPool, setPhyloPool] = useState("UP82");
  const [phyloThreshold, setPhyloThreshold] = useState(0.98);
  const [hostGenes, setHostGenes] = useState("");
  const [pathogenGenes, setPathogenGenes] = useState("");
  const [intDb, setIntDb] = useState(defaultInterologSelection);
  const [domDb, setDomDb] = useState(defaultDomainSelection);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMethodGuide, setShowMethodGuide] = useState(false);
  const [error, setError] = useState("");
  const [runStatusIndex, setRunStatusIndex] = useState(0);
  const hostGeneFileRef = useRef(null);
  const pathogenGeneFileRef = useRef(null);

  const geneHint = useMemo(() => {
    const hostHint = host_genes[host] || "";
    const pathogenHint = host_genes[pathogenId] || "";
    return {
      host: previewGeneList(hostHint, 2),
      pathogen: previewGeneList(pathogenHint, 2)
    };
  }, [host, pathogenId]);
  const hostExampleGenes = useMemo(() => csvToArray(host_genes[host] || "").join(","), [host]);
  const pathogenExampleGenes = useMemo(
    () => csvToArray(host_genes[pathogenId] || "").join(","),
    [pathogenId]
  );

  async function handleUpload(event, setter) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setter(csvToArray(text).join(","));
    event.target.value = "";
  }

  function redirectToResults(params) {
    setTimeout(() => {
      navigate(`/results?${params.toString()}`);
    }, 650);
  }

  async function handleSubmit() {
    setError("");
    setIsSubmitting(true);

    try {
      const interologBody = {
        category: method,
        hspecies: `interolog_${host}`,
        pspecies: `interolog_${pathogenId}`,
        ids: idType,
        genes: searchType === "protein" ? csvToArray(genes).join(",") : "",
        stype: searchType,
        hi,
        hc,
        he,
        pi,
        pc,
        pe,
        intdb: intDb.map((item) => item.toLowerCase()).join(","),
        domdb: domDb.map((item) => item.toLowerCase()),
        keyword: searchType === "keyword" ? keyword.trim() : "",
        searchType,
        anotType: searchType === "keyword" ? anotType : "",
        host,
        pathogen: pathogenId
      };

      if (method === "domain") {
        const params = new URLSearchParams({
          category: "domain",
          host,
          pathogen: pathogenId,
          ids: idType,
          searchType,
          domdb: domDb.join(",")
        });
        if (searchType === "keyword" && keyword.trim()) {
          params.set("keyword", keyword.trim());
        }
        if (searchType === "protein" && csvToArray(genes).length) {
          params.set("genes", csvToArray(genes).join(","));
        }
        redirectToResults(params);
        return;
      }

      if (method === "gosim") {
        const hostGeneList = csvToArray(hostGenes).join(",");
        const pathogenGeneList = csvToArray(pathogenGenes).join(",");
        if (!hostGeneList || !pathogenGeneList) {
          throw new Error("GO Similarity requires both host and pathogen gene lists.");
        }
        const rid = await hpinetApi.submitGoSim({
          body: {
            category: "gosim",
            hspecies: host,
            pspecies: pathogenId,
            host_genes: hostGeneList,
            pathogen_genes: pathogenGeneList,
            method: goMethod,
            score: goScore,
            threshold: goThreshold
          }
        });
        const params = new URLSearchParams({
          id: rid,
          category: toResultCategory(method),
          host,
          pathogen: pathogenId
        });
        redirectToResults(params);
        return;
      }

      if (method === "phylo") {
        const hostGeneList = csvToArray(hostGenes).join(",");
        const pathogenGeneList = csvToArray(pathogenGenes).join(",");
        if (!hostGeneList || !pathogenGeneList) {
          throw new Error("Phylo-profiling requires both host and pathogen gene lists.");
        }
        const rid = await hpinetApi.submitPhylo({
          body: {
            category: "phylo",
            hspecies: host,
            pspecies: pathogenId,
            host_genes: hostGeneList,
            pathogen_genes: pathogenGeneList,
            method: phyloPool,
            threshold: phyloThreshold,
            hi,
            hc,
            he,
            pi,
            pc,
            pe
          }
        });
        const params = new URLSearchParams({
          id: rid,
          category: "phylo",
          host,
          pathogen: pathogenId
        });
        redirectToResults(params);
        return;
      }

      const rid = await hpinetApi.submitInterolog({ body: interologBody });
      const params = new URLSearchParams({
        id: rid,
        category: toResultCategory(method),
        host,
        pathogen: pathogenId,
        ids: idType,
        searchType,
        domdb: domDb.map((item) => item.toLowerCase()).join(",")
      });
      if (searchType === "keyword" && keyword.trim()) {
        params.set("keyword", keyword.trim());
      }
      if (searchType === "protein" && csvToArray(genes).length) {
        params.set("genes", csvToArray(genes).join(","));
      }
      redirectToResults(params);
    } catch (requestError) {
      setError(requestError?.payload?.message || requestError?.message || "Unable to submit interactome job.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetMethodSettings() {
    setMethod("interolog");
    setHi(80);
    setHc(80);
    setHe("1e-20");
    setPi(80);
    setPc(80);
    setPe("1e-20");
    setIntDb(defaultInterologSelection);
    setDomDb(defaultDomainSelection);
    setGoMethod("wang");
    setGoScore("max");
    setGoThreshold(0.5);
    setPhyloPool("UP82");
    setPhyloThreshold(0.98);
    setHostGenes("");
    setPathogenGenes("");
    setError("");
  }

  const seedSummary = searchType === "keyword"
    ? `Keyword mode (${idType}) in ${anotType.toUpperCase()} using "${keyword || "(empty)"}"`
    : `Protein mode (${idType}) with ${hasGenesSelected ? csvToArray(genes).length : 0} selected genes`;
  const hostGeneCount = csvToArray(hostGenes).length;
  const pathogenGeneCount = csvToArray(pathogenGenes).length;
  const methodHint = method === "interolog"
    ? "Best for broad, homology-supported interaction discovery."
    : method === "consensus"
      ? "Most conservative option. Keeps only interactions supported by Interolog + Domain."
      : method === "domain"
        ? "Useful when domain evidence is more reliable than sequence transfer."
        : method === "gosim"
          ? "Requires host and pathogen gene lists; compares GO functional similarity."
          : "Requires host and pathogen gene lists; infers links via profile co-occurrence.";

  let submitHint = "";
  if ((method === "interolog" || method === "consensus") && intDb.length === 0) {
    submitHint = "Select at least one Interolog database.";
  } else if ((method === "domain" || method === "consensus") && domDb.length === 0) {
    submitHint = "Select at least one Domain database.";
  } else if ((method === "gosim" || method === "phylo") && hostGeneCount === 0) {
    submitHint = "Provide host genes to run this method.";
  } else if ((method === "gosim" || method === "phylo") && pathogenGeneCount === 0) {
    submitHint = "Provide pathogen genes to run this method.";
  }
  const canSubmit = !submitHint && !isSubmitting;
  const runStatusLine = RUN_STATUS_LINES[runStatusIndex % RUN_STATUS_LINES.length];

  useEffect(() => {
    if (!isSubmitting) {
      setRunStatusIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setRunStatusIndex((prev) => (prev + 1) % RUN_STATUS_LINES.length);
    }, 1600);
    return () => clearInterval(timer);
  }, [isSubmitting]);

  if (!hasSpeciesContext) {
    return (
      <section className="hp-fade-up">
        <PageHeader
          title="Interactome Inference"
          subtitle="Select a host-pathogen pair from Species first."
        />
        <Alert variant="warning" className="mb-3">
          Species context is missing. Start from Species Selection so Interactome receives host and pathogen inputs.
        </Alert>
        <Button as={Link} to="/plants?id=1" className="hp-btn-primary">
          Go To Species Selection
        </Button>
      </section>
    );
  }

  return (
    <section className="hp-fade-up">
      <PageHeader
        title="Interactome Inference"
        subtitle={(
          <>
            Selected pair: {host} vs <em>{pathogen[pathogenId] || pathogenId}</em>. Choose a method and submit.
          </>
        )}
      />

      <div className="hp-card mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Link to="/">Home</Link>
            <span className="hp-muted">/</span>
            <Link to={plantFiltersHref}>Plant Filters</Link>
            <span className="hp-muted">/</span>
            <span>Interactome</span>
          </div>
          <div className="d-flex gap-2">
            <Button as={Link} to={plantFiltersHref} size="sm" variant="outline-secondary">
              Edit Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="hp-card mb-3">
        <p className="hp-muted mb-2">
          Selected context from previous step:
        </p>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <span className="hp-stat-pill">Host: {host}</span>
          <span className="hp-stat-pill">Pathogen: {pathogen[pathogenId] || pathogenId}</span>
          {idType !== "host" ? <span className="hp-stat-pill">ID class: {idType}</span> : null}
          {searchType !== "protein" ? <span className="hp-stat-pill">Search type: {searchType}</span> : null}
          {searchType === "protein" && hasGenesSelected ? <span className="hp-stat-pill">Seed genes: {csvToArray(genes).length}</span> : null}
          {searchType === "keyword" ? <span className="hp-stat-pill">Keyword: {keyword || "(empty)"}</span> : null}
        </div>
        {hasAdvancedFilters ? (
          <>
            <Form.Label>Filters from previous step</Form.Label>
            <Form.Control readOnly value={seedSummary} />
          </>
        ) : (
          <small className="hp-muted">No advanced filters were passed from the Plant page.</small>
        )}
      </div>

      <div className="hp-card mb-3">
        <Row className="g-3 align-items-end">
          <Col md={12}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <Form.Label className="mb-0">Inference method</Form.Label>
              <Button size="sm" variant="outline-secondary" onClick={resetMethodSettings}>
                Reset Method Settings
              </Button>
            </div>
            <div className="d-flex flex-wrap gap-3">
              {methodOptions.map((item) => (
                <Form.Check
                  key={item.value}
                  inline
                  type="radio"
                  name="inference-method"
                  id={`method-${item.value}`}
                  label={item.label}
                  value={item.value}
                  checked={method === item.value}
                  onChange={(e) => setMethod(e.target.value)}
                />
              ))}
            </div>
            <div className="mt-2">
              <Button size="sm" variant="outline-info" type="button" onClick={() => setShowMethodGuide(true)}>
                Method Guide
              </Button>
              <Form.Text className="text-muted ms-2">Open method descriptions.</Form.Text>
            </div>
            <div className="hp-muted mt-2">{methodHint}</div>
            <div className="hp-muted mt-2">
              Consensus currently supports only Interolog + Domain evidence.
            </div>
          </Col>
        </Row>
      </div>

      {method === "interolog" || method === "consensus" ? (
        <div className="hp-card mb-3">
          <h5>Interolog databases and thresholds</h5>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Interolog databases</Form.Label>
              <div className="mb-2">
                <span className="hp-stat-pill">Selected: {intDb.length}</span>
              </div>
              <div className="mb-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setIntDb(interologOptions)}
                  className="me-2"
                >
                  Select all
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setIntDb(defaultInterologSelection)}>
                  Reset default
                </Button>
              </div>
              <div className="d-flex flex-wrap gap-3">
                {interologOptions.map((item) => (
                  <Form.Check
                    key={item}
                    inline
                    type="checkbox"
                    label={item}
                    checked={intDb.includes(item)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIntDb((prev) => Array.from(new Set([...prev, item])));
                      } else {
                        setIntDb((prev) => prev.filter((v) => v !== item));
                      }
                    }}
                  />
                ))}
              </div>
            </Col>
            <Col md={6} />
            <Col md={2}><Form.Label>Host identity</Form.Label><Form.Control type="number" value={hi} onChange={(e) => setHi(Number(e.target.value))} /></Col>
            <Col md={2}><Form.Label>Host coverage</Form.Label><Form.Control type="number" value={hc} onChange={(e) => setHc(Number(e.target.value))} /></Col>
            <Col md={2}><Form.Label>Host e-value</Form.Label><Form.Control value={he} onChange={(e) => setHe(e.target.value)} /></Col>
            <Col md={2}><Form.Label>Path identity</Form.Label><Form.Control type="number" value={pi} onChange={(e) => setPi(Number(e.target.value))} /></Col>
            <Col md={2}><Form.Label>Path coverage</Form.Label><Form.Control type="number" value={pc} onChange={(e) => setPc(Number(e.target.value))} /></Col>
            <Col md={2}><Form.Label>Path e-value</Form.Label><Form.Control value={pe} onChange={(e) => setPe(e.target.value)} /></Col>
          </Row>
        </div>
      ) : null}

      {method === "domain" || method === "consensus" ? (
        <div className="hp-card mb-3">
          <h5>Domain databases</h5>
          <Row className="g-3">
            <Col md={12}>
              <Form.Label>Domain databases</Form.Label>
              <div className="mb-2">
                <span className="hp-stat-pill">Selected: {domDb.length}</span>
              </div>
              <div className="mb-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setDomDb(domainOptions)}
                  className="me-2"
                >
                  Select all
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setDomDb(defaultDomainSelection)}>
                  Reset default
                </Button>
              </div>
              <div className="d-flex flex-wrap gap-3">
                {domainOptions.map((item) => (
                  <Form.Check
                    key={item}
                    inline
                    type="checkbox"
                    label={item}
                    checked={domDb.includes(item)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setDomDb((prev) => Array.from(new Set([...prev, item])));
                      } else {
                        setDomDb((prev) => prev.filter((v) => v !== item));
                      }
                    }}
                  />
                ))}
              </div>
            </Col>
          </Row>
        </div>
      ) : null}

      {method === "gosim" || method === "phylo" ? (
        <div className="hp-card mb-3">
          <h5>Gene lists</h5>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Host genes</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={hostGenes}
                onChange={(e) => setHostGenes(e.target.value)}
                placeholder="Paste host genes (comma/newline/tab separated)"
              />
              <div className="hp-input-tools">
                <Button size="sm" variant="outline-secondary" onClick={() => hostGeneFileRef.current?.click()}>
                  Upload
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setHostGenes(hostExampleGenes)}>
                  Use Example
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setHostGenes("")}>
                  Clear
                </Button>
                <input
                  ref={hostGeneFileRef}
                  type="file"
                  accept=".txt,.csv,.tsv"
                  onChange={(e) => handleUpload(e, setHostGenes)}
                  hidden
                />
              </div>
              <small className="hp-muted">Example: {geneHint.host}...</small>
            </Col>
            <Col md={6}>
              <Form.Label>Pathogen genes</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={pathogenGenes}
                onChange={(e) => setPathogenGenes(e.target.value)}
                placeholder="Paste pathogen genes (comma/newline/tab separated)"
              />
              <div className="hp-input-tools">
                <Button size="sm" variant="outline-secondary" onClick={() => pathogenGeneFileRef.current?.click()}>
                  Upload
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setPathogenGenes(pathogenExampleGenes)}>
                  Use Example
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setPathogenGenes("")}>
                  Clear
                </Button>
                <input
                  ref={pathogenGeneFileRef}
                  type="file"
                  accept=".txt,.csv,.tsv"
                  onChange={(e) => handleUpload(e, setPathogenGenes)}
                  hidden
                />
              </div>
              <small className="hp-muted">Example: {geneHint.pathogen}...</small>
            </Col>
          </Row>
        </div>
      ) : null}

      {method === "gosim" ? (
        <div className="hp-card mb-3">
          <h5>GO similarity parameters</h5>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>Method</Form.Label>
              <Form.Select value={goMethod} onChange={(e) => setGoMethod(e.target.value)}>
                <option value="wang">Wang</option>
                <option value="resnik">Resnik</option>
                <option value="lin">Lin</option>
                <option value="pekar">Pekar</option>
                <option value="lowest_common_ancestor">Lowest Common Ancestor</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Scoring strategy</Form.Label>
              <Form.Select value={goScore} onChange={(e) => setGoScore(e.target.value)}>
                <option value="max">Max</option>
                <option value="avg">Average</option>
                <option value="bma">BMA</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Threshold</Form.Label>
              <Form.Control type="number" step="0.01" min="0" max="1" value={goThreshold} onChange={(e) => setGoThreshold(Number(e.target.value))} />
            </Col>
          </Row>
        </div>
      ) : null}

      {method === "phylo" ? (
        <div className="hp-card mb-3">
          <h5>Phylo-profiling parameters</h5>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Genome pool</Form.Label>
              <Form.Select value={phyloPool} onChange={(e) => setPhyloPool(e.target.value)}>
                <option value="UP82">UP82</option>
                <option value="UP50">UP50</option>
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Threshold</Form.Label>
              <Form.Control type="number" min="0" max="1" step="0.01" value={phyloThreshold} onChange={(e) => setPhyloThreshold(Number(e.target.value))} />
            </Col>
          </Row>
        </div>
      ) : null}

      {error ? <Alert variant="danger">{error}</Alert> : null}
      <div className="hp-card">
        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <Button className="hp-btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Submit Job
          </Button>
          <div className="text-end">
            {isSubmitting ? <small className="hp-muted d-block">{runStatusLine}</small> : null}
            {submitHint ? <small className="text-warning d-block">{submitHint}</small> : null}
          </div>
        </div>
      </div>

      <Modal show={showMethodGuide} onHide={() => setShowMethodGuide(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Interactome Method Guide</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6>Interolog</h6>
            <p className="mb-0">Transfers interactions through sequence homology using host and pathogen alignment thresholds.</p>
          </div>
          <div className="mb-3">
            <h6>Consensus</h6>
            <p className="mb-0">Combines Interolog and Domain evidence only (current implementation).</p>
          </div>
          <div className="mb-3">
            <h6>Domain</h6>
            <p className="mb-0">Uses domain-domain interaction evidence from selected domain databases.</p>
          </div>
          <div className="mb-3">
            <h6>GO Similarity</h6>
            <p className="mb-0">Scores host-pathogen gene pairs by semantic similarity between GO annotations.</p>
          </div>
          <div>
            <h6>Phylo-profiling</h6>
            <p className="mb-0">Infers links from co-occurrence patterns of genes across selected genome pools.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMethodGuide(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </section>
  );
}
