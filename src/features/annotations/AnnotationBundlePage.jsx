import { useState } from "react";
import { Alert, Button, Table } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { hpinetApi } from "@/shared/api/hpinetApi";
import { useQueryResource } from "@/shared/hooks/useQueryResource";
import { LoadingState } from "@/shared/ui/LoadingState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { PageHeader } from "@/shared/ui/PageHeader";

function SectionTable({ title, columns, rows }) {
  return (
    <div className="mb-3">
      <h5>{title}</h5>
      {rows.length ? (
        <Table responsive hover>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${title}-${idx}`}>
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key] || "-"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="hp-muted">No records found.</p>
      )}
    </div>
  );
}

export default function AnnotationBundlePage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("host");

  const host = searchParams.get("host") || "";
  const pathogen = searchParams.get("pathogen") || "";
  const hid = searchParams.get("hid") || "";
  const pid = searchParams.get("pid") || "";
  const from = searchParams.get("from") || "";
  const sourceCategory = searchParams.get("category") || "";
  const returnTo = searchParams.get("returnTo") || "";
  const backLink = returnTo || "/results";

  const query = useQueryResource({
    key: ["annotation-bundle", host, pathogen, hid, pid],
    enabled: Boolean(host && pathogen && hid && pid),
    staleTime: 30_000,
    queryFn: ({ signal }) => hpinetApi.getAnnotationBundle({ host, pathogen, hid, pid, signal })
  });

  const data = query.data;
  const isHost = mode === "host";
  const totalAnnotationRows = data
    ? [
        data.hgo,
        data.pgo,
        data.hkegg,
        data.pkegg,
        data.hlocal,
        data.plocal,
        data.htf,
        data.peff,
        data.hint,
        data.pint
      ].reduce((sum, rows) => sum + rows.length, 0)
    : 0;
  const hasBundleData = totalAnnotationRows > 0;

  return (
    <section className="hp-fade-up">
      <PageHeader title="Protein Annotation Details" subtitle={`Host protein: ${hid} | Pathogen protein: ${pid}`} />

      <div className="hp-card mb-3">
        <div className="d-flex gap-2 flex-wrap">
          <Button variant={isHost ? "primary" : "outline-primary"} className={isHost ? "hp-btn-primary" : ""} onClick={() => setMode("host")}>
            Host annotations
          </Button>
          <Button variant={!isHost ? "primary" : "outline-primary"} className={!isHost ? "hp-btn-primary" : ""} onClick={() => setMode("pathogen")}>
            Pathogen annotations
          </Button>
          {from === "results" ? (
            <Link to={backLink} className="hp-annot-row-link">
              Back to Results
            </Link>
          ) : null}
        </div>
      </div>

      {query.isLoading ? <LoadingState label="Loading annotation bundle" /> : null}
      {query.error ? <ErrorState message={query.error.message} /> : null}
      {!query.isLoading && !query.error && data && !hasBundleData ? (
        <Alert variant="light" className="hp-card mb-3">
          <div className="d-flex flex-column gap-1">
            <strong>No annotation bundle was found for this protein pair.</strong>
            <span className="hp-muted">
              Host protein: {hid} | Pathogen protein: {pid}
            </span>
            {from === "results" ? (
              <span className="hp-muted">
                This pair came from {sourceCategory ? `${sourceCategory.toUpperCase()} ` : ""}results and may not have mapped annotation records yet.
              </span>
            ) : null}
            <div className="d-flex gap-2 mt-1">
              <Link to="/search" className="hp-annot-row-link">Open Annotation Search</Link>
              <Link to={backLink} className="hp-annot-row-link">
                Back to Results
              </Link>
            </div>
          </div>
        </Alert>
      ) : null}

      {!query.isLoading && !query.error && data && hasBundleData ? (
        <div className="hp-card">
          <SectionTable
            title="Gene Ontology"
            columns={[
              { key: "gene", header: "Protein" },
              { key: "term", header: "GO ID" },
              { key: "description", header: "GO term" },
              { key: "definition", header: "Definition" }
            ]}
            rows={isHost ? data.hgo : data.pgo}
          />

          <SectionTable
            title="KEGG Pathways"
            columns={[
              { key: "gene", header: "Protein" },
              { key: "pathway", header: "Pathway" },
              { key: "description", header: "Description" }
            ]}
            rows={isHost ? data.hkegg : data.pkegg}
          />

          <SectionTable
            title="Subcellular Localization"
            columns={[
              { key: "gene", header: "Protein" },
              { key: "location", header: "Location" }
            ]}
            rows={isHost ? data.hlocal : data.plocal}
          />

          {isHost ? (
            <SectionTable
              title="Transcription Factors"
              columns={[
                { key: "gene", header: "Protein" },
                { key: "tf_family", header: "TF family" }
              ]}
              rows={data.htf}
            />
          ) : (
            <SectionTable
              title="Virulence / Effector"
              columns={[
                { key: "gene", header: "Protein" },
                { key: "type", header: "Type" }
              ]}
              rows={data.peff}
            />
          )}

          <SectionTable
            title="InterPro Domains"
            columns={[
              { key: "gene", header: "Protein" },
              { key: "length", header: "Length" },
              { key: "interpro_id", header: "InterPro" },
              { key: "sourcedb", header: "Source DB" },
              { key: "domain", header: "Domain" },
              { key: "domain_description", header: "Description" },
              { key: "score", header: "Score" }
            ]}
            rows={isHost ? data.hint : data.pint}
          />
        </div>
      ) : null}
    </section>
  );
}
