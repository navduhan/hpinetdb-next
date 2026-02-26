import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SearchPage from "@/features/search/SearchPage";

describe("SearchPage", () => {
  it("navigates to annotation route", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/search?host=Wheat&pathogen=tindica"]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/go" element={<div>GO ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /run advanced search/i }));
    expect(screen.getByText("GO ROUTE")).toBeInTheDocument();
  });
});
