import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLog } from "@/lib/api";
import { AIUsageLogInput } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";

const AI_TOOLS = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Copilot",
  "Midjourney",
  "DALL-E",
  "Grammarly AI",
  "Other",
];

const PURPOSE_CATEGORIES = [
  "Brainstorming",
  "Drafting",
  "Editing & Proofreading",
  "Summarisation",
  "Translation",
  "Coding Assistance",
  "Debugging",
  "Research Support",
  "Study/Tutoring",
  "Data Analysis",
  "Other",
];

const TITLE_SEPARATOR = " | ";

type ToolEntry = {
  tool: string;
  promptQueryUsed: string;
  outputReceived: string;
  modifiedOutput: string;
};

const buildAssignmentTitle = (
  course: string,
  taskType: string,
  assignmentTitle: string,
) =>
  [course.trim(), taskType.trim(), assignmentTitle.trim()]
    .filter(Boolean)
    .join(TITLE_SEPARATOR);

const UsageLogForm = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    assignmentTitle: "",
    course: "",
    taskType: "",
    dateOfUse: new Date().toISOString().slice(0, 10),
    purposeCategory: "",
    optionalExplanation: "",
    toolEntries: [
      {
        tool: "",
        promptQueryUsed: "",
        outputReceived: "",
        modifiedOutput: "",
      },
    ] as ToolEntry[],
  });

  const mutation = useMutation({
    mutationFn: async (payloads: AIUsageLogInput[]) =>
      Promise.all(payloads.map((p) => createLog(p))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateToolEntry = (
    index: number,
    field: keyof ToolEntry,
    value: string,
  ) => {
    setForm((prev) => {
      const updated = [...prev.toolEntries];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, toolEntries: updated };
    });
  };

  const addToolEntry = () => {
    setForm((prev) => ({
      ...prev,
      toolEntries: [
        ...prev.toolEntries,
        {
          tool: "",
          promptQueryUsed: "",
          outputReceived: "",
          modifiedOutput: "",
        },
      ],
    }));
  };

  const removeToolEntry = (index: number) => {
    setForm((prev) => ({
      ...prev,
      toolEntries: prev.toolEntries.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assignmentTitle || !form.dateOfUse || !form.purposeCategory) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.toolEntries.some((entry) => !entry.tool)) {
      toast.error("Please select an AI tool for each entry.");
      return;
    }

    const assignmentTitle = buildAssignmentTitle(
      form.course,
      form.taskType,
      form.assignmentTitle,
    );
    const payloads: AIUsageLogInput[] = form.toolEntries.map((entry) => ({
      assignmentTitle,
      dateOfUse: form.dateOfUse,
      tool: entry.tool,
      purposeCategory: form.purposeCategory,
      optionalExplanation: form.optionalExplanation || null,
      promptQueryUsed: entry.promptQueryUsed || null,
      outputReceived: entry.outputReceived || null,
      modifiedOutput: entry.modifiedOutput || null,
    }));

    try {
      await mutation.mutateAsync(payloads);
      toast.success("AI usage logged successfully!");
      setForm({
        assignmentTitle: "",
        course: "",
        taskType: "",
        dateOfUse: new Date().toISOString().slice(0, 10),
        purposeCategory: "",
        optionalExplanation: "",
        toolEntries: [
          {
            tool: "",
            promptQueryUsed: "",
            outputReceived: "",
            modifiedOutput: "",
          },
        ],
      });
    } catch (error) {
      toast.error("Failed to save AI usage. Please try again.");
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Log AI Usage</CardTitle>
        <CardDescription>
          Record each instance where you used an AI tool for your assignment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course">Course (optional)</Label>
              <Input
                id="course"
                placeholder="e.g. TDT4242"
                value={form.course}
                onChange={(e) => updateField("course", e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type (optional)</Label>
              <Input
                id="taskType"
                placeholder="e.g. Essay, Lab, Project"
                value={form.taskType}
                onChange={(e) => updateField("taskType", e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignmentTitle">Assignment Name *</Label>
              <Input
                id="assignmentTitle"
                placeholder="e.g. Essay on Climate Change"
                value={form.assignmentTitle}
                onChange={(e) => updateField("assignmentTitle", e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfUse">Date of Use *</Label>
              <Input
                id="dateOfUse"
                type="date"
                value={form.dateOfUse}
                onChange={(e) => updateField("dateOfUse", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purposeCategory">Purpose Category *</Label>
              <Select
                value={form.purposeCategory}
                onValueChange={(v) => updateField("purposeCategory", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionalExplanation">Optional Details</Label>
              <Input
                id="optionalExplanation"
                placeholder="Add context or clarify the purpose..."
                value={form.optionalExplanation}
                onChange={(e) =>
                  updateField("optionalExplanation", e.target.value)
                }
                maxLength={300}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">AI Tools Used</h3>
                <p className="text-sm text-muted-foreground">
                  Add each tool you used for this assignment.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addToolEntry}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tool
              </Button>
            </div>

            {form.toolEntries.map((entry, index) => (
              <div
                key={`tool-entry-${index}`}
                className="rounded-lg border border-border/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-2">
                    <Label htmlFor={`tool-${index}`}>AI Tool Used *</Label>
                    <Select
                      value={entry.tool}
                      onValueChange={(value) =>
                        updateToolEntry(index, "tool", value)
                      }
                    >
                      <SelectTrigger
                        id={`tool-${index}`}
                        className="w-full min-w-[220px]"
                      >
                        <SelectValue placeholder="Select a tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_TOOLS.map((tool) => (
                          <SelectItem key={`${tool}-${index}`} value={tool}>
                            {tool}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.toolEntries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeToolEntry(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`prompt-${index}`}>
                      Prompt / Query Used
                    </Label>
                    <Textarea
                      id={`prompt-${index}`}
                      placeholder="Paste or describe the prompt you gave the AI tool..."
                      value={entry.promptQueryUsed}
                      onChange={(e) =>
                        updateToolEntry(
                          index,
                          "promptQueryUsed",
                          e.target.value,
                        )
                      }
                      rows={3}
                      maxLength={2000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`output-${index}`}>Output Received</Label>
                    <Textarea
                      id={`output-${index}`}
                      placeholder="Summarise or paste the AI's response..."
                      value={entry.outputReceived}
                      onChange={(e) =>
                        updateToolEntry(index, "outputReceived", e.target.value)
                      }
                      rows={3}
                      maxLength={2000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`modified-${index}`}>
                      How You Modified the Output
                    </Label>
                    <Textarea
                      id={`modified-${index}`}
                      placeholder="Describe how you adapted, verified, or built upon the AI output..."
                      value={entry.modifiedOutput}
                      onChange={(e) =>
                        updateToolEntry(index, "modifiedOutput", e.target.value)
                      }
                      rows={3}
                      maxLength={2000}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={mutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Saving..." : "Save Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UsageLogForm;
