import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEntries, deleteEntry } from "@/lib/storage";
import { AIUsageEntry } from "@/lib/types";
import { Trash2, FileDown, Calendar, Wrench } from "lucide-react";
import { toast } from "sonner";

const EntriesList = () => {
  const [entries, setEntries] = useState<AIUsageEntry[]>([]);

  const refresh = () => setEntries(getEntries().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    refresh();
    toast.success("Entry deleted.");
  };

  const generateDeclaration = () => {
    if (entries.length === 0) {
      toast.error("No entries to declare.");
      return;
    }

    const grouped = entries.reduce<Record<string, AIUsageEntry[]>>((acc, e) => {
      if (!acc[e.assignmentName]) acc[e.assignmentName] = [];
      acc[e.assignmentName].push(e);
      return acc;
    }, {});

    let text = "AI USAGE DECLARATION\n";
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += "═".repeat(50) + "\n\n";

    Object.entries(grouped).forEach(([assignment, items]) => {
      text += `ASSIGNMENT: ${assignment}\n`;
      text += "─".repeat(40) + "\n";
      items.forEach((item, i) => {
        text += `\n${i + 1}. Date: ${item.date}\n`;
        text += `   AI Tool: ${item.aiTool}\n`;
        text += `   Purpose: ${item.purpose}\n`;
        if (item.promptUsed) text += `   Prompt: ${item.promptUsed}\n`;
        if (item.outputReceived) text += `   Output: ${item.outputReceived}\n`;
        if (item.howModified) text += `   Modifications: ${item.howModified}\n`;
      });
      text += "\n";
    });

    text += "═".repeat(50) + "\n";
    text += "I declare that the above is a complete and accurate record of my AI tool usage for the listed assignments.\n\n";
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
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Logged Entries
          </h2>
          <p className="text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} recorded
          </p>
        </div>
        <Button onClick={generateDeclaration} variant="outline" disabled={entries.length === 0}>
          <FileDown className="mr-2 h-4 w-4" />
          Download Declaration
        </Button>
      </div>

      {entries.length === 0 ? (
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
          {entries.map((entry) => (
            <Card key={entry.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                      {entry.assignmentName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {entry.date}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{entry.aiTool}</Badge>
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
                  <span className="font-medium text-foreground">Purpose: </span>
                  <span className="text-muted-foreground">{entry.purpose}</span>
                </div>
                {entry.promptUsed && (
                  <div>
                    <span className="font-medium text-foreground">Prompt: </span>
                    <span className="text-muted-foreground line-clamp-2">{entry.promptUsed}</span>
                  </div>
                )}
                {entry.howModified && (
                  <div>
                    <span className="font-medium text-foreground">Modifications: </span>
                    <span className="text-muted-foreground line-clamp-2">{entry.howModified}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntriesList;
