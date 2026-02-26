import { useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/ui/PageHeader";
import { data as labels } from "@/shared/content/display-data";
import plants from "@/shared/content/plants.json";
import { pathogen as pathogenMap } from "@/shared/content/pathogen";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const host = searchParams.get("host") || "Wheat";
  const pathogen = searchParams.get("pathogen") || "tindica";
  const hostOptions = plants.map((item) => ({
    value: item.name,
    label: `${item.sname} (${item.name})`
  }));
  const pathogenOptions = Object.entries(pathogenMap)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const [speciesClass, setSpeciesClass] = useState("host");
  const [speciesChoice, setSpeciesChoice] = useState(host);
  const [annotation, setAnnotation] = useState("go");
  const [keyword, setKeyword] = useState("");
  const [accession, setAccession] = useState("");
  const [minLen, setMinLen] = useState("");
  const [maxLen, setMaxLen] = useState("");

  const annotationOptions = speciesClass === "host"
    ? [
        { value: "go", label: "Gene Ontology" },
        { value: "kegg", label: "KEGG" },
        { value: "local", label: "Localization" },
        { value: "tf", label: "Transcription Factors" },
        { value: "interpro", label: "InterPro" }
      ]
    : [
        { value: "go", label: "Gene Ontology" },
        { value: "kegg", label: "KEGG" },
        { value: "local", label: "Localization" },
        { value: "interpro", label: "InterPro" },
        { value: "virulence", label: "Virulence / Effector" }
      ];

  function submit() {
    const params = new URLSearchParams();

    if (annotation === "virulence") {
      params.set("id", "effector_and_secretory");
      params.set("species", speciesChoice);
    } else {
      params.set("id", speciesChoice);
      params.set("class", speciesClass);
    }

    if (keyword) params.set("keyword", keyword);
    if (accession) params.set("accession", accession);
    if (minLen) params.set("minLen", minLen);
    if (maxLen) params.set("maxLen", maxLen);

    navigate(`/${annotation}?${params.toString()}`);
  }

  return (
    <section className="hp-fade-up">
      <PageHeader title="Advanced Search" subtitle="Filter annotation resources by species, protein accession, keyword, and optional protein length bounds." />

      <div className="hp-card">
        <Row className="g-3">
          <Col md={4}>
            <Form.Label>Species class</Form.Label>
            <Form.Select
              value={speciesClass}
              onChange={(e) => {
                const nextClass = e.target.value;
                setSpeciesClass(nextClass);
                const nextSpecies = nextClass === "host" ? hostOptions[0]?.value || host : pathogenOptions[0]?.value || pathogen;
                setSpeciesChoice(nextSpecies);
                if (annotation === "virulence" && nextClass === "host") {
                  setAnnotation("go");
                }
              }}
            >
              <option value="host">Host</option>
              <option value="pathogen">Pathogen</option>
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Label>Species</Form.Label>
            <Form.Select value={speciesChoice} onChange={(e) => setSpeciesChoice(e.target.value)}>
              {(speciesClass === "host" ? hostOptions : pathogenOptions).map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label || labels[item.value] || item.value}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={8}>
            <Form.Label>Annotation module</Form.Label>
            <Form.Select value={annotation} onChange={(e) => setAnnotation(e.target.value)}>
              {annotationOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={6}>
            <Form.Label>Keyword</Form.Label>
            <Form.Control
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., kinase, defense response, WRKY"
            />
          </Col>
          <Col md={6}>
            <Form.Label>Protein accession</Form.Label>
            <Form.Control
              value={accession}
              onChange={(e) => setAccession(e.target.value)}
              placeholder="e.g., TraesCS1A02G000100, XP_123456"
            />
          </Col>

          <Col md={3}>
            <Form.Label>Minimum length</Form.Label>
            <Form.Control type="number" value={minLen} onChange={(e) => setMinLen(e.target.value)} placeholder="e.g., 100" />
          </Col>
          <Col md={3}>
            <Form.Label>Maximum length</Form.Label>
            <Form.Control type="number" value={maxLen} onChange={(e) => setMaxLen(e.target.value)} placeholder="e.g., 1200" />
          </Col>

          <Col md={12}>
            <Button className="hp-btn-primary" onClick={submit}>Run advanced search</Button>
          </Col>
        </Row>
      </div>
    </section>
  );
}
