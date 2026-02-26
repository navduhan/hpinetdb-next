export function downloadCsv(data, category) {
  if (!Array.isArray(data) || data.length === 0) {
    return;
  }

  const fieldsByCategory = {
    interolog: [
      "Host_Protein",
      "Pathogen_Protein",
      "ProteinA",
      "ProteinB",
      "intdb_x",
      "Method",
      "Type",
      "Confidence",
      "PMID"
    ],
    consensus: [
      "Host_Protein",
      "Pathogen_Protein",
      "ProteinA",
      "ProteinB",
      "intdb_x",
      "Method",
      "Type",
      "Confidence",
      "PMID"
    ],
    domain: [
      "Host_Protein",
      "Pathogen_Protein",
      "ProteinA",
      "ProteinB",
      "intdb",
      "DomainA_name",
      "DomainA_interpro",
      "DomainB_name",
      "DomainB_interpro",
      "Score"
    ],
    go: ["Host_Protein", "Pathogen_Protein", "Host_GO", "Pathogen_GO", "Score"],
    gosim: ["Host_Protein", "Pathogen_Protein", "Host_GO", "Pathogen_GO", "Score"],
    phylo: ["Host_Protein", "Pathogen_Protein", "Score", "Host_Pattern", "Pathogen_Pattern"]
  };

  const keys = fieldsByCategory[category] || Object.keys(data[0]);
  const lines = [
    keys.join(","),
    ...data.map((row) =>
      keys
        .map((key) => {
          const value = row[key] ?? "";
          const text = String(value).replaceAll('"', '""');
          return text.includes(",") ? `"${text}"` : text;
        })
        .join(",")
    )
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `hpinet-${category}-results.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
