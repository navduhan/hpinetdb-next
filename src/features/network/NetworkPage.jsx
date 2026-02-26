import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import svg from "cytoscape-svg";
import { jsPDF } from "jspdf";
import CytoscapeComponent from "react-cytoscapejs";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { hpinetApi } from "@/shared/api/hpinetApi";
import { useQueryResource } from "@/shared/hooks/useQueryResource";
import { LoadingState } from "@/shared/ui/LoadingState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { VirtualizedTable } from "@/shared/ui/VirtualizedTable";

cytoscape.use(fcose);
cytoscape.use(svg);

const HOST_NODE_COLOR = "#286c7a";
const PATHOGEN_NODE_COLOR = "#a34538";
const SOURCE_STYLE = {
  hpidb: { label: "HPIDB", color: "#0f6b62" },
  mint: { label: "MINT", color: "#8a4a3e" },
  intact: { label: "IntAct", color: "#3e5d8a" },
  dip: { label: "DIP", color: "#a36e16" },
  biogrid: { label: "BioGRID", color: "#4d764d" },
  arabihpi: { label: "Arabihpi", color: "#2f6f75" },
  string: { label: "STRING", color: "#7a4f8f" },
  "3did": { label: "3DID", color: "#b33a3a" },
  iddi: { label: "IDDI", color: "#385f8a" },
  domine: { label: "DOMINE", color: "#6a5f38" }
};
const LAYOUT_OPTIONS = [
  { value: "fcose", label: "fCoSE (balanced)" },
  { value: "cose", label: "CoSE" },
  { value: "concentric", label: "Concentric" },
  { value: "circle", label: "Circle" },
  { value: "grid", label: "Grid" }
];
const NETWORK_CHUNK_SIZE = 5000;
const NETWORK_MAX_RENDER_EDGES = 20000;

function getLayoutConfig(name) {
  if (name === "cose") {
    return { name: "cose", fit: true, animate: false, padding: 20 };
  }
  if (name === "concentric") {
    return { name: "concentric", fit: true, animate: false, padding: 20 };
  }
  if (name === "circle") {
    return { name: "circle", fit: true, animate: false, padding: 20 };
  }
  if (name === "grid") {
    return { name: "grid", fit: true, animate: false, padding: 20 };
  }
  return {
    name: "fcose",
    fit: true,
    animate: false,
    nodeRepulsion: 420000,
    idealEdgeLength: 45,
    edgeElasticity: 0.35,
    numIter: 1800
  };
}

function buildEdgeId(row, rtype) {
  if (rtype === "interolog" || rtype === "consensus") {
    return `${row.intdb_x}-${row.Host_Protein}-${row.Pathogen_Protein}`;
  }
  if (rtype === "phylo") {
    return `Phylo-${row.Host_Protein}-${row.Pathogen_Protein}`;
  }
  if (rtype === "go" || rtype === "gosim") {
    return `GOsim-${row.Host_Protein}-${row.Pathogen_Protein}`;
  }
  const db = String(row.intdb || row.intdb_x || "Domain").trim() || "Domain";
  return `${db}-${row.Host_Protein}-${row.Pathogen_Protein}`;
}

function rowKeyOf(row, rtype) {
  return `${buildEdgeId(row, rtype)}|${String(row.Host_Protein || "")}|${String(row.Pathogen_Protein || "")}`;
}

function normalizeSourceKey(raw) {
  const value = String(raw || "")
    .split(/[;,|]/)[0]
    ?.trim()
    ?.toLowerCase();
  return value || "";
}

