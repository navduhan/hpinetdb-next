import { Link } from "react-router-dom";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import { PageHeader } from "@/shared/ui/PageHeader";
import heroImage from "@/shared/content/home-hero.png";

export default function HomePage() {
  const evidenceCards = [
    {
      title: "Interolog Transfer",
      detail: "Homology-based interaction transfer from curated host-pathogen evidence."
    },
    {
      title: "Domain Evidence",
      detail: "Domain-domain compatibility from 3DID, IDDI, and DOMINE resources."
    },
    {
      title: "GO Similarity",
      detail: "Semantic proximity of host and pathogen proteins using GO annotation structure."
    },
    {
      title: "Phylo-profiling",
      detail: "Co-occurrence patterns across reference genome pools."
    },
    {
      title: "Consensus Layer",
      detail: "Intersection support to prioritize robust candidate PPIs."
    }
  ];

  const quickTracks = [
    {
      title: "Start Discovery",
      body: "Choose host-pathogen species and pass optional advanced filters.",
      action: "/plants?id=1",
      label: "Open Species Selection"
    },
    {
      title: "Run Inference",
      body: "Select method and generate interaction candidates with threshold controls.",
      action: "/interactome",
      label: "Open Interactome"
    },
    {
      title: "Interpret Results",
      body: "Filter, annotate, and inspect interaction topology in network space.",
      action: "/help",
      label: "View Analysis Guide"
    }
  ];

  return (
    <section className="hp-fade-up hp-home-page">
      <PageHeader
        title="Cereal Host-Pathogen Interaction Database"
        subtitle="Integrated inference and annotation environment for cereal disease research, combining sequence, functional, and evolutionary evidence."
      />

      <div className="hp-home-stage hp-card mb-4">
        <Row className="g-4 align-items-center">
          <Col lg={7}>
            <p className="hp-home-kicker">Evidence-integrated interactome discovery</p>
            <h2 className="hp-home-title">Move from species pair to biological insight in one workflow</h2>
            <p className="hp-home-copy">
              HPInet unifies interolog transfer, domain evidence, GO semantic similarity, and phylo-profiling
              so cereal disease researchers can prioritize candidate host-pathogen PPIs with transparent support.
            </p>
            <div className="hp-home-cta-row">
              <Link className="hp-home-cta hp-home-cta-primary" to="/plants?id=1">Start Workflow</Link>
              <Link className="hp-home-cta" to="/datasets">Explore Datasets</Link>
              <Link className="hp-home-cta" to="/search">Search Annotations</Link>
              <Link className="hp-home-cta" to="/help">Read Help</Link>
            </div>
            <div className="hp-home-metrics">
              <div>
                <h3>10</h3>
                <p>Crop species</p>
              </div>
              <div>
                <h3>30+</h3>
                <p>Pathogen models</p>
              </div>
              <div>
                <h3>4</h3>
                <p>Inference engines</p>
              </div>
              <div>
                <h3>6</h3>
                <p>Annotation modules</p>
              </div>
            </div>
          </Col>
          <Col lg={5}>
            <div className="hp-home-visual">
              <Image src={heroImage} fluid alt="HPInet framework overview" className="hp-home-hero-image" />
            </div>
          </Col>
        </Row>
      </div>

      <div className="hp-card mb-4">
        <div className="hp-section-head">
          <h4>What You Can Do Today</h4>
          <p>Fast paths for new users and repeat users without workflow confusion.</p>
        </div>
        <div className="hp-home-track-grid">
          {quickTracks.map((track) => (
            <div className="hp-home-track" key={track.title}>
              <p>{track.title}</p>
              <h3>{track.body}</h3>
              <Link to={track.action} className="hp-inline-action">{track.label}</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="hp-card">
        <div className="hp-section-head">
          <h4>Evidence Engines Behind HPInet</h4>
          <p>Each inference layer contributes a distinct biological signal for interaction prioritization.</p>
        </div>
        <div className="hp-home-evidence-grid">
          {evidenceCards.map((item) => (
            <div className="hp-home-evidence-card" key={item.title}>
              <h5>{item.title}</h5>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
