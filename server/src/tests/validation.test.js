import { describe, it, expect } from "vitest";
const { LogCreateSchema } = require("../validation");

describe("LogCreateSchema", () => {
  const validPayload = {
    assignmentTitle: "TDT4242 Exercise 3",
    dateOfUse: "2026-03-30",
    tool: "ChatGPT",
    purposeCategory: "Study/Tutoring",
    optionalExplanation: "Used for clarification",
    promptQueryUsed: "Explain branch coverage",
    outputReceived: "Coverage explanation",
    modifiedOutput: "Edited summary",
  };

  it("accepts a valid payload", () => {
    const result = LogCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects missing assignmentTitle", () => {
    const { assignmentTitle, ...rest } = validPayload;
    const result = LogCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing tool", () => {
    const { tool, ...rest } = validPayload;
    const result = LogCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing purposeCategory", () => {
    const { purposeCategory, ...rest } = validPayload;
    const result = LogCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts omitted optional fields", () => {
    const minimalPayload = {
      assignmentTitle: "TDT4242 Exercise 3",
      dateOfUse: "2026-03-30",
      tool: "ChatGPT",
      purposeCategory: "Study/Tutoring",
    };

    const result = LogCreateSchema.safeParse(minimalPayload);
    expect(result.success).toBe(true);
  });
});