function resolveConfidenceValue(row) {
  const raw = row?.Confidence ?? row?.Score ?? row?.score;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function getEdgeColor(row, rtype) {
  if (rtype === "domain") {
    const key = normalizeSourceKey(row.intdb || row.intdb_x);
    return SOURCE_STYLE[key]?.color || SOURCE_STYLE.domine.color;
  }
  if (rtype === "phylo") return "#7d3fc2";
  if (rtype === "go" || rtype === "gosim") return "#534e9f";

  const key = normalizeSourceKey(row.intdb_x || row.intdb);
  return SOURCE_STYLE[key]?.color || "#6b6b6b";
}

function getLegendItems(rtype) {
  if (rtype === "domain") {
    return [
      { label: SOURCE_STYLE["3did"].label, color: SOURCE_STYLE["3did"].color },
      { label: SOURCE_STYLE.iddi.label, color: SOURCE_STYLE.iddi.color },
      { label: SOURCE_STYLE.domine.label, color: SOURCE_STYLE.domine.color }
    ];
  }
  if (rtype === "phylo") {
    return [{ label: "Phylo", color: "#7d3fc2" }];
  }
  if (rtype === "go" || rtype === "gosim") {
    return [{ label: "GO Similarity", color: "#534e9f" }];
  }
  return [
    { label: SOURCE_STYLE.hpidb.label, color: SOURCE_STYLE.hpidb.color },
    { label: SOURCE_STYLE.mint.label, color: SOURCE_STYLE.mint.color },
    { label: SOURCE_STYLE.intact.label, color: SOURCE_STYLE.intact.color },
    { label: SOURCE_STYLE.dip.label, color: SOURCE_STYLE.dip.color },
    { label: SOURCE_STYLE.biogrid.label, color: SOURCE_STYLE.biogrid.color },
    { label: SOURCE_STYLE.arabihpi.label, color: SOURCE_STYLE.arabihpi.color },
    { label: SOURCE_STYLE.string.label, color: SOURCE_STYLE.string.color }
  ];
}

function getNodeLegendItems() {
  return [
    { label: "Host nodes", color: HOST_NODE_COLOR },
    { label: "Pathogen nodes", color: PATHOGEN_NODE_COLOR }
  ];
}

function resolveSourceLabel(edge, rtype) {
  const explicit = edge?.intdb_x || edge?.intdb;
  if (explicit) {
    const key = normalizeSourceKey(explicit);
    return SOURCE_STYLE[key]?.label || explicit;
  }
  if (rtype === "domain") {
    const edgeId = String(edge?.id || "");
    const domainPrefix = edgeId.split("-")[0];
    if (["3DID", "IDDI", "DOMINE"].includes(domainPrefix)) {
      return domainPrefix;
    }
    return "Domain";
  }
  if (rtype === "phylo") return "Phylo-profiling";
  if (rtype === "go" || rtype === "gosim") return "GO Similarity";
  return "N/A";
}

function downloadUri(uri, fileName) {
  const link = document.createElement("a");
  link.href = uri;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadText(text, fileName, mimeType = "application/json;charset=utf-8") {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  downloadUri(url, fileName);
  URL.revokeObjectURL(url);
}

export default function NetworkPage() {
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get("resultid") || "";
  const rtype = searchParams.get("rtype") || "interolog";
  const sourcePageParam = Number(searchParams.get("sourcePage"));
  const sourceSizeParam = Number(searchParams.get("sourceSize"));
  const sourceTotalParam = Number(searchParams.get("sourceTotal"));
  const sourcePage = Number.isFinite(sourcePageParam) ? sourcePageParam : null;
  const sourceSize = Number.isFinite(sourceSizeParam) ? sourceSizeParam : null;
  const sourceTotal = Number.isFinite(sourceTotalParam) ? sourceTotalParam : null;

  const [search, setSearch] = useState("");
  const [loadMode, setLoadMode] = useState("append");
  const [chunkOffset, setChunkOffset] = useState(0);
  const [accumulatedRows, setAccumulatedRows] = useState([]);
  const [networkTotal, setNetworkTotal] = useState(0);
  const [hasMoreRows, setHasMoreRows] = useState(false);
  const [fastMode, setFastMode] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedSourceKeys, setSelectedSourceKeys] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [expandCount, setExpandCount] = useState(100);
  const [expandedNodeId, setExpandedNodeId] = useState("");
  const [networkMetrics, setNetworkMetrics] = useState({
    nodes: 0,
    edges: 0
  });
  const [layoutName, setLayoutName] = useState("fcose");
  const cyRef = useRef(null);
  const nodeScoresRef = useRef({});

  const query = useQueryResource({
    key: ["network", resultId, rtype, chunkOffset],
    enabled: Boolean(resultId),
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      hpinetApi.getNetwork({
        resultId,
        category: rtype,
        limit: NETWORK_CHUNK_SIZE,
        offset: chunkOffset,
        sort: "confidence_desc",
        signal
      })
  });

  useEffect(() => {
    setChunkOffset(0);
    setAccumulatedRows([]);
    setNetworkTotal(0);
    setHasMoreRows(false);
  }, [resultId, rtype]);

  useEffect(() => {
    setChunkOffset(0);
    setAccumulatedRows([]);
  }, [loadMode]);

  useEffect(() => {
    if (!query.data) return;
    const incoming = Array.isArray(query.data.results) ? query.data.results : [];
    setNetworkTotal(Number(query.data.total || 0));
    setHasMoreRows(Boolean(query.data.hasMore));
    setAccumulatedRows((prev) => {
      if (loadMode !== "append") {
        return incoming;
      }
      if (chunkOffset === 0) {
        return incoming;
      }
      const seen = new Set(prev.map((row) => rowKeyOf(row, rtype)));
      const merged = [...prev];
      for (const row of incoming) {
        const key = rowKeyOf(row, rtype);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(row);
        }
      }
      return merged;
    });
  }, [query.data, chunkOffset, rtype, loadMode]);

  const rows = useMemo(
    () => (loadMode === "append" ? accumulatedRows : (query.data?.results || [])),
    [loadMode, accumulatedRows, query.data]
  );
  const legendItems = useMemo(() => getLegendItems(rtype), [rtype]);
  const nodeLegendItems = useMemo(() => getNodeLegendItems(), []);
  const loadedCount = Number(networkTotal || rows.length || 0);
  const supportsSourceFiltering = rtype === "interolog" || rtype === "consensus" || rtype === "domain";
  const availableSourceKeys = useMemo(() => {
    if (!supportsSourceFiltering) return [];
    return Array.from(
      new Set(
        rows
          .map((row) => normalizeSourceKey(row.intdb_x || row.intdb))
          .filter(Boolean)
      )
    );
  }, [rows, supportsSourceFiltering]);

  useEffect(() => {
    if (!supportsSourceFiltering) {
      setSelectedSourceKeys([]);
      return;
    }
    setSelectedSourceKeys((prev) => {
      const keep = prev.filter((key) => availableSourceKeys.includes(key));
      if (keep.length > 0) {
        return keep;
      }
      return [...availableSourceKeys];
    });
  }, [availableSourceKeys, supportsSourceFiltering]);

  const filteredRows = useMemo(() => {
    const needle = search.toLowerCase();
    return rows.filter((row) => {
      const confidence = resolveConfidenceValue(row);
      if (confidence !== null && confidence + 1e-9 < minConfidence) {
        return false;
      }

      if (supportsSourceFiltering && selectedSourceKeys.length > 0) {
        const sourceKey = normalizeSourceKey(row.intdb_x || row.intdb);
        if (sourceKey && !selectedSourceKeys.includes(sourceKey)) {
          return false;
        }
      }

      if (!needle) {
        return true;
      }
      return (
        String(row.Host_Protein || "").toLowerCase().includes(needle) ||
        String(row.Pathogen_Protein || "").toLowerCase().includes(needle)
      );
    });
  }, [rows, search, minConfidence, selectedSourceKeys, supportsSourceFiltering]);

  const visibleRows = useMemo(() => {
    if (!expandedNodeId) {
      return filteredRows;
    }
    const selectedRows = filteredRows
      .filter((row) => row.Host_Protein === expandedNodeId || row.Pathogen_Protein === expandedNodeId)
      .sort((a, b) => (resolveConfidenceValue(b) || 0) - (resolveConfidenceValue(a) || 0));
    return selectedRows.slice(0, Math.max(1, expandCount));
  }, [filteredRows, expandedNodeId, expandCount]);
  const overRenderCap = visibleRows.length > NETWORK_MAX_RENDER_EDGES;
  const renderRows = overRenderCap ? visibleRows.slice(0, NETWORK_MAX_RENDER_EDGES) : visibleRows;
  const effectiveFastMode = fastMode || renderRows.length > 5000;

  useEffect(() => {
    if (!expandedNodeId) return;
    const stillPresent = filteredRows.some(
      (row) => row.Host_Protein === expandedNodeId || row.Pathogen_Protein === expandedNodeId
    );
    if (!stillPresent) {
      setExpandedNodeId("");
    }
  }, [expandedNodeId, filteredRows]);

  const elements = useMemo(() => {
    const edges = renderRows.map((row) => ({
      data: {
        id: buildEdgeId(row, rtype),
        source: row.Host_Protein,
        target: row.Pathogen_Protein,
        Host_Protein: row.Host_Protein,
        Pathogen_Protein: row.Pathogen_Protein,
        intdb: row.intdb,
        intdb_x: row.intdb_x,
        edgeColor: getEdgeColor(row, rtype)
      }
    }));

    const hosts = Array.from(new Set(renderRows.map((row) => row.Host_Protein))).map((id) => ({
      data: { id, label: id, className: "host" }
    }));

    const pathogens = Array.from(new Set(renderRows.map((row) => row.Pathogen_Protein))).map((id) => ({
      data: { id, label: id, className: "pat" }
    }));

    return [...edges, ...hosts, ...pathogens];
  }, [renderRows, rtype]);

  const layoutConfig = useMemo(() => getLayoutConfig(layoutName), [layoutName]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    // Avoid re-layout on every chunk append; it can race Cytoscape internals for large graphs.
    try {
      if (elements.length > 0) {
        cy.fit(undefined, 20);
      }
    } catch {
      // ignore transient fit errors during mount/update churn
    }
  }, [elements]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const nodes = cy.nodes();
    const edges = cy.edges();
    if (nodes.length === 0) {
      nodeScoresRef.current = {};
      setNetworkMetrics({ nodes: 0, edges: 0 });
      return;
    }

    let centrality = null;
    try {
      centrality = cy.elements().betweennessCentrality({ directed: false });
    } catch {
      centrality = null;
    }

    const scores = {};
    nodes.forEach((node) => {
      const degree = node.degree();
      const betweenness = centrality ? Number(centrality.betweenness(node).toFixed(4)) : null;
      scores[node.id()] = { degree, betweenness };
    });

    nodeScoresRef.current = scores;
    setNetworkMetrics({
      nodes: nodes.length,
      edges: edges.length
    });
  }, [elements]);

  const columns = [
    { key: "index", header: "#", width: "64px", render: (_, idx) => idx + 1 },
    { key: "Host_Protein", header: "Host", width: "2fr" },
    { key: "Pathogen_Protein", header: "Pathogen", width: "2fr" }
  ];

  function withExportLabels(exporter) {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    const restoreLabel = effectiveFastMode ? "" : "data(label)";

    try {
      cy.startBatch();
      cy.nodes().style("label", "data(label)");
      cy.nodes().style("font-size", 8);
      cy.endBatch();
      cy.fit(undefined, 20);
    } catch {
      return;
    }

    try {
      exporter(cy);
    } finally {
      if (!cy.destroyed()) {
        try {
          cy.startBatch();
          cy.nodes().style("label", restoreLabel);
          cy.nodes().style("font-size", 5);
          cy.endBatch();
        } catch {
          // ignore cleanup errors on unmounted/destroyed instance
        }
      }
    }
  }

  function exportPng() {
    withExportLabels((cy) => {
      const uri = cy.png({ full: true, bg: "#ffffff", scale: 3 });
      downloadUri(uri, `hpinet-network-${rtype}.png`);
    });
  }

  function exportSvg() {
    withExportLabels((cy) => {
      const svgMarkup = typeof cy.svg === "function"
        ? cy.svg({ full: true, scale: 1, bg: "#ffffff" })
        : null;
      if (!svgMarkup) {
        const uri = cy.png({ full: true, bg: "#ffffff", scale: 3 });
        downloadUri(uri, `hpinet-network-${rtype}.png`);
        return;
      }
      const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      downloadUri(url, `hpinet-network-${rtype}.svg`);
      URL.revokeObjectURL(url);
    });
  }

  function exportPdf() {
    withExportLabels((cy) => {
      const pngUri = cy.png({ full: true, bg: "#ffffff", scale: 3 });
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const drawWidth = pageWidth - margin * 2;
      const drawHeight = pageHeight - margin * 2;
      pdf.addImage(pngUri, "PNG", margin, margin, drawWidth, drawHeight, undefined, "FAST");
      pdf.save(`hpinet-network-${rtype}.pdf`);
    });
  }

  function zoomIn() {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: Math.min(cy.maxZoom(), cy.zoom() * 1.2),
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
    });
  }

  function zoomOut() {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: Math.max(cy.minZoom(), cy.zoom() / 1.2),
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
    });
  }

  function fitGraph() {
    const cy = cyRef.current;
    if (!cy) return;
    cy.fit(undefined, 20);
  }

  function resetView() {
    const cy = cyRef.current;
    if (!cy) return;
    cy.center();
    cy.zoom(1);
  }

  function applyLayout(nextLayout) {
    setLayoutName(nextLayout);
    const cy = cyRef.current;
    if (!cy) return;
    cy.layout(getLayoutConfig(nextLayout)).run();
  }

  function exportNetworkMetadata() {
    const payload = {
      timestamp: new Date().toISOString(),
      resultId,
      category: rtype,
      query: Object.fromEntries(searchParams.entries()),
      filters: {
        search,
        minConfidence,
        selectedSources: selectedSourceKeys,
        expandedNodeId: expandedNodeId || null,
        expandCount
      },
      counts: {
        loadedRows: loadedCount,
        fetchedRows: rows.length,
        filteredRows: filteredRows.length,
        visibleRows: visibleRows.length,
        renderedRows: renderRows.length,
        nodes: networkMetrics.nodes,
        edges: networkMetrics.edges
      }
    };
    downloadText(JSON.stringify(payload, null, 2), `hpinet-network-meta-${rtype}-${Date.now()}.json`);
  }

  return (
    <section className="hp-fade-up">
      <PageHeader
        title="Network Visualization"
        subtitle={`Result ID: ${resultId || "N/A"} | Category: ${rtype.toUpperCase()}`}
      />

      {!resultId ? <ErrorState message="Missing result ID (`resultid`) in query params." /> : null}
      {query.isLoading && rows.length === 0 ? <LoadingState label="Loading network" /> : null}
      {query.error ? <ErrorState message={query.error.message} /> : null}

      {!query.isLoading && !query.error && resultId ? (
        <Row className="g-3">
          <Col xl={4}>
            <div className="hp-card h-100 d-flex flex-column gap-3">
              <div>
                <Form.Label>Search node/edge members</Form.Label>
                <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} />
                <small className="hp-muted mt-1 d-block">
                  Rows in current network: {visibleRows.length.toLocaleString()} {expandedNodeId ? `(expanded from ${expandedNodeId})` : ""}
                </small>
                <small className="hp-muted d-block">
                  {sourceSize && sourcePage !== null
                    ? `This network is built from Results page ${sourcePage + 1} with page size ${sourceSize}${sourceTotal ? ` (total ${sourceTotal.toLocaleString()})` : ""}.`
                    : `Loaded ${loadedCount.toLocaleString()} interactions from result collection.`}
                </small>
                <small className="hp-muted d-block">
                  Fetched: {rows.length.toLocaleString()} / {loadedCount.toLocaleString()}
                </small>
                {overRenderCap ? (
                  <small className="hp-muted d-block">
                    Rendering capped at {NETWORK_MAX_RENDER_EDGES.toLocaleString()} edges for performance. Refine filters or expand from a selected node.
                  </small>
                ) : null}
              </div>

              <div>
                <Form.Label>Minimum confidence</Form.Label>
                <Form.Range
                  min={0}
                  max={1}
                  step={0.05}
                  value={minConfidence}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setMinConfidence(next <= 0.001 ? 0 : next);
                  }}
                />
                <small className="hp-muted d-block">Threshold: {minConfidence.toFixed(2)}</small>
              </div>

              <div>
                <div className="d-flex align-items-center justify-content-between">
                  <Form.Label className="mb-1">Progressive loading</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: 170 }}
                    value={loadMode}
                    onChange={(e) => setLoadMode(e.target.value)}
                  >
                    <option value="append">Append mode</option>
                    <option value="replace">Replace mode</option>
                  </Form.Select>
                </div>
                {loadMode === "append" ? (
                  <>
                    <div className="d-flex gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        disabled={!hasMoreRows || query.isLoading || rows.length >= NETWORK_MAX_RENDER_EDGES}
                        onClick={() => setChunkOffset((prev) => prev + NETWORK_CHUNK_SIZE)}
                      >
                        Load next {NETWORK_CHUNK_SIZE.toLocaleString()}
                      </Button>
                    </div>
                    <small className="hp-muted d-block">
                      Appends chunks for cumulative exploration (best for discovery).
                    </small>
                  </>
                ) : (
                  <>
                    <div className="d-flex gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        disabled={query.isLoading || chunkOffset <= 0}
                        onClick={() => setChunkOffset((prev) => Math.max(0, prev - NETWORK_CHUNK_SIZE))}
                      >
                        Previous {NETWORK_CHUNK_SIZE.toLocaleString()}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        disabled={query.isLoading || !hasMoreRows}
                        onClick={() => setChunkOffset((prev) => prev + NETWORK_CHUNK_SIZE)}
                      >
                        Next {NETWORK_CHUNK_SIZE.toLocaleString()}
                      </Button>
                    </div>
                    <small className="hp-muted d-block">
                      Replaces current chunk (best for stable performance and easy previous/next navigation).
                    </small>
                  </>
                )}
              </div>

              <div>
                {selectedNode ? (
                  <small className="hp-muted">
                    Selected node: <strong>{selectedNode.id}</strong> ({selectedNode.type}, degree {selectedNode.degree}, betweenness {selectedNode.betweenness ?? "n/a"})
                  </small>
                ) : selectedEdge ? (
                  <small className="hp-muted">
                    Selected edge: <strong>{selectedEdge.id}</strong> | Source DB: {resolveSourceLabel(selectedEdge, rtype)}
                  </small>
                ) : (
                  <small className="hp-muted">Select a node or edge to inspect details.</small>
                )}
              </div>

              <div>
                <h6 className="mb-2">Quick metrics</h6>
                <small className="hp-muted d-block">Nodes: {networkMetrics.nodes.toLocaleString()} | Edges: {networkMetrics.edges.toLocaleString()}</small>
                {selectedNode ? (
                  <small className="hp-muted d-block mt-1">
                    Selected {selectedNode.type}: <strong>{selectedNode.id}</strong> | Degree: {selectedNode.degree} | Betweenness: {selectedNode.betweenness ?? "n/a"}
                  </small>
                ) : selectedEdge ? (
                  <>
                    <small className="hp-muted d-block mt-1">
                      Selected Host: <strong>{selectedEdge.Host_Protein}</strong> | Degree: {nodeScoresRef.current[selectedEdge.Host_Protein]?.degree ?? "n/a"} | Betweenness: {nodeScoresRef.current[selectedEdge.Host_Protein]?.betweenness ?? "n/a"}
                    </small>
                    <small className="hp-muted d-block">
                      Selected Pathogen: <strong>{selectedEdge.Pathogen_Protein}</strong> | Degree: {nodeScoresRef.current[selectedEdge.Pathogen_Protein]?.degree ?? "n/a"} | Betweenness: {nodeScoresRef.current[selectedEdge.Pathogen_Protein]?.betweenness ?? "n/a"}
                    </small>
                  </>
                ) : (
                  <small className="hp-muted d-block mt-1">Select a node or edge to view host/pathogen metrics.</small>
                )}
              </div>

              <div>
                <h6 className="mb-2">Expand from selected node</h6>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    min={1}
                    max={5000}
                    value={expandCount}
                    onChange={(e) => setExpandCount(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      if (selectedNode?.id) {
                        setExpandedNodeId(selectedNode.id);
                      }
                    }}
                    disabled={!selectedNode?.id}
                  >
                    Expand
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => setExpandedNodeId("")}>
                    Full
                  </Button>
                </div>
                <small className="hp-muted d-block mt-1">
                  Select a node, choose N, then expand to view the next top-confidence interactions.
                </small>
              </div>

              <div className="mt-1">
                <h6 className="mb-2">Interaction Table</h6>
                <VirtualizedTable
                  columns={columns}
                  rows={renderRows}
                  rowKey={(row, idx) => `${row.Host_Protein}-${row.Pathogen_Protein}-${idx}`}
                  onRowClick={(row) => setSelectedEdge({ ...row, id: buildEdgeId(row, rtype) })}
                  height={430}
                />
              </div>

              {visibleRows.length === 0 ? (
                <small className="hp-muted">
                  No interactions match current search and filters. Reduce threshold or include more source databases.
                </small>
              ) : null}
            </div>
          </Col>

          <Col xl={8}>
            <div className="hp-card h-100">
              <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-2">
                <div style={{ minWidth: 220 }}>
                  <Form.Label className="mb-1">Network layout</Form.Label>
                  <Form.Select value={layoutName} onChange={(e) => applyLayout(e.target.value)}>
                    {LAYOUT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <Button size="sm" variant="outline-secondary" onClick={zoomIn}>+</Button>
                  <Button size="sm" variant="outline-secondary" onClick={zoomOut}>-</Button>
                  <Button size="sm" variant="outline-secondary" onClick={fitGraph}>Fit</Button>
                  <Button size="sm" variant="outline-secondary" onClick={resetView}>Reset</Button>
                  <Button size="sm" variant="outline-secondary" onClick={exportPng}>PNG</Button>
                  <Button size="sm" variant="outline-secondary" onClick={exportSvg}>SVG</Button>
                  <Button size="sm" variant="outline-secondary" onClick={exportPdf}>PDF</Button>
                  <Button size="sm" variant="outline-secondary" onClick={exportNetworkMetadata}>Meta JSON</Button>
                </div>
              </div>

              <small className="hp-muted d-block mb-2">Mouse: wheel to zoom, drag to pan.</small>
              <div className="mb-2">
                <Form.Check
                  type="switch"
                  id="network-fast-mode"
                  label="Fast render mode (recommended for large networks)"
                  checked={fastMode}
                  onChange={(e) => setFastMode(e.target.checked)}
                />
              </div>

              <CytoscapeComponent
                elements={elements}
                layout={layoutConfig}
                style={{ width: "100%", height: "clamp(420px, 62vh, 700px)" }}
                stylesheet={[
                  {
                    selector: "node",
                    style: {
                      width: 10,
                      height: 10,
                      "font-size": 5,
                      label: effectiveFastMode ? "" : "data(label)",
                      color: "#233",
                      "text-wrap": "none"
                    }
                  },
                  {
                    selector: 'node[className = "host"]',
                    style: {
                      "background-color": HOST_NODE_COLOR
                    }
                  },
                  {
                    selector: 'node[className = "pat"]',
                    style: {
                      "background-color": PATHOGEN_NODE_COLOR
                    }
                  },
                  {
                    selector: "edge",
                    style: {
                      width: effectiveFastMode ? 0.8 : 1,
                      "line-color": "data(edgeColor)",
                      opacity: effectiveFastMode ? 0.7 : 0.8
                    }
                  }
                ]}
                cy={(cy) => {
                  cyRef.current = cy;
                  cy.removeListener("tap");
                  cy.on("tap", "node", (e) => {
                    const data = e.target.data();
                    const score = nodeScoresRef.current[data.id] || {};
                    setSelectedNode({
                      id: data.id,
                      type: data.className === "host" ? "Host Gene" : "Pathogen Protein",
                      degree: e.target.degree(),
                      betweenness: score.betweenness ?? null
                    });
                    setSelectedEdge(null);
                  });

                  cy.on("tap", "edge", (e) => {
                    setSelectedEdge(e.target.data());
                    setSelectedNode(null);
                  });
                }}
              />

              <div className="mt-3 pt-3" style={{ borderTop: "1px solid #e3d7bf" }}>
                {supportsSourceFiltering && availableSourceKeys.length > 0 ? (
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <Form.Label className="mb-1">Source databases</Form.Label>
                      <div className="d-flex gap-2">
                        <Button size="sm" variant="outline-secondary" onClick={() => setSelectedSourceKeys([...availableSourceKeys])}>
                          All
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => setSelectedSourceKeys([])}>
                          None
                        </Button>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {availableSourceKeys.map((sourceKey) => (
                        <Form.Check
                          key={sourceKey}
                          inline
                          type="checkbox"
                          id={`network-source-${sourceKey}`}
                          label={SOURCE_STYLE[sourceKey]?.label || sourceKey}
                          checked={selectedSourceKeys.includes(sourceKey)}
                          onChange={(e) => {
                            setSelectedSourceKeys((prev) =>
                              e.target.checked
                                ? Array.from(new Set([...prev, sourceKey]))
                                : prev.filter((k) => k !== sourceKey)
                            );
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="d-flex flex-wrap gap-3">
                  {nodeLegendItems.map((item) => (
                    <div key={item.label} className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          backgroundColor: item.color,
                          display: "inline-block"
                        }}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}
                  {legendItems.map((item) => (
                    <div key={item.label} className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          backgroundColor: item.color,
                          display: "inline-block"
                        }}
                      />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      ) : null}
    </section>
  );
}
