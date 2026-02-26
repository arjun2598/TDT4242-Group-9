export interface AIUsageLog {
  id: number;
  assignmentTitle: string;
  dateOfUse: string;
  tool: string;
  purposeCategory: string;
  optionalExplanation?: string | null;
  promptQueryUsed?: string | null;
  outputReceived?: string | null;
  modifiedOutput?: string | null;
  createdAt: string;
}

export type AIUsageLogInput = Omit<AIUsageLog, "id" | "createdAt">;
