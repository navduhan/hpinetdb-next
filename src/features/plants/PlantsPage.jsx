import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import plants from "@/shared/content/plants.json";
import { pathogen } from "@/shared/content/pathogen";
import { disease } from "@/shared/content/disease";
import { diseaseInfo } from "@/shared/content/disease-info";
import { fungi, bacteria, virus } from "@/shared/content/pathdata";
import { host_genes } from "@/shared/content/genes";
import { PageHeader } from "@/shared/ui/PageHeader";
import { csvToArray } from "@/shared/utils/url";
import { hpinetApi } from "@/shared/api/hpinetApi";
import { useQueryResource } from "@/shared/hooks/useQueryResource";

function getPlantFromId(id) {
  return plants.find((item) => item.id === id) || plants[0];
}

export default function PlantsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedHost = searchParams.get("host");
  const initialPlant = requestedHost
    ? plants.find((item) => item.name === requestedHost) || getPlantFromId(searchParams.get("id") || "1")
    : getPlantFromId(searchParams.get("id") || "1");
  const requestedPathogen = searchParams.get("pathogen");
  const initialPathogen = requestedPathogen && initialPlant.pathogen.includes(requestedPathogen)
    ? requestedPathogen
    : initialPlant.pathogen[0];
  const [species, setSpecies] = useState(initialPlant.name);
  const [pathogenId, setPathogenId] = useState(initialPathogen);
  const [idType, setIdType] = useState(searchParams.get("idtype") === "pathogen" ? "pathogen" : "host");
  const [searchType, setSearchType] = useState(searchParams.get("searchType") === "keyword" ? "keyword" : "protein");
  const [genes, setGenes] = useState(searchParams.get("genes") || "");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [anotType, setAnotType] = useState(searchParams.get("anotType") || "go");
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const geneFileInputRef = useRef(null);

  const speciesPathogens = useMemo(() => {
    const selected = plants.find((item) => item.name === species);
    return selected?.pathogen || [];
  }, [species]);

  const diseaseName = disease[`${species}_${pathogenId}`] || "Not specified";

  const hostGeneSample = host_genes[species] || "";
  const pathogenGeneSample = host_genes[pathogenId] || "";
  const exampleGenes = useMemo(() => {
    const source = idType === "host" ? hostGeneSample : pathogenGeneSample;
    return csvToArray(source).slice(0, 40).join(",");
  }, [hostGeneSample, idType, pathogenGeneSample]);
  const annotationOptions = useMemo(() => {
    const shared = [
      { value: "go", label: "GO" },
      { value: "kegg", label: "KEGG" },
      { value: "local", label: "Localization" },
      { value: "interpro", label: "InterPro" }
    ];
    if (idType === "host") {
      return [...shared, { value: "tf", label: "TF" }];
    }
    return [...shared, { value: "virulence", label: "Virulence" }];
  }, [idType]);
  const keywordPlaceholder = useMemo(() => {
    const byTarget = {
      go: "e.g., defense response, kinase activity, WRKY",
      kegg: "e.g., MAPK signaling, plant-pathogen interaction",
      local: "e.g., nucleus, membrane, chloroplast",
      interpro: "e.g., leucine-rich repeat, NB-ARC, kinase domain",
      tf: "e.g., WRKY, bZIP, NAC",
      virulence: "e.g., effector, toxin, secretion"
    };
    return byTarget[anotType] || "Enter annotation keyword";
  }, [anotType]);
  const hasAdvancedFilters =
    idType === "pathogen" ||
    searchType === "keyword" ||
    csvToArray(genes).length > 0 ||
    keyword.trim().length > 0;
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(hasAdvancedFilters);
  const activeAdvancedFilters = showAdvancedFilters && hasAdvancedFilters;
  const activeFilterSummary = [
    `Gene class: ${idType}`,
    `Search type: ${searchType}`,
    searchType === "keyword" ? `Annotation target: ${anotType}` : null,
    searchType === "protein" ? `Gene IDs: ${csvToArray(genes).length}` : null,
    searchType === "keyword" ? `Keyword: ${keyword.trim() || "(empty)"}` : null
  ].filter(Boolean);
  const snapshotQuery = useQueryResource({
    key: ["plant-snapshot", species, pathogenId],
    enabled: Boolean(species && pathogenId),
    staleTime: 60_000,
    queryFn: ({ signal }) => hpinetApi.getPlantSnapshot({ host: species, pathogen: pathogenId, signal })
  });
  const snapshot = snapshotQuery.data;
  const diseaseDetails = diseaseInfo[`${species}_${pathogenId}`];
  const hostAnnotationLinks = [
    { label: "GO", href: `/go?id=${species}&class=host` },
    { label: "KEGG", href: `/kegg?id=${species}&class=host` },
    { label: "InterPro", href: `/interpro?id=${species}&class=host` },
    { label: "Localization", href: `/local?id=${species}&class=host` },
    { label: "TF", href: `/tf?id=${species}&class=host` }
  ];
  const pathogenAnnotationLinks = [
    { label: "GO", href: `/go?id=${pathogenId}&class=pathogen` },
    { label: "KEGG", href: `/kegg?id=${pathogenId}&class=pathogen` },
    { label: "InterPro", href: `/interpro?id=${pathogenId}&class=pathogen` },
    { label: "Localization", href: `/local?id=${pathogenId}&class=pathogen` },
    { label: "Virulence", href: `/virulence?id=effector_and_secretory&species=${pathogenId}` }
  ];

  async function handleGeneFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setGenes(csvToArray(text).join(","));
    event.target.value = "";
  }

  useEffect(() => {
    const allowed = new Set(annotationOptions.map((item) => item.value));
    if (!allowed.has(anotType)) {
      setAnotType(idType === "host" ? "go" : "virulence");
    }
  }, [annotationOptions, anotType, idType]);

  const buildInteractomeSearch = () => {
    const effectiveIdType = showAdvancedFilters ? idType : "host";
    const effectiveSearchType = showAdvancedFilters ? searchType : "protein";
    const params = new URLSearchParams({
      host: species,
      pathogen: pathogenId,
      idtype: effectiveIdType,
      searchType: effectiveSearchType
    });

    if (showAdvancedFilters && effectiveSearchType === "protein" && csvToArray(genes).length) {
      params.set("genes", csvToArray(genes).join(","));
    }
    if (showAdvancedFilters && effectiveSearchType === "keyword") {
      params.set("anotType", anotType);
      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }
    }

    return params.toString();
  };

  return (
    <section className="hp-fade-up">
      <PageHeader
        title="Host-Pathogen Selection"
        subtitle="Select cereal species, pathogen, and optional gene filters before interactome inference."
        actions={
          <Button size="sm" variant="outline-secondary" onClick={() => setShowWorkflowGuide(true)}>
            Workflow Guidance
          </Button>
        }
      />

      <div className="hp-card mb-3">
        <Row className="g-3">
          <Col md={6}>
            <Form.Label>Host species</Form.Label>
            <Form.Select
              value={species}
              onChange={(e) => {
                const nextSpecies = e.target.value;
                setSpecies(nextSpecies);
                const firstPathogen = plants.find((item) => item.name === nextSpecies)?.pathogen?.[0];
                if (firstPathogen) {
                  setPathogenId(firstPathogen);
                }
              }}
            >
              {plants.map((item) => (
                <option value={item.name} key={item.id}>{item.sname} ({item.name})</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label>Pathogen species</Form.Label>
            <Form.Select value={pathogenId} onChange={(e) => setPathogenId(e.target.value)}>
              <optgroup label="Fungi">
                {speciesPathogens.filter((item) => fungi.includes(item)).map((item) => (
                  <option key={item} value={item}>{pathogen[item] || item}</option>
                ))}
              </optgroup>
              <optgroup label="Bacteria">
                {speciesPathogens.filter((item) => bacteria.includes(item)).map((item) => (
                  <option key={item} value={item}>{pathogen[item] || item}</option>
                ))}
              </optgroup>
              <optgroup label="Virus">
                {speciesPathogens.filter((item) => virus.includes(item)).map((item) => (
                  <option key={item} value={item}>{pathogen[item] || item}</option>
                ))}
              </optgroup>
            </Form.Select>
          </Col>
        </Row>

        <div className="hp-kpi-grid mt-3">
          <div className="hp-kpi"><p>Disease</p><h3>{diseaseName}</h3></div>
          <div className="hp-kpi"><p>Selected host</p><h3>{species}</h3></div>
          <div className="hp-kpi"><p>Selected pathogen</p><h3><em>{pathogen[pathogenId] || pathogenId}</em></h3></div>
        </div>
      </div>

      <div className="hp-card mb-3">
        <h5>Disease Data Snapshot</h5>
        <div className="hp-kpi-grid mt-3">
          <div className="hp-kpi">
            <p>Domain interactions</p>
            <h3>{snapshot?.domain?.interactions?.toLocaleString?.() ?? "-"}</h3>
          </div>
          <div className="hp-kpi">
            <p>Host proteins (domain pair)</p>
            <h3>{snapshot?.domain?.hostProteins?.toLocaleString?.() ?? "-"}</h3>
          </div>
          <div className="hp-kpi">
            <p>Pathogen proteins (domain pair)</p>
            <h3>{snapshot?.domain?.pathogenProteins?.toLocaleString?.() ?? "-"}</h3>
          </div>
          <div className="hp-kpi">
            <p>Host GO annotations</p>
            <h3>{snapshot?.hostCounts?.go?.annotations?.toLocaleString?.() ?? "-"}</h3>
          </div>
          <div className="hp-kpi">
            <p>Pathogen GO annotations</p>
            <h3>{snapshot?.pathogenCounts?.go?.annotations?.toLocaleString?.() ?? "-"}</h3>
          </div>
          <div className="hp-kpi">
            <p>Pathogen effector annotations</p>
            <h3>{snapshot?.pathogenCounts?.effector?.annotations?.toLocaleString?.() ?? "-"}</h3>
          </div>
        </div>
        <small className="hp-muted d-block mt-2">
          {snapshotQuery.isLoading
            ? "Loading disease snapshot..."
            : snapshotQuery.error
              ? "Could not load snapshot counts from backend."
              : null}
        </small>
      </div>

      <div className="hp-card mb-3">
        <h5>Disease Information</h5>
        <Row className="g-3 mt-1">
          <Col md={8}>
            <p className="mb-2">
              {diseaseDetails?.overview || `${diseaseName} affects the ${species} - ${pathogen[pathogenId] || pathogenId} pathosystem.`}
            </p>
            <p className="mb-0">
              <strong>Typical symptoms:</strong>{" "}
              {diseaseDetails?.keySymptoms || "Curated symptom notes for this host-pathogen pair will be expanded in the next data release."}
            </p>
          </Col>
          <Col md={4}>
            <div className="hp-annot-box">
              <h6 className="mb-2">Citations</h6>
              {diseaseDetails?.citations?.length ? (
                <ul className="mb-0 ps-3">
                  {diseaseDetails.citations.map((item) => (
                    <li key={item.url}>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hp-muted mb-0">No curated citation added for this pair yet.</p>
              )}
            </div>
          </Col>
        </Row>
      </div>

      <div className="hp-card mb-3">
        <h5>Annotation quick links</h5>
        <Row className="g-3 mt-1">
          <Col md={6}>
            <div className="hp-annot-box">
              <h6>Host annotation modules</h6>
              <div className="hp-annot-links">
                {hostAnnotationLinks.map((item) => (
                  <Link key={item.label} to={item.href} className="hp-annot-link">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="hp-annot-box">
              <h6>Pathogen annotation modules</h6>
              <div className="hp-annot-links">
                {pathogenAnnotationLinks.map((item) => (
                  <Link key={item.label} to={item.href} className="hp-annot-link">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <div className="hp-card mb-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <h5 className="mb-0">Advanced Filters</h5>
          <div className="d-flex align-items-center gap-2">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                setIdType("host");
                setSearchType("protein");
                setGenes("");
                setKeyword("");
                setAnotType("go");
              }}
            >
              Reset Filters
            </Button>
            <Form.Check
              type="switch"
              id="advanced-filters-switch"
              label={showAdvancedFilters ? "On" : "Off"}
              checked={showAdvancedFilters}
              onChange={(e) => setShowAdvancedFilters(e.target.checked)}
            />
          </div>
        </div>
        {showAdvancedFilters ? (
          <div className="mb-2">
            {activeFilterSummary.map((item) => (
              <span className="hp-stat-pill" key={item}>{item}</span>
            ))}
          </div>
        ) : null}
        {showAdvancedFilters ? (
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>Gene ID class</Form.Label>
              <Form.Select
                value={idType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setIdType(nextType);
                  if (searchType === "protein") {
                    setGenes("");
                  }
                }}
              >
                <option value="host">Host</option>
                <option value="pathogen">Pathogen</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Search type</Form.Label>
              <Form.Select
                value={searchType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setSearchType(nextType);
                  if (nextType === "keyword") {
                    setGenes("");
                  } else {
                    setKeyword("");
                  }
                }}
              >
                <option value="protein">Protein</option>
                <option value="keyword">Keyword</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Active filter</Form.Label>
              <Form.Control
                readOnly
                value={searchType === "protein" ? "Protein IDs list" : `Keyword in ${anotType.toUpperCase()} annotations`}
              />
            </Col>
            {searchType === "keyword" ? (
              <>
                <Col md={5}>
                  <Form.Label>Keyword filter</Form.Label>
                  <Form.Control
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder={keywordPlaceholder}
                  />
                </Col>
                <Col md={7}>
                  <Form.Label>Annotation target</Form.Label>
                  <Form.Select value={anotType} onChange={(e) => setAnotType(e.target.value)}>
                    {annotationOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </>
            ) : null}
            {searchType === "protein" ? (
              <Col md={12}>
                <Form.Label>Gene list (comma/newline/tab separated)</Form.Label>
                <Form.Control as="textarea" rows={5} value={genes} onChange={(e) => setGenes(e.target.value)} />
                <div className="hp-input-tools">
                  <Button size="sm" variant="outline-secondary" onClick={() => geneFileInputRef.current?.click()}>
                    Upload
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => setGenes(exampleGenes)}>
                    Use Example
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => setGenes("")}>
                    Clear
                  </Button>
                  <input
                    ref={geneFileInputRef}
                    type="file"
                    accept=".txt,.csv,.tsv"
                    onChange={handleGeneFileUpload}
                    hidden
                  />
                </div>
                <small className="hp-muted d-block mt-1">
                  Example host IDs: {hostGeneSample.slice(0, 120)}...
                </small>
                <small className="hp-muted d-block">
                  Example pathogen IDs: {pathogenGeneSample.slice(0, 120)}...
                </small>
              </Col>
            ) : null}
          </Row>
        ) : (
          <small className="hp-muted">Turn on to filter by genes, keyword, and annotation targets before running interactome.</small>
        )}
      </div>

      <div className="hp-card">
        <Button className="hp-btn-primary" onClick={() => navigate(`/interactome?${buildInteractomeSearch()}`)}>
          {activeAdvancedFilters ? "Apply Advanced Filters & Run Interactome" : "Run Interactome"}
        </Button>
      </div>

      <Modal show={showWorkflowGuide} onHide={() => setShowWorkflowGuide(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Plant Page Workflow Guidance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="hp-muted">Use default settings for fast exploration. Enable Advanced Filters only when you need targeted subsets.</p>
          <div className="hp-guide-grid">
            <div>
              <strong>Step 1</strong>
              <p className="mb-0">Choose host and pathogen pair.</p>
            </div>
            <div>
              <strong>Step 2</strong>
              <p className="mb-0">Optionally enable Advanced Filters for gene list or keyword mode.</p>
            </div>
            <div>
              <strong>Step 3</strong>
              <p className="mb-0">Run interactome and compare methods on the next page.</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWorkflowGuide(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
