import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveEntry } from "@/lib/storage";
import { AIUsageEntry } from "@/lib/types";
import { toast } from "sonner";
import { Save } from "lucide-react";

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

const UsageLogForm = () => {
  const [form, setForm] = useState({
    aiTool: "",
    assignmentName: "",
    date: new Date().toISOString().slice(0, 10),
    purpose: "",
    promptUsed: "",
    outputReceived: "",
    howModified: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.aiTool || !form.assignmentName || !form.purpose) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const entry: AIUsageEntry = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
    };
    saveEntry(entry);
    toast.success("AI usage logged successfully!");
    setForm({
      aiTool: "",
      assignmentName: "",
      date: new Date().toISOString().slice(0, 10),
      purpose: "",
      promptUsed: "",
      outputReceived: "",
      howModified: "",
    });
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
              <Label htmlFor="assignmentName">Assignment Name *</Label>
              <Input
                id="assignmentName"
                placeholder="e.g. Essay on Climate Change"
                value={form.assignmentName}
                onChange={(e) => update("assignmentName", e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date of Use *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiTool">AI Tool Used *</Label>
              <Select value={form.aiTool} onValueChange={(v) => update("aiTool", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tool" />
                </SelectTrigger>
                <SelectContent>
                  {AI_TOOLS.map((tool) => (
                    <SelectItem key={tool} value={tool}>
                      {tool}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Use *</Label>
              <Input
                id="purpose"
                placeholder="e.g. Brainstorming ideas, grammar check"
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                maxLength={300}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promptUsed">Prompt / Query Used</Label>
            <Textarea
              id="promptUsed"
              placeholder="Paste or describe the prompt you gave the AI tool..."
              value={form.promptUsed}
              onChange={(e) => update("promptUsed", e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outputReceived">Output Received</Label>
            <Textarea
              id="outputReceived"
              placeholder="Summarise or paste the AI's response..."
              value={form.outputReceived}
              onChange={(e) => update("outputReceived", e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="howModified">How You Modified the Output</Label>
            <Textarea
              id="howModified"
              placeholder="Describe how you adapted, verified, or built upon the AI output..."
              value={form.howModified}
              onChange={(e) => update("howModified", e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          <Button type="submit" size="lg" className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UsageLogForm;
