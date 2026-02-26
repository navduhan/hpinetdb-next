import { useMemo } from "react";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import plants from "@/shared/content/plants.json";
import labLogo from "@/shared/content/lab_logo_red.png";
import usulogo from "@/shared/content/usulogo2.png";
import hpinetWordmark from "@/shared/content/hpinet_wordmark.svg";


export function SiteHeader() {
  const { pathname } = useLocation();

  const speciesItems = useMemo(
    () => plants.map((plant) => ({ id: plant.id, scientific: plant.sname, common: plant.name })),
    []
  );

  const isRouteActive = (route) => pathname === route;
  const isGroupActive = (routes) => routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <header className="hp-site-header">
      <Container fluid="xl">
        <Navbar expand="lg" className="hp-navbar hp-navbar-shell">
          <div className="hp-navbar-brand-wrap">
            <Link to="/" className="hp-navbar-brand" aria-label="HPInet Home">
              <img src={hpinetWordmark} alt="HPInet" className="hp-wordmark" />
            </Link>
          </div>
          <Navbar.Toggle aria-controls="hp-main-nav" />
          <Navbar.Collapse id="hp-main-nav">
            <Nav className="hp-nav-links hp-nav-primary mx-auto">
              <Nav.Link as={Link} to="/" active={pathname === "/"}>
                Home
              </Nav.Link>
              <NavDropdown title="Species" id="hp-species-dropdown" active={isGroupActive(["/plants"])}>
                {speciesItems.map((item) => (
                  <NavDropdown.Item as={Link} to={`/plants?id=${item.id}`} key={item.id}>
                    <em>{item.scientific}</em> ({item.common})
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
              <Nav.Link as={Link} to="/search" active={isRouteActive("/search")}>
                Annotation Search
              </Nav.Link>
              <Nav.Link as={Link} to="/datasets" active={isRouteActive("/datasets")}>
                Datasets
              </Nav.Link>
              <Nav.Link as={Link} to="/about" active={isRouteActive("/about")}>
                About
              </Nav.Link>
              <Nav.Link as={Link} to="/help" active={isRouteActive("/help")}>
                Help
              </Nav.Link>
            </Nav>
            <div className="hp-affiliation-logos">
              <img src={labLogo} alt="Kaundal Lab" className="hp-logo hp-logo-lab" />
              <img src={usulogo} alt="Utah State University" className="hp-logo hp-logo-usu" />
            </div>
          </Navbar.Collapse>
          <div className="hp-affiliation-logos hp-affiliation-logos-mobile">
            <img src={labLogo} alt="Kaundal Lab" className="hp-logo hp-logo-lab" />
            <img src={usulogo} alt="Utah State University" className="hp-logo hp-logo-usu" />
          </div>
        </Navbar>
      </Container>
    </header>
  );
}
