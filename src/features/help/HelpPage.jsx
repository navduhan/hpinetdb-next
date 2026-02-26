import { Accordion, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/ui/PageHeader";

function Section({ title, children }) {
  return (
    <section className="hp-card mb-3">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

export default function HelpPage() {
  return (
    <section className="hp-fade-up">
      <PageHeader
        title="HPInet Help Center"
        subtitle="Complete guide for species selection, interactome inference, result interpretation, annotation lookup, network analysis, and troubleshooting."
      />

      <Section title="Quick Start">
        <p className="mb-2">
          Start from <Link to="/plants">Plant Selection</Link>, choose a host-pathogen pair, and optionally apply advanced filters. Continue to{" "}
          <Link to="/interactome">Interactome Inference</Link>, choose a method, and submit the job. Review output in{" "}
          <Link to="/results">Results</Link>, then open <Link to="/network">Network Visualization</Link> for graph-level analysis.
        </p>
        <p className="mb-0 hp-muted">
          Recommended first run: Interolog with default thresholds and default databases.
        </p>
      </Section>

      <Section title="Workflow Reference">
        <Table responsive hover>
          <thead>
            <tr>
              <th>Step</th>
              <th>Page</th>
              <th>What to do</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Plant Selection</td>
              <td>Select host and pathogen, optionally provide genes/keywords.</td>
              <td>Search context passed to interactome.</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Interactome Inference</td>
              <td>Select method and databases, submit job.</td>
              <td>Result ID for analysis pages.</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Results</td>
              <td>Filter, paginate, open annotation, view FASTA sequences.</td>
              <td>Prioritized interaction list.</td>
            </tr>
            <tr>
              <td>4</td>
              <td>Network</td>
              <td>Inspect clusters/hubs, search nodes, export figures.</td>
              <td>Graph-level interpretation and exports.</td>
            </tr>
            <tr>
              <td>5</td>
              <td>Annotation Pages</td>
              <td>Explore GO/KEGG/InterPro/Localization/TF/Effector records.</td>
              <td>Biological context for candidate proteins.</td>
            </tr>
          </tbody>
        </Table>
      </Section>

      <Section title="Method Guide">
        <p className="mb-2">
          <strong>Interolog:</strong> Transfers interactions through homology-matched proteins from known PPI sources. Best for broad discovery.
        </p>
        <p className="mb-2">
          <strong>Domain:</strong> Uses domain-domain evidence to infer interaction support. Useful when domain architecture is informative.
        </p>
        <p className="mb-2">
          <strong>Consensus:</strong> Returns interactions supported by both Interolog and Domain evidence (more conservative output).
        </p>
        <p className="mb-2">
          <strong>GO Similarity:</strong> Requires host and pathogen gene lists; computes semantic similarity between GO annotations.
        </p>
        <p className="mb-0">
          <strong>Phylo-profiling:</strong> Requires host and pathogen gene lists; infers links from profile co-occurrence across genome pools.
        </p>
      </Section>

      <Section title="Results and Annotation Tips">
        <p className="mb-2">
          Use quick filter in Results for server-side search across all pages. Use the FASTA action for host/pathogen sequence lookup and export.
        </p>
        <p className="mb-2">
          Annotation links open protein-pair context. If no bundle is found, use annotation search to inspect records by species and accession.
        </p>
        <p className="mb-0 hp-muted">
          Accession filters support version-insensitive matching (for example, both gene IDs with and without suffixes like <code>.2</code>).
        </p>
      </Section>

      <Section title="Confidence Scoring">
        <p className="mb-2">
          HPInet reports a normalized confidence score (0-1) for each interaction. The final score is a weighted combination of method strength,
          source-database quality, cross-method support, and annotation support.
        </p>
        <p className="mb-2">
          Base formula: <code>Confidence = (method x Wm) + (source x Ws) + (cross x Wx) + (annotation x Wa)</code>
        </p>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Category</th>
              <th>Wm</th>
              <th>Ws</th>
              <th>Wx</th>
              <th>Wa</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Interolog</td><td>0.55</td><td>0.28</td><td>0.12</td><td>0.05</td></tr>
            <tr><td>Domain</td><td>0.60</td><td>0.25</td><td>0.10</td><td>0.05</td></tr>
            <tr><td>Consensus</td><td>0.45</td><td>0.20</td><td>0.30</td><td>0.05</td></tr>
            <tr><td>GO Similarity</td><td>0.72</td><td>0.03</td><td>0.05</td><td>0.20</td></tr>
            <tr><td>Phylo-profiling</td><td>0.76</td><td>0.04</td><td>0.10</td><td>0.10</td></tr>
          </tbody>
        </Table>
        <p className="mb-2">
          Tier mapping: <strong>High</strong> (&gt;= 0.75), <strong>Medium</strong> (&gt;= 0.50 and &lt; 0.75), <strong>Low</strong> (&lt; 0.50).
        </p>
        <p className="mb-0 hp-muted">
          Source quality uses database-specific weights (for example HPIDB, IntAct, MINT, DIP, BioGRID, Arabihpi, 3DID, IDDI, DOMINE).
        </p>
      </Section>

      <Section title="Frequently Asked Questions (FAQ)">
        <Accordion alwaysOpen>
          <Accordion.Item eventKey="0">
            <Accordion.Header>1. Which method should I use first?</Accordion.Header>
            <Accordion.Body>
              Start with Interolog using default settings. Use Domain for complementary support. Use Consensus when you need stricter evidence overlap.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>2. Why are Domain and Interolog non-empty but Consensus empty?</Accordion.Header>
            <Accordion.Body>
              Consensus keeps only shared host-pathogen pairs found in both methods for your selected filters and database subsets. If overlap is low,
              consensus can be empty even when individual method outputs are non-empty.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>3. What is the difference between protein search and keyword search?</Accordion.Header>
            <Accordion.Body>
              Protein search directly uses submitted gene IDs. Keyword search first resolves genes from annotation text, then runs inference using that gene set.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="3">
            <Accordion.Header>4. Why does GO/Phylo ask for both host and pathogen genes?</Accordion.Header>
            <Accordion.Body>
              These methods compare host and pathogen sets directly. They require both sides to compute pairwise similarity or profile-based association.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="4">
            <Accordion.Header>5. How do I return from annotation to results?</Accordion.Header>
            <Accordion.Body>
              If opened from Results, annotation pages include a Back to Results action that returns to the same result context.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="5">
            <Accordion.Header>6. Can I export data and figures?</Accordion.Header>
            <Accordion.Body>
              Yes. Results tables support CSV export. Network page supports PNG, SVG, and PDF export.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="6">
            <Accordion.Header>7. How can I speed up annotation lookups?</Accordion.Header>
            <Accordion.Body>
              Use indexed collections on species and gene fields, and keep backend cache enabled. Repeated pair lookups are accelerated by cache.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="7">
            <Accordion.Header>8. Why does FASTA retrieval fail for some species?</Accordion.Header>
            <Accordion.Body>
              FASTA files must be discoverable under <code>PHYLO_ROOT/data</code>. Use a species-to-file map (<code>fasta-map.json</code>) when filenames do not
              follow simple species ID conventions.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="8">
            <Accordion.Header>9. How many rows should I view per page?</Accordion.Header>
            <Accordion.Body>
              For normal browsing use 100-250. Use 500-1000 only when you need bulk review and your browser remains responsive.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="9">
            <Accordion.Header>10. Which browser setup is recommended?</Accordion.Header>
            <Accordion.Body>
              Use current Chrome, Firefox, or Edge versions. Keep hardware acceleration enabled for large network views.
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Section>
    </section>
  );
}
