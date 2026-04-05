import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Dashboard from "@/pages/Dashboard";
import { getLogs } from "@/lib/api";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/lib/api", () => ({
  getLogs: vi.fn(),
}));

const dashboardEntries = [
  {
    id: 1,
    assignmentTitle: "TDT4242 | Essay | Climate Report",
    dateOfUse: "2026-03-20",
    tool: "ChatGPT",
    purposeCategory: "Drafting",
    optionalExplanation: null,
    promptQueryUsed: null,
    outputReceived: null,
    modifiedOutput: null,
    createdAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: 2,
    assignmentTitle: "TDT4300 | Lab | Sensor Analysis",
    dateOfUse: "2026-03-21",
    tool: "Claude",
    purposeCategory: "Data Analysis",
    optionalExplanation: null,
    promptQueryUsed: null,
    outputReceived: null,
    modifiedOutput: null,
    createdAt: "2026-03-21T10:00:00.000Z",
  },
  {
    id: 3,
    assignmentTitle: "TDT4242 | Essay | Old Draft",
    dateOfUse: "2025-01-10",
    tool: "ChatGPT",
    purposeCategory: "Drafting",
    optionalExplanation: null,
    promptQueryUsed: null,
    outputReceived: null,
    modifiedOutput: null,
    createdAt: "2025-01-10T10:00:00.000Z",
  },
];

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const selectFilterValue = async (label: RegExp, optionName: string) => {
    const trigger = screen.getByRole("combobox", { name: label });
    await userEvent.click(trigger);
    const option = await screen.findByRole("option", {
      name: new RegExp(`^${optionName}$`, "i"),
      hidden: true,
    });
    await userEvent.click(option);
  };

  it("FTC-10 renders dashboard components", async () => {
    vi.mocked(getLogs).mockResolvedValue(dashboardEntries);

    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    expect(
      await screen.findByRole("heading", { name: /usage dashboard/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^usage over time$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^top tools$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/total logs/i)).toBeInTheDocument();
  });

  it("FTC-11 applies course/task/tool filters correctly", async () => {
    vi.mocked(getLogs).mockResolvedValue(dashboardEntries);

    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    await screen.findByText(/usage dashboard/i);

    await userEvent.type(screen.getByLabelText(/course/i), "TDT4242");
    await userEvent.type(screen.getByLabelText(/task type/i), "Essay");
    await selectFilterValue(/ai tool/i, "ChatGPT");

    await waitFor(() => {
      const totalLogsHeading = screen.getByRole("heading", {
        name: /total logs/i,
      });
      const totalLogsValue =
        totalLogsHeading.parentElement?.nextElementSibling?.textContent ?? "";
      expect(totalLogsValue.trim()).toBe("1");
      expect(screen.queryByText("Claude")).not.toBeInTheDocument();
    });
  });

  it("FTC-11 applies time period filter correctly", async () => {
    vi.mocked(getLogs).mockResolvedValue(dashboardEntries);

    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    await screen.findByText(/usage dashboard/i);

    await selectFilterValue(/time period/i, "All time");

    await waitFor(() => {
      const totalLogsHeading = screen.getByRole("heading", {
        name: /total logs/i,
      });
      const totalLogsValue =
        totalLogsHeading.parentElement?.nextElementSibling?.textContent ?? "";
      expect(totalLogsValue.trim()).toBe("3");
      expect(screen.getByText("Claude")).toBeInTheDocument();
    });
  });

  it("FTC-12 shows empty state when no dashboard data", async () => {
    vi.mocked(getLogs).mockResolvedValue([]);

    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    await screen.findByText(/usage dashboard/i);
    expect(
      await screen.findByText(/no data for the selected filters/i),
    ).toBeInTheDocument();
  });

  it("FNFR-04 remains responsive during rapid filter changes", async () => {
    vi.mocked(getLogs).mockResolvedValue(dashboardEntries);

    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    await screen.findByText(/usage dashboard/i);
    const courseInput = screen.getByLabelText(/course/i);

    fireEvent.change(courseInput, { target: { value: "TDT4242" } });
    fireEvent.change(courseInput, { target: { value: "TDT4300" } });
    fireEvent.change(courseInput, { target: { value: "TDT4242" } });

    await waitFor(() => {
      expect(courseInput).toHaveValue("TDT4242");
      expect(screen.queryByText("Claude")).not.toBeInTheDocument();
    });
  });

  it("FNFR-03 renders dashboard within acceptable time budget", async () => {
    vi.mocked(getLogs).mockResolvedValue(dashboardEntries);

    const start = performance.now();
    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    await screen.findByRole("heading", { name: /usage dashboard/i });
    const durationMs = performance.now() - start;

    expect(durationMs).toBeLessThan(2000);
  });

  it("handles custom date range and assignment title formats with fewer separators", async () => {
    vi.mocked(getLogs).mockResolvedValue([
      {
        ...dashboardEntries[0],
        assignmentTitle: "TDT4242 | Reflection",
        dateOfUse: "2026-03-20",
      },
      {
        ...dashboardEntries[1],
        assignmentTitle: "Standalone Assignment",
        dateOfUse: "2026-02-01",
      },
    ]);

    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    await screen.findByText(/usage dashboard/i);

    await userEvent.type(screen.getByLabelText(/course/i), "TDT4242");

    await selectFilterValue(/time period/i, "Custom range");
    await userEvent.clear(screen.getByLabelText(/^from$/i));
    await userEvent.type(screen.getByLabelText(/^from$/i), "2026-03-01");
    await userEvent.clear(screen.getByLabelText(/^to$/i));
    await userEvent.type(screen.getByLabelText(/^to$/i), "2026-03-31");

    await waitFor(() => {
      const totalLogsHeading = screen.getByRole("heading", {
        name: /total logs/i,
      });
      const totalLogsValue =
        totalLogsHeading.parentElement?.nextElementSibling?.textContent ?? "";
      expect(totalLogsValue.trim()).toBe("1");
    });
  });
});
