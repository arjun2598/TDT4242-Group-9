import { describe, it, expect } from "vitest";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "@/test/test-utils";
import { NavLink } from "@/components/NavLink";

describe("NavLink compatibility wrapper", () => {
  it("applies activeClassName when the link route is active", () => {
    const { getByRole } = renderWithProviders(
      <Routes>
        <Route
          path="/current"
          element={
            <NavLink
              to="/current"
              className="base-link"
              activeClassName="active-link"
            >
              Current
            </NavLink>
          }
        />
      </Routes>,
      { route: "/current" },
    );

    const link = getByRole("link", { name: "Current" });
    expect(link.className).toContain("base-link");
    expect(link.className).toContain("active-link");
  });

  it("does not apply activeClassName when route is not active", () => {
    const { getByRole } = renderWithProviders(
      <Routes>
        <Route
          path="/other"
          element={
            <NavLink
              to="/current"
              className="base-link"
              activeClassName="active-link"
            >
              Current
            </NavLink>
          }
        />
      </Routes>,
      { route: "/other" },
    );

    const link = getByRole("link", { name: "Current" });
    expect(link.className).toContain("base-link");
    expect(link.className).not.toContain("active-link");
  });
});
