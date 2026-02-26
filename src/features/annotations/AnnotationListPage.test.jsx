import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AnnotationListPage from "@/features/annotations/AnnotationListPage";

vi.mock("@/shared/hooks/useQueryResource", () => ({
  useQueryResource: () => ({
    data: {
      data: [
        {
          gene: "TraesCS1A02G007500",
          term: "GO:0003677",
          description: "DNA binding",
          definition: "Interacting selectively and non-covalently with DNA.",
          evidence: "IEA",
          ontology: "MF"
        }
      ],
      total: 1
    },
    isLoading: false,
    error: null
  })
}));

describe("AnnotationListPage", () => {
  it("shows host/pathogen and species selectors when params are missing", () => {
    render(
      <MemoryRouter initialEntries={["/go"]}>
        <Routes>
          <Route path="/go" element={<AnnotationListPage type="go" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/data class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/species/i)).toBeInTheDocument();
    expect(screen.queryByText(/missing required query parameter/i)).not.toBeInTheDocument();
    expect(screen.getByText(/dna binding/i)).toBeInTheDocument();
  });
});
