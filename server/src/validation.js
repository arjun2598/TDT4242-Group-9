const { z } = require("zod");

const LogCreateSchema = z.object({
  assignmentTitle: z.string().min(1),
  dateOfUse: z.string().min(1),
  tool: z.string().min(1),
  purposeCategory: z.string().min(1),
  optionalExplanation: z.string().optional().nullable(),
  promptQueryUsed: z.string().optional().nullable(),
  outputReceived: z.string().optional().nullable(),
  modifiedOutput: z.string().optional().nullable(),
});

module.exports = { LogCreateSchema };