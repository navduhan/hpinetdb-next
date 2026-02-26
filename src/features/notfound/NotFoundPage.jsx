import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/ui/PageHeader";

export default function NotFoundPage() {
  return (
    <section className="hp-fade-up">
      <PageHeader title="Page not found" subtitle="The requested route is not available." />
      <div className="hp-card">
        <p className="mb-2">Use the main navigation to continue browsing HPInet.</p>
        <Link to="/">Return to Home</Link>
      </div>
    </section>
  );
}
