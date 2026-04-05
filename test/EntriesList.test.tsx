import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EntriesList from "@/components/EntriesList";
import { deleteLog, getLogs, updateLog } from "@/lib/api";
import { renderWithProviders } from "@/test/test-utils";
import { toast } from "sonner";

vi.mock("@/lib/api", () => ({
  getLogs: vi.fn(),
  deleteLog: vi.fn(),
  updateLog: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const entriesFixture = [
  {
    id: 1,
    assignmentTitle: "TDT4242 | Essay | Climate Report",
    dateOfUse: "2026-03-20",
    tool: "ChatGPT",
    purposeCategory: "Drafting",
    optionalExplanation: "Helped structure sections",
    promptQueryUsed: "Create an outline",
    outputReceived: "A 5-point outline",
    modifiedOutput: "Reordered points and added references",
    createdAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: 2,
    assignmentTitle: "TDT4242 | Lab | Sensor Analysis",
    dateOfUse: "2026-03-21",
    tool: "Claude",
    purposeCategory: "Data Analysis",
    optionalExplanation: null,
    promptQueryUsed: null,
    outputReceived: null,
    modifiedOutput: null,
    createdAt: "2026-03-21T10:00:00.000Z",
  },
];

describe("EntriesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLogs).mockResolvedValue(entriesFixture);
  });

  it("FTC-07 loads existing logs and pre-fills editable form", async () => {
    renderWithProviders(<EntriesList />);

    await screen.findByText("Climate Report");
    await userEvent.click(
      screen.getByRole("button", { name: /edit entry 1/i }),
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/course/i)).toHaveValue("TDT4242");
    expect(screen.getByLabelText(/task type/i)).toHaveValue("Essay");
    expect(screen.getByLabelText(/assignment name/i)).toHaveValue(
      "Climate Report",
    );
    expect(screen.getByLabelText(/date of use/i)).toHaveValue("2026-03-20");
  });

  it("FTC-08 updates an existing log entry", async () => {
    vi.mocked(updateLog).mockResolvedValue({
      ...entriesFixture[0],
      assignmentTitle: "TDT4242 | Essay | Updated Report",
    });

    renderWithProviders(<EntriesList />);

    await screen.findByText("Climate Report");
    await userEvent.click(
      screen.getByRole("button", { name: /edit entry 1/i }),
    );

    const assignmentInput = screen.getByLabelText(/assignment name/i);
    await userEvent.clear(assignmentInput);
    await userEvent.type(assignmentInput, "Updated Report");

    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i }),
    );

    await waitFor(() => {
      expect(updateLog).toHaveBeenCalledTimes(1);
    });

    expect(updateLog).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        assignmentTitle: "TDT4242 | Essay | Updated Report",
      }),
    );
  });

  it("FTC-09 deletes a log and removes it from UI after refetch", async () => {
    vi.mocked(getLogs)
      .mockResolvedValueOnce(entriesFixture)
      .mockResolvedValueOnce([entriesFixture[1]]);
    vi.mocked(deleteLog).mockResolvedValue();

    renderWithProviders(<EntriesList />);

    await screen.findByText("Climate Report");
    await userEvent.click(
      screen.getByRole("button", { name: /delete entry 1/i }),
    );

    await waitFor(() => {
      expect(deleteLog).toHaveBeenCalledWith(1, expect.anything());
    });

    await waitFor(() => {
      expect(screen.queryByText("Climate Report")).not.toBeInTheDocument();
      expect(screen.getByText("Sensor Analysis")).toBeInTheDocument();
    });
  });

  it("FTC-13 triggers declaration export", async () => {
    vi.mocked(getLogs).mockResolvedValue(entriesFixture);

    const originalCreateElement = document.createElement.bind(document);
    const clickSpy = vi.fn();
    const anchor = {
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, "createElement").mockImplementation(
      (tagName: string) => {
        if (tagName.toLowerCase() === "a") {
          return anchor;
        }
        return originalCreateElement(tagName);
      },
    );

    const createObjectUrlMock = vi.fn(() => "blob:download-url");
    const revokeObjectUrlMock = vi.fn(() => {});

    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: revokeObjectUrlMock,
    });

    renderWithProviders(<EntriesList />);

    await screen.findByText("Climate Report");
    await userEvent.click(
      screen.getByRole("button", { name: /download declaration/i }),
    );

    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:download-url");
  });

  it("FTC-14 shows review list with edit and delete actions", async () => {
    renderWithProviders(<EntriesList />);

    await screen.findByText("Climate Report");
    expect(
      screen.getByRole("button", { name: /edit entry 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete entry 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /edit entry 2/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete entry 2/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state when there are no entries", async () => {
    vi.mocked(getLogs).mockResolvedValue([]);

    renderWithProviders(<EntriesList />);

    expect(await screen.findByText(/no entries yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /start logging your ai usage to build your declaration/i,
      ),
    ).toBeInTheDocument();
  });

  it("disables export action when there are no entries", async () => {
    vi.mocked(getLogs).mockResolvedValue([]);

    renderWithProviders(<EntriesList />);

    const downloadButton = await screen.findByRole("button", {
      name: /download declaration/i,
    });
    expect(downloadButton).toBeDisabled();
  });

  it("updates all editable fields and sends them in update payload", async () => {
    vi.mocked(updateLog).mockResolvedValue({
      ...entriesFixture[0],
      assignmentTitle: "TDT4242 | Essay | Revised Climate Report",
      tool: "Claude",
      purposeCategory: "Research Support",
      optionalExplanation: "Added more context",
      promptQueryUsed: "new prompt",
      outputReceived: "new output",
      modifiedOutput: "new modifications",
    });

    renderWithProviders(<EntriesList />);

    await screen.findByText("Climate Report");
    await userEvent.click(
      screen.getByRole("button", { name: /edit entry 1/i }),
    );

    await userEvent.type(
      screen.getByLabelText(/optional details/i),
      " updated",
    );
    await userEvent.type(
      screen.getByLabelText(/prompt \/ query used/i),
      " plus",
    );
    await userEvent.type(screen.getByLabelText(/output received/i), " plus");
    await userEvent.type(
      screen.getByLabelText(/how you modified the output/i),
      " plus",
    );

    const toolCombo = screen.getByRole("combobox", { name: /ai tool used/i });
    await userEvent.click(toolCombo);
    await userEvent.click(
      await screen.findByRole("option", { name: "Claude", hidden: true }),
    );

    const purposeCombo = screen.getByRole("combobox", {
      name: /purpose category/i,
    });
    await userEvent.click(purposeCombo);
    await userEvent.click(
      await screen.findByRole("option", {
        name: "Research Support",
        hidden: true,
      }),
    );

    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i }),
    );

    await waitFor(() => {
      expect(updateLog).toHaveBeenCalledTimes(1);
    });

    expect(updateLog).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        tool: "Claude",
        purposeCategory: "Research Support",
        optionalExplanation: "Helped structure sections updated",
        promptQueryUsed: "Create an outline plus",
        outputReceived: "A 5-point outline plus",
        modifiedOutput: "Reordered points and added references plus",
      }),
    );
  });

  it("shows error toast when updating entry fails", async () => {
    vi.mocked(updateLog).mockRejectedValue(new Error("update failed"));

    renderWithProviders(<EntriesList />);

    await screen.findByText("Climate Report");
    await userEvent.click(
      screen.getByRole("button", { name: /edit entry 1/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i }),
    );

    await waitFor(() => {
      expect(updateLog).toHaveBeenCalledTimes(1);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to update entry.");
  });

  it("parses assignment titles with partial or no separators", async () => {
    vi.mocked(getLogs).mockResolvedValue([
      {
        ...entriesFixture[0],
        id: 11,
        assignmentTitle: "TDT4242 | Quick Reflection",
      },
      {
        ...entriesFixture[1],
        id: 12,
        assignmentTitle: "Standalone Assignment",
      },
    ]);

    renderWithProviders(<EntriesList />);

    expect(await screen.findByText("Quick Reflection")).toBeInTheDocument();
    expect(screen.getByText("Standalone Assignment")).toBeInTheDocument();
    expect(screen.getByText("TDT4242")).toBeInTheDocument();
  });
});
