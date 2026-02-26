import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/features/layout/SiteHeader";
import { SiteFooter } from "@/features/layout/SiteFooter";

export function MainLayout() {
  return (
    <div className="hp-app-shell">
      <SiteHeader />
      <main>
        <Container fluid="xl" className="hp-main-container">
          <Outlet />
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
