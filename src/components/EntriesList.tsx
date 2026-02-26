import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLogs, deleteLog, updateLog } from "@/lib/api";
import { AIUsageLog, AIUsageLogInput } from "@/lib/types";
import { Calendar, FileDown, PencilLine, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";

const TITLE_SEPARATOR = " | ";

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

const parseAssignmentTitle = (value: string) => {
  const parts = value
    .split(TITLE_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 3) {
    return { course: parts[0], taskType: parts[1], assignmentTitle: parts[2] };
  }
  if (parts.length === 2) {
    return { course: parts[0], taskType: "", assignmentTitle: parts[1] };
  }
  return { course: "", taskType: "", assignmentTitle: value };
};

const buildAssignmentTitle = (
  course: string,
  taskType: string,
  assignmentTitle: string,
) =>
  [course.trim(), taskType.trim(), assignmentTitle.trim()]
    .filter(Boolean)
    .join(TITLE_SEPARATOR);

const EntriesList = () => {
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: getLogs,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AIUsageLog | null>(null);
  const [editForm, setEditForm] = useState({
    assignmentTitle: "",
    course: "",
    taskType: "",
    dateOfUse: "",
    tool: "",
    purposeCategory: "",
    optionalExplanation: "",
    promptQueryUsed: "",
    outputReceived: "",
    modifiedOutput: "",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLog,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logs"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AIUsageLogInput }) =>
      updateLog(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logs"] }),
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Entry deleted.");
    } catch (error) {
      toast.error("Failed to delete entry.");
    }
  };

  const handleDeleteAll = async () => {
    if (entries.length === 0) return;
    try {
      await Promise.all(entries.map((entry) => deleteLog(entry.id)));
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast.success("All entries deleted.");
    } catch (error) {
      toast.error("Failed to delete entries.");
    }
  };

  const openEdit = (entry: AIUsageLog) => {
    const parsed = parseAssignmentTitle(entry.assignmentTitle);
    setEditingEntry(entry);
    setEditForm({
      assignmentTitle: parsed.assignmentTitle,
      course: parsed.course,
      taskType: parsed.taskType,
      dateOfUse: entry.dateOfUse,
      tool: entry.tool,
      purposeCategory: entry.purposeCategory,
      optionalExplanation: entry.optionalExplanation ?? "",
      promptQueryUsed: entry.promptQueryUsed ?? "",
      outputReceived: entry.outputReceived ?? "",
      modifiedOutput: entry.modifiedOutput ?? "",
    });
    setEditOpen(true);
  };

  const updateEditField = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;
    if (
      !editForm.assignmentTitle ||
      !editForm.dateOfUse ||
      !editForm.tool ||
      !editForm.purposeCategory
    ) {
      toast.error("Please complete required fields before saving.");
      return;
    }
    const payload: AIUsageLogInput = {
      assignmentTitle: buildAssignmentTitle(
        editForm.course,
        editForm.taskType,
        editForm.assignmentTitle,
      ),
      dateOfUse: editForm.dateOfUse,
      tool: editForm.tool,
      purposeCategory: editForm.purposeCategory,
      optionalExplanation: editForm.optionalExplanation || null,
      promptQueryUsed: editForm.promptQueryUsed || null,
      outputReceived: editForm.outputReceived || null,
      modifiedOutput: editForm.modifiedOutput || null,
    };

    try {
      await updateMutation.mutateAsync({ id: editingEntry.id, payload });
      toast.success("Entry updated.");
      setEditOpen(false);
      setEditingEntry(null);
    } catch (error) {
      toast.error("Failed to update entry.");
    }
  };

  const generateDeclaration = () => {
    if (entries.length === 0) {
      toast.error("No entries to declare.");
      return;
    }

    const grouped = entries.reduce<Record<string, AIUsageLog[]>>((acc, e) => {
      if (!acc[e.assignmentTitle]) acc[e.assignmentTitle] = [];
      acc[e.assignmentTitle].push(e);
      return acc;
    }, {});

    let text = "AI USAGE DECLARATION\n";
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += "═".repeat(50) + "\n\n";

    Object.entries(grouped).forEach(([assignment, items]) => {
      text += `ASSIGNMENT: ${assignment}\n`;
      text += "─".repeat(40) + "\n";
      items.forEach((item, i) => {
        text += `\n${i + 1}. Date: ${item.dateOfUse}\n`;
        text += `   AI Tool: ${item.tool}\n`;
        text += `   Purpose Category: ${item.purposeCategory}\n`;
        if (item.optionalExplanation)
          text += `   Purpose Details: ${item.optionalExplanation}\n`;
        if (item.promptQueryUsed)
          text += `   Prompt: ${item.promptQueryUsed}\n`;
        if (item.outputReceived) text += `   Output: ${item.outputReceived}\n`;
        if (item.modifiedOutput)
          text += `   Modifications: ${item.modifiedOutput}\n`;
      });
      text += "\n";
    });

    text += "═".repeat(50) + "\n";
    text +=
      "I declare that the above is a complete and accurate record of my AI tool usage for the listed assignments.\n\n";
    text += "Student Signature: ________________________\n";
    text += `Date: ${new Date().toLocaleDateString()}\n`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-declaration-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Declaration downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            My Logged Entries
          </h2>
          <p className="text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}{" "}
            recorded
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={entries.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all entries?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every AI usage log. You can’t undo
                  this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll}>
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={generateDeclaration}
            variant="outline"
            disabled={entries.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Download Declaration
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Loading entries</h3>
            <p className="text-sm text-muted-foreground">
              Fetching your saved AI usage logs.
            </p>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No entries yet</h3>
            <p className="text-sm text-muted-foreground">
              Start logging your AI usage to build your declaration.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const parsed = parseAssignmentTitle(entry.assignmentTitle);
            return (
              <Card
                key={entry.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold">
                        {parsed.assignmentTitle}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {entry.dateOfUse}
                      </CardDescription>
                      {(parsed.course || parsed.taskType) && (
                        <div className="flex flex-wrap gap-2">
                          {parsed.course && (
                            <Badge variant="outline">{parsed.course}</Badge>
                          )}
                          {parsed.taskType && (
                            <Badge variant="outline">{parsed.taskType}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{entry.tool}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(entry)}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-foreground">
                      Purpose Category:{" "}
                    </span>
                    <span className="text-muted-foreground">
                      {entry.purposeCategory}
                    </span>
                  </div>
                  {entry.optionalExplanation && (
                    <div>
                      <span className="font-medium text-foreground">
                        Purpose Details:{" "}
                      </span>
                      <span className="text-muted-foreground line-clamp-2">
                        {entry.optionalExplanation}
                      </span>
                    </div>
                  )}
                  {entry.promptQueryUsed && (
                    <div>
                      <span className="font-medium text-foreground">
                        Prompt:{" "}
                      </span>
                      <span className="text-muted-foreground line-clamp-2">
                        {entry.promptQueryUsed}
                      </span>
                    </div>
                  )}
                  {entry.outputReceived && (
                    <div>
                      <span className="font-medium text-foreground">
                        Output:{" "}
                      </span>
                      <span className="text-muted-foreground line-clamp-2">
                        {entry.outputReceived}
                      </span>
                    </div>
                  )}
                  {entry.modifiedOutput && (
                    <div>
                      <span className="font-medium text-foreground">
                        Modifications:{" "}
                      </span>
                      <span className="text-muted-foreground line-clamp-2">
                        {entry.modifiedOutput}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit AI Usage Entry</DialogTitle>
            <DialogDescription>
              Review and update the details before final submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-course">Course (optional)</Label>
                <Input
                  id="edit-course"
                  value={editForm.course}
                  onChange={(e) => updateEditField("course", e.target.value)}
                  placeholder="e.g. TDT4242"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task">Task Type (optional)</Label>
                <Input
                  id="edit-task"
                  value={editForm.taskType}
                  onChange={(e) => updateEditField("taskType", e.target.value)}
                  placeholder="e.g. Essay, Lab, Project"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-assignment">Assignment Name *</Label>
                <Input
                  id="edit-assignment"
                  value={editForm.assignmentTitle}
                  onChange={(e) =>
                    updateEditField("assignmentTitle", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date of Use *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editForm.dateOfUse}
                  onChange={(e) => updateEditField("dateOfUse", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-tool">AI Tool Used *</Label>
                <Select
                  value={editForm.tool}
                  onValueChange={(value) => updateEditField("tool", value)}
                >
                  <SelectTrigger id="edit-tool">
                    <SelectValue placeholder="Select a tool" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_TOOLS.map((tool) => (
                      <SelectItem key={`edit-${tool}`} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-purpose">Purpose Category *</Label>
                <Select
                  value={editForm.purposeCategory}
                  onValueChange={(value) =>
                    updateEditField("purposeCategory", value)
                  }
                >
                  <SelectTrigger id="edit-purpose">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSE_CATEGORIES.map((category) => (
                      <SelectItem key={`edit-${category}`} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-explanation">Optional Details</Label>
              <Input
                id="edit-explanation"
                value={editForm.optionalExplanation}
                onChange={(e) =>
                  updateEditField("optionalExplanation", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prompt">Prompt / Query Used</Label>
              <Textarea
                id="edit-prompt"
                rows={3}
                value={editForm.promptQueryUsed}
                onChange={(e) =>
                  updateEditField("promptQueryUsed", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-output">Output Received</Label>
              <Textarea
                id="edit-output"
                rows={3}
                value={editForm.outputReceived}
                onChange={(e) =>
                  updateEditField("outputReceived", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-modified">How You Modified the Output</Label>
              <Textarea
                id="edit-modified"
                rows={3}
                value={editForm.modifiedOutput}
                onChange={(e) =>
                  updateEditField("modifiedOutput", e.target.value)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntriesList;
