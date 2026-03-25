import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsageLogForm from "@/components/UsageLogForm";
import { createLog } from "@/lib/api";
import { renderWithProviders } from "@/test/test-utils";
import { toast } from "sonner";

vi.mock("@/lib/api", () => ({
  createLog: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("UsageLogForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const openComboboxByName = async (name: RegExp | string) => {
    const combo = screen.getByRole("combobox", { name });
    await userEvent.click(combo);
  };

  const chooseOption = async (optionText: string) => {
    const listbox = await screen.findByRole("listbox", { hidden: true });
    const option = within(listbox).getByRole("option", {
      name: optionText,
      hidden: true,
    });
    await userEvent.click(option);
  };

  const fillRequiredFields = async () => {
    await userEvent.type(
      screen.getByLabelText(/assignment name/i),
      "Project report",
    );

    await openComboboxByName(/purpose category/i);
    await chooseOption("Drafting");

    await openComboboxByName(/ai tool used/i);
    await chooseOption("ChatGPT");
  };

  it("FTC-01 renders logging form fields", () => {
    renderWithProviders(<UsageLogForm />);

    expect(screen.getByLabelText(/assignment name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of use/i)).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /purpose category/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /ai tool used/i }),
    ).toBeInTheDocument();
  });

  it("FTC-02 updates controlled inputs", async () => {
    renderWithProviders(<UsageLogForm />);

    const assignmentInput = screen.getByLabelText(/assignment name/i);
    const detailsInput = screen.getByLabelText(/optional details/i);

    await userEvent.type(assignmentInput, "Essay 1");
    await userEvent.type(detailsInput, "Used to refine argument flow.");

    expect(assignmentInput).toHaveValue("Essay 1");
    expect(detailsInput).toHaveValue("Used to refine argument flow.");
  });

  it("FTC-03 blocks submission when required fields are missing", async () => {
    renderWithProviders(<UsageLogForm />);

    await userEvent.click(screen.getByRole("button", { name: /save entry/i }));

    expect(toast.error).toHaveBeenCalledWith(
      "Please fill in all required fields.",
    );
    expect(createLog).not.toHaveBeenCalled();
  });

  it("FTC-04 updates state when category is selected", async () => {
    renderWithProviders(<UsageLogForm />);

    await openComboboxByName(/purpose category/i);
    await chooseOption("Research Support");

    expect(
      screen.getByRole("combobox", { name: /purpose category/i }),
    ).toHaveTextContent("Research Support");
  });

  it("FTC-05 stores optional free text", async () => {
    renderWithProviders(<UsageLogForm />);

    const detailsInput = screen.getByLabelText(/optional details/i);
    await userEvent.type(detailsInput, "This is optional context");

    expect(detailsInput).toHaveValue("This is optional context");
  });

  it("FTC-06 submits valid form and calls handler with expected payload", async () => {
    vi.mocked(createLog).mockResolvedValue({
      id: 1,
      assignmentTitle: "TDT4242 | Essay | Project report",
      dateOfUse: "2026-03-20",
      tool: "ChatGPT",
      purposeCategory: "Drafting",
      optionalExplanation: "Clarified section structure",
      promptQueryUsed: null,
      outputReceived: null,
      modifiedOutput: null,
      createdAt: "2026-03-20T12:00:00.000Z",
    });

    renderWithProviders(<UsageLogForm />);

    await userEvent.type(screen.getByLabelText(/course/i), "TDT4242");
    await userEvent.type(screen.getByLabelText(/task type/i), "Essay");
    await userEvent.type(
      screen.getByLabelText(/assignment name/i),
      "Project report",
    );
    await userEvent.clear(screen.getByLabelText(/date of use/i));
    await userEvent.type(screen.getByLabelText(/date of use/i), "2026-03-20");
    await userEvent.type(
      screen.getByLabelText(/optional details/i),
      "Clarified section structure",
    );

    await openComboboxByName(/purpose category/i);
    await chooseOption("Drafting");

    await openComboboxByName(/ai tool used/i);
    await chooseOption("ChatGPT");

    await userEvent.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(createLog).toHaveBeenCalledTimes(1);
    });

    expect(createLog).toHaveBeenCalledWith({
      assignmentTitle: "TDT4242 | Essay | Project report",
      dateOfUse: "2026-03-20",
      tool: "ChatGPT",
      purposeCategory: "Drafting",
      optionalExplanation: "Clarified section structure",
      promptQueryUsed: null,
      outputReceived: null,
      modifiedOutput: null,
    });
  });

  it("FNFR-05 treats script-like input as plain text", async () => {
    vi.mocked(createLog).mockResolvedValue({
      id: 2,
      assignmentTitle: "Assignment",
      dateOfUse: "2026-03-20",
      tool: "ChatGPT",
      purposeCategory: "Drafting",
      optionalExplanation: "<script>alert('xss')</script>",
      promptQueryUsed: null,
      outputReceived: null,
      modifiedOutput: null,
      createdAt: "2026-03-20T12:00:00.000Z",
    });

    renderWithProviders(<UsageLogForm />);

    await userEvent.type(
      screen.getByLabelText(/assignment name/i),
      "Assignment",
    );
    await userEvent.type(
      screen.getByLabelText(/optional details/i),
      "<script>alert('xss')</script>",
    );

    await openComboboxByName(/purpose category/i);
    await chooseOption("Drafting");

    await openComboboxByName(/ai tool used/i);
    await chooseOption("ChatGPT");

    await userEvent.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(createLog).toHaveBeenCalledTimes(1);
    });

    expect(document.querySelector("script")).not.toBeInTheDocument();
    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        optionalExplanation: "<script>alert('xss')</script>",
      }),
    );
  });

  it("FNFR-06/FNFR-07 sends only required data model fields", async () => {
    vi.mocked(createLog).mockResolvedValue({
      id: 3,
      assignmentTitle: "Assignment",
      dateOfUse: "2026-03-20",
      tool: "ChatGPT",
      purposeCategory: "Drafting",
      optionalExplanation: null,
      promptQueryUsed: null,
      outputReceived: null,
      modifiedOutput: null,
      createdAt: "2026-03-20T12:00:00.000Z",
    });

    renderWithProviders(<UsageLogForm />);

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /save entry/i }));

    await waitFor(() => {
      expect(createLog).toHaveBeenCalledTimes(1);
    });

    const payload = vi.mocked(createLog).mock.calls[0][0];
    expect(Object.keys(payload).sort()).toEqual([
      "assignmentTitle",
      "dateOfUse",
      "modifiedOutput",
      "optionalExplanation",
      "outputReceived",
      "promptQueryUsed",
      "purposeCategory",
      "tool",
    ]);
    expect(payload.optionalExplanation).toBeNull();
    expect(payload.promptQueryUsed).toBeNull();
    expect(payload.outputReceived).toBeNull();
    expect(payload.modifiedOutput).toBeNull();
    expect((payload as { id?: number }).id).toBeUndefined();
    expect((payload as { createdAt?: string }).createdAt).toBeUndefined();
  });

  it("FNFR-08 supports keyboard tab navigation across main fields", async () => {
    renderWithProviders(<UsageLogForm />);

    await userEvent.tab();
    expect(screen.getByLabelText(/course/i)).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByLabelText(/task type/i)).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByLabelText(/assignment name/i)).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByLabelText(/date of use/i)).toHaveFocus();
  });
});
