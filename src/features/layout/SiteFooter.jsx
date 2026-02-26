import { Container } from "react-bootstrap";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="hp-site-footer">
      <Container fluid="xl">
        <div className="hp-footer-grid">
          <div>
            <h6>HPInet</h6>
            <p className="mb-0">
              Cereal host-pathogen interaction platform integrating interolog, domain, GO, and phylo evidence.
            </p>
          </div>
          <div>
            <h6>Institution</h6>
            <div className="hp-footer-links">
              <a href="http://bioinfo.usu.edu" target="_blank" rel="noreferrer">Kaundal AI & Bioinformatics Lab</a>
              <a href="https://usu.edu" target="_blank" rel="noreferrer">Utah State University</a>
              <a href="https://qanr.usu.edu" target="_blank" rel="noreferrer">The S.J. & Jessie E. Quinney College of Agriculture & Natural Resources</a>
            </div>
          </div>
        </div>
        <p className="hp-footer-copy mb-0">&copy; {year} HPInet</p>
      </Container>
    </footer>
  );
}
