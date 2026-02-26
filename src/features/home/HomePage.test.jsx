import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HomePage from "@/features/home/HomePage";

describe("HomePage", () => {
  it("renders hero and workflow sections", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Cereal Host-Pathogen Interaction Database/i)).toBeInTheDocument();
    expect(screen.getByText(/Start the Workflow/i)).toBeInTheDocument();
    expect(screen.getByText(/Coverage Matrix/i)).toBeInTheDocument();
  });
});
