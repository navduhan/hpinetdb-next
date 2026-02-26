import { hpinetApi } from "@/shared/api/hpinetApi";

export const annotationConfig = {
  go: {
    title: "Gene Ontology",
    fetcher: hpinetApi.getGo,
    columns: [
      { key: "gene", header: "Protein" },
      { key: "term", header: "GO ID" },
      { key: "description", header: "GO Term" },
      { key: "definition", header: "Definition" },
      { key: "evidence", header: "Evidence" },
      { key: "ontology", header: "Ontology" }
    ]
  },
  kegg: {
    title: "KEGG Pathways",
    fetcher: hpinetApi.getKegg,
    columns: [
      { key: "gene", header: "Protein" },
      { key: "pathway", header: "KEGG ID" },
      { key: "description", header: "Pathway" }
    ]
  },
  interpro: {
    title: "InterPro Domains",
    fetcher: hpinetApi.getInterpro,
    columns: [
      { key: "gene", header: "Protein" },
      { key: "length", header: "Length" },
      { key: "interpro_id", header: "InterPro" },
      { key: "sourcedb", header: "Source DB" },
      { key: "domain", header: "Domain" },
      { key: "domain_description", header: "Description" },
      { key: "score", header: "Score" }
    ]
  },
  local: {
    title: "Subcellular Localization",
    fetcher: hpinetApi.getLocal,
    columns: [
      { key: "gene", header: "Protein" },
      { key: "location", header: "Localization" }
    ]
  },
  tf: {
    title: "Transcription Factors",
    fetcher: hpinetApi.getTf,
    columns: [
      { key: "gene", header: "Protein" },
      { key: "tf_family", header: "TF Family" }
    ]
  },
  virulence: {
    title: "Virulence / Effector Proteins",
    fetcher: hpinetApi.getVirulence,
    columns: [
      { key: "gene", header: "Protein" },
      { key: "type", header: "Type" }
    ]
  }
};
