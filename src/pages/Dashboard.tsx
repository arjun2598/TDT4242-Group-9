import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays, format, parseISO } from "date-fns";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getLogs } from "@/lib/api";

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

const Dashboard = () => {
  const { data: entries = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: getLogs,
  });
  const [filters, setFilters] = useState({
    course: "",
    taskType: "",
    tool: "all",
    purposeCategory: "all",
    timeRange: "30d",
    fromDate: "",
    toDate: "",
  });

  const updateFilter = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredEntries = useMemo(() => {
    let data = [...entries];

    if (filters.course.trim()) {
      const needle = filters.course.toLowerCase();
      data = data.filter((entry) => {
        const { course } = parseAssignmentTitle(entry.assignmentTitle);
        return (
          course.toLowerCase().includes(needle) ||
          entry.assignmentTitle.toLowerCase().includes(needle)
        );
      });
    }

    if (filters.taskType.trim()) {
      const needle = filters.taskType.toLowerCase();
      data = data.filter((entry) => {
        const { taskType } = parseAssignmentTitle(entry.assignmentTitle);
        return (
          taskType.toLowerCase().includes(needle) ||
          entry.assignmentTitle.toLowerCase().includes(needle)
        );
      });
    }

    if (filters.tool !== "all") {
      data = data.filter((entry) => entry.tool === filters.tool);
    }

    if (filters.purposeCategory !== "all") {
      data = data.filter(
        (entry) => entry.purposeCategory === filters.purposeCategory,
      );
    }

    const now = new Date();
    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (filters.timeRange === "7d") {
      fromDate = subDays(now, 7);
      toDate = now;
    } else if (filters.timeRange === "30d") {
      fromDate = subDays(now, 30);
      toDate = now;
    } else if (filters.timeRange === "90d") {
      fromDate = subDays(now, 90);
      toDate = now;
    } else if (filters.timeRange === "custom") {
      fromDate = filters.fromDate ? parseISO(filters.fromDate) : null;
      toDate = filters.toDate ? parseISO(filters.toDate) : null;
    }

    if (fromDate || toDate) {
      data = data.filter((entry) => {
        const entryDate = parseISO(entry.dateOfUse);
        if (fromDate && entryDate < fromDate) return false;
        if (toDate && entryDate > toDate) return false;
        return true;
      });
    }

    return data;
  }, [entries, filters]);

  const summary = useMemo(() => {
    const total = filteredEntries.length;
    const uniqueTools = new Set(filteredEntries.map((entry) => entry.tool));
    const uniqueAssignments = new Set(
      filteredEntries.map((entry) => entry.assignmentTitle),
    );

    const categoryCounts = filteredEntries.reduce<Record<string, number>>(
      (acc, entry) => {
        acc[entry.purposeCategory] = (acc[entry.purposeCategory] || 0) + 1;
        return acc;
      },
      {},
    );

    const topCategory =
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    return {
      total,
      uniqueTools: uniqueTools.size,
      uniqueAssignments: uniqueAssignments.size,
      topCategory,
    };
  }, [filteredEntries]);

  const chartData = useMemo(() => {
    const counts = new Map<
      string,
      { label: string; date: Date; count: number }
    >();
    filteredEntries.forEach((entry) => {
      const date = parseISO(entry.dateOfUse);
      const label = format(date, "MMM yyyy");
      const existing = counts.get(label);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(label, { label, date, count: 1 });
      }
    });

    return Array.from(counts.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((item) => ({ period: item.label, count: item.count }));
  }, [filteredEntries]);

  const topTools = useMemo(() => {
    const toolCounts = filteredEntries.reduce<Record<string, number>>(
      (acc, entry) => {
        acc[entry.tool] = (acc[entry.tool] || 0) + 1;
        return acc;
      },
      {},
    );

    return Object.entries(toolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tool, count]) => ({ tool, count }));
  }, [filteredEntries]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Usage Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor AI usage over time and filter by course, task type, and
              period.
            </p>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="filter-course">Course</Label>
                <Input
                  id="filter-course"
                  placeholder="e.g. TDT4242"
                  value={filters.course}
                  onChange={(e) => updateFilter("course", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-task">Task Type</Label>
                <Input
                  id="filter-task"
                  placeholder="e.g. Essay"
                  value={filters.taskType}
                  onChange={(e) => updateFilter("taskType", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-tool">AI Tool</Label>
                <Select
                  value={filters.tool}
                  onValueChange={(value) => updateFilter("tool", value)}
                >
                  <SelectTrigger id="filter-tool">
                    <SelectValue placeholder="All tools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tools</SelectItem>
                    {AI_TOOLS.map((tool) => (
                      <SelectItem key={`filter-${tool}`} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-category">Purpose Category</Label>
                <Select
                  value={filters.purposeCategory}
                  onValueChange={(value) =>
                    updateFilter("purposeCategory", value)
                  }
                >
                  <SelectTrigger id="filter-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {PURPOSE_CATEGORIES.map((category) => (
                      <SelectItem key={`filter-${category}`} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-range">Time Period</Label>
                <Select
                  value={filters.timeRange}
                  onValueChange={(value) => updateFilter("timeRange", value)}
                >
                  <SelectTrigger id="filter-range">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filters.timeRange === "custom" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="filter-from">From</Label>
                    <Input
                      id="filter-from"
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => updateFilter("fromDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="filter-to">To</Label>
                    <Input
                      id="filter-to"
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => updateFilter("toDate", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unique Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">
                  {summary.uniqueTools}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assignments Logged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">
                  {summary.uniqueAssignments}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Purpose
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {summary.topCategory}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                    No data for the selected filters.
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      usage: {
                        label: "Usage logs",
                        color: "hsl(var(--primary))",
                      },
                    }}
                  >
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="count"
                        fill="var(--color-usage)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topTools.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No tool usage yet.
                  </div>
                ) : (
                  topTools.map((item) => (
                    <div
                      key={item.tool}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.tool}</Badge>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
