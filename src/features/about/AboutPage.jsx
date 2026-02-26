import Table from "react-bootstrap/Table";
import { PageHeader } from "@/shared/ui/PageHeader";
import { CROP_STATS } from "@/shared/content/platform-data";

export default function AboutPage() {
  return (
    <section className="hp-fade-up">
      <PageHeader
        title="About HPInet"
        subtitle="Comprehensive host-pathogen interaction resource for cereal disease systems."
      />

      <div className="hp-card mb-4">
        <p className="mb-0">
          Cereal crops are essential for global food security, but they are threatened by a variety of biotic stresses, including
          phytopathogens. Protein-protein interactions (PPIs) play a crucial role in host-pathogen interactions, and a PPI database
          can help researchers elucidate molecular mechanisms and identify intervention targets. HPInet integrates sequence-based
          inference with functional and evolutionary evidence and provides annotations and network tools to support disease-resistance
          research.
        </p>
      </div>

      <div className="hp-card mb-4">
        <h4>Confidence Model</h4>
        <p className="mb-0">
          HPInet ranks each predicted interaction with a normalized confidence score (0-1). The score combines method-specific evidence,
          source-database reliability, cross-method agreement, and annotation support. Scores are also categorized into High, Medium,
          and Low confidence tiers to support rapid biological prioritization.
        </p>
      </div>

      <div className="hp-card">
        <div className="hp-section-head">
          <h4>Species Coverage Matrix</h4>
          <p>Reference table for crop coverage and annotation depth used in HPInet workflows.</p>
        </div>
        <Table responsive hover className="hp-species-table">
          <thead>
            <tr>
              <th>Crop Species</th>
              <th>Common Name</th>
              <th>Proteins</th>
              <th>GO Terms</th>
              <th>KEGG Pathways</th>
              <th>Transcription Factors</th>
            </tr>
          </thead>
          <tbody>
            {CROP_STATS.map((row) => (
              <tr key={row.id}>
                <td><em>{row.species}</em></td>
                <td>{row.name}</td>
                <td>{row.proteins}</td>
                <td>{row.go}</td>
                <td>{row.kegg}</td>
                <td>{row.tf}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
