import { useMemo, useState } from "react";
import { Form, Table } from "react-bootstrap";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EXTERNAL_DATA_SOURCES } from "@/shared/content/platform-data";

const HOST_DATASETS = [
  ["Triticum aestivum", "Ensembl Plants", "http://ftp.ensemblgenomes.org/pub/plants/release-57/fasta/triticum_aestivum/pep/"],
  ["Zea mays", "Ensembl Plants", "http://ftp.ensemblgenomes.org/pub/plants/release-57/fasta/zea_mays/pep/"],
  ["Oryza sativa japonica", "Ensembl Plants", "http://ftp.ensemblgenomes.org/pub/plants/release-57/fasta/oryza_sativa/pep/"],
  ["Hordeum vulgare", "Ensembl Plants", "http://ftp.ensemblgenomes.org/pub/plants/release-57/fasta/hordeum_vulgare/pep/"],
  ["Chenopodium quinoa", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/001/683/475/GCF_001683475.1_ASM168347v1/GCF_001683475.1_ASM168347v1_protein.faa.gz"],
  ["Sorghum bicolor", "Ensembl Plants", "http://ftp.ensemblgenomes.org/pub/plants/release-57/fasta/sorghum_bicolor/pep/"],
  ["Avena sativa", "Ensembl Plants", "http://ftp.ensemblgenomes.org/pub/plants/release-57/fasta/avena_sativa/pep/"],
  ["Setaria italica", "Ensembl Plants", "http://ftp.ensemblgenomes.org/pub/plants/release-57/fasta/setaria_italica/pep/"],
  ["Secale cereale", "Ensembl Plants", "http://ftp.ensemblgenomes.org/pub/plants/release-57/fasta/secale_cerale/pep/"],
  ["Eleusine coracana", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCA/021/604/985/GCA_021604985.1_Ragi_PR202_v._2.0/GCA_021604985.1_Ragi_PR202_v._2.0_protein.faa.gz"]
];

const FUNGI_DATASETS = [
  ["Puccinia triticina", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/puccinia_triticina/pep"],
  ["Puccinia graminis", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-57/fasta/puccinia_graminisug99/pep/"],
  ["Puccinia striiformis", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/puccinia_striiformis/pep/"],
  ["Blumeria graminis sp. tritici", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fungi_ascomycota4_collection/blumeria_graminis_f_sp_tritici_gca_900519115/pep/"],
  ["Tilletia indica", "Ensembl Fungi", "http://ftp.ebi.ac.uk/ensemblgenomes/pub/release-52/fungi/fasta/fungi_basidiomycota1_collection/tilletia_indica_gca_001645015/pep/"],
  ["Ustilago maydis", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/ustilago_maydis/pep/"],
  ["Bipolaris maydis c5", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-57/fasta/fungi_ascomycota1_collection/bipolaris_maydis_c5_gca_000338975/pep/"],
  ["Puccinia sorghi", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fungi_basidiomycota1_collection/puccinia_sorghi_gca_001263375/pep/"],
  ["Cercospora zeae-maydis", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fungi_ascomycota5_collection/cercospora_zeae_maydis_scoh1_5_gca_010093985/pep/"],
  ["Pyrenophora teres", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/pyrenophora_teres/pep/"],
  ["Fusarium graminearum", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fusarium_graminearum/pep/"],
  ["Blumeria graminis sp. hordei", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fungi_ascomycota4_collection/blumeria_graminis_f_sp_hordei_gca_900237765/pep/"],
  ["Magnaporthe oryzae", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/magnaporthe_oryzae/pep/"],
  ["Bipolaris oryzae", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fungi_ascomycota1_collection/bipolaris_oryzae_atcc_44560_gca_000523455/pep/"],
  ["Rhizoctonia solani", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-57/fasta/fungi_basidiomycota1_collection/rhizoctonia_solani_ag_1_ia_gca_000334115/pep/"],
  ["Blumeria graminis", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/blumeria_graminis/pep/"],
  ["Colletotrichum graminicola", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/colletotrichum_graminicola/pep/"],
  ["Macrophomina phaseolina", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fungi_ascomycota1_collection/macrophomina_phaseolina_ms6_gca_000302655/pep/"],
  ["Puccinia coronata var. avenae", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fungi_basidiomycota1_collection/puccinia_coronata_var_avenae_f_sp_avenae_gca_002873275/pep/"],
  ["Fusarium poae", "Ensembl Fungi", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/fungi/release-56/fasta/fungi_ascomycota3_collection/fusarium_poae_gca_001675295/pep/"]
];

const BACTERIA_DATASETS = [
  ["Acidovorax avenae subsp. avenae", "Ensembl Bacteria", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-56/fasta/bacteria_6_collection/acidovorax_avenae_subsp_avenae_atcc_19860_gca_000176855/pep/"],
  ["Pseudomonas coronafaciens", "Ensembl Bacteria", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-56/fasta/bacteria_54_collection/pseudomonas_coronafaciens_pv_coronafaciens_gca_003699955/pep/"],
  ["Pseudomonas syringae", "Ensembl Bacteria", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-56/fasta/bacteria_77_collection/pseudomonas_syringae_gca_900103765/pep/"],
  ["Burkholderia glumae", "Ensembl Bacteria", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-56/fasta/bacteria_119_collection/burkholderia_glumae_bgr1_gca_000022645/pep/"],
  ["Xanthomonas oryzae pv. oryzae", "Ensembl Bacteria", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-56/fasta/bacteria_123_collection/xanthomonas_oryzae_pv_oryzae_kacc_10331_gca_000007385/pep/"],
  ["Pseudomonas syringae pv. atrofaciens", "Ensembl Bacteria", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-57/fasta/bacteria_3_collection/pseudomonas_syringae_pv_atrofaciens_gca_001400125/pep/"],
  ["Xanthomonas vasicola pv. vasculorum", "Ensembl Bacteria", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-56/fasta/bacteria_36_collection/xanthomonas_vasicola_pv_vasculorum_gca_003116655/pep/"],
  ["Pseudomonas syringae pv. syringae", "Ensembl Bacteria", "https://ftp.ensemblgenomes.ebi.ac.uk/pub/bacteria/release-56/fasta/bacteria_90_collection/pseudomonas_syringae_pv_syringae_b728a_gca_000012245/pep/"]
];

const VIRUS_DATASETS = [
  ["Wheat yellow mosaic virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/862/385/GCF_000862385.1_ViralMultiSegProj15358/"],
  ["Wheat streak mosaic virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/862/365/GCF_000862365.1_ViralProj15354/"],
  ["Maize dwarf mosaic virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/863/225/GCF_000863225.1_ViralProj15355/"],
  ["Maize chlorotic mottle virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/856/925/GCF_000856925.1_ViralProj15117/"],
  ["Sugarcane mosaic virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/854/025/GCF_000854025.1_ViralProj14994/"],
  ["Barley stripe mosaic virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/855/725/GCF_000855725.1_ViralMultiSegProj15031/"],
  ["Rice yellow mottle virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/863/085/GCF_000863085.1_ViralProj15327/"],
  ["Rice tungro spherical virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/860/625/GCF_000860625.1_ViralProj15332/"],
  ["Rice tungro bacilliform virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/849/605/GCF_000849605.1_ViralProj14579/"],
  ["Rice dwarf virus", "NCBI", "https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/850/725/GCF_000850725.1_ViralMultiSegProj14797/"]
];

function DatasetTable({ title, rows }) {
  return (
    <div className="hp-card mb-3">
      <div className="hp-section-head">
        <h4>{title}</h4>
        <p>{rows.length.toLocaleString()} entries</p>
      </div>
      <Table responsive hover>
        <thead>
          <tr>
            <th>Species</th>
            <th>Source</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${title}-${row[0]}`}>
              <td><em>{row[0]}</em></td>
              <td>{row[1]}</td>
              <td>
                <a href={row[2]} target="_blank" rel="noreferrer">
                  Open dataset
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function filterRows(rows, query) {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(q)));
}

export default function DatasetsPage() {
  const [query, setQuery] = useState("");

  const hostRows = useMemo(() => filterRows(HOST_DATASETS, query), [query]);
  const fungiRows = useMemo(() => filterRows(FUNGI_DATASETS, query), [query]);
  const bacteriaRows = useMemo(() => filterRows(BACTERIA_DATASETS, query), [query]);
  const virusRows = useMemo(() => filterRows(VIRUS_DATASETS, query), [query]);

  return (
    <section className="hp-fade-up">
      <PageHeader
        title="Genomic Information of the Datasets"
        subtitle="Searchable source catalog for host and pathogen proteomes used in HPInet."
      />

      <div className="hp-card mb-3">
        <div className="hp-section-head">
          <h4>External Data Sources</h4>
          <p>Primary interaction and annotation resources integrated into HPInet pipelines.</p>
        </div>
        <div className="hp-source-grid">
          {EXTERNAL_DATA_SOURCES.map((item) => (
            <a key={item.name} href={item.link} target="_blank" rel="noreferrer" className="hp-source-tile text-decoration-none">
              <img src={item.logo} alt={item.name} />
              <span>{item.name}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="hp-card mb-3">
        <Form.Label htmlFor="dataset-filter">Filter all dataset tables</Form.Label>
        <Form.Control
          id="dataset-filter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by species, source, or URL"
        />
      </div>

      <DatasetTable title="Host Species" rows={hostRows} />
      <DatasetTable title="Fungal Pathogen Species" rows={fungiRows} />
      <DatasetTable title="Bacterial Pathogen Species" rows={bacteriaRows} />
      <DatasetTable title="Viral Species" rows={virusRows} />
    </section>
  );
}
