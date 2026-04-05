import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import Header from "@/components/Header";
import { renderWithProviders } from "@/test/test-utils";

const mockGetLogs = vi.fn();

vi.mock("@/lib/api", () => ({
  getLogs: () => mockGetLogs(),
  createLog: vi.fn(),
  deleteLog: vi.fn(),
}));

describe("App routes and page rendering", () => {
  beforeEach(() => {
    mockGetLogs.mockReset();
    mockGetLogs.mockResolvedValue([
      {
        id: 1,
        assignmentTitle: "TDT4242 | Essay | Reflection",
        tool: "ChatGPT",
        purposeCategory: "Drafting",
        promptText: "help me structure",
        generatedOutput: "outline",
        adaptationNotes: "rewrote with own words",
        dateOfUse: "2025-04-01",
      },
    ]);
  });

  const renderAt = (path: string) => {
    window.history.pushState({}, "", path);
    render(<App />);
  };

  it("renders the home route", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", {
        name: /Declare Your AI Usage with Confidence/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders log and entries routes", async () => {
    renderAt("/log");
    expect(
      screen.getByRole("heading", { name: /Log AI Usage/i }),
    ).toBeInTheDocument();

    renderAt("/entries");
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /My Logged Entries/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders dashboard route", async () => {
    renderAt("/dashboard");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Usage Dashboard/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders not found route and logs missing path", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderAt("/does-not-exist");

    expect(screen.getByText(/Oops! Page not found/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        "404 Error: User attempted to access non-existent route:",
        "/does-not-exist",
      );
    });

    spy.mockRestore();
  });
});

describe("Header navigation", () => {
  it("marks the current route as active", () => {
    const { container } = renderWithProviders(<Header />, {
      route: "/dashboard",
    });

    const activeLink = screen.getByRole("link", { name: /Dashboard/i });
    expect(activeLink).toBeInTheDocument();
    expect(activeLink.className).toContain("bg-primary");

    const homeLink = screen.getByRole("link", { name: /Home/i });
    expect(homeLink.className).toContain("text-muted-foreground");

    expect(container.querySelectorAll("nav a").length).toBe(4);
  });
});
