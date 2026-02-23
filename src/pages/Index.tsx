import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PenLine, FileText, ShieldCheck, BookOpen } from "lucide-react";
import Header from "@/components/Header";

const features = [
  {
    icon: PenLine,
    title: "Log Each Use",
    description: "Record the AI tool, your prompt, the output, and how you adapted it for your work.",
  },
  {
    icon: FileText,
    title: "Generate Declarations",
    description: "Export a complete declaration of your AI usage, ready to attach to your assignment.",
  },
  {
    icon: ShieldCheck,
    title: "Stay Compliant",
    description: "Demonstrate transparency and academic integrity by keeping an honest record.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative mx-auto px-4 py-20 text-center sm:py-28">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Declare Your AI Usage with Confidence
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Log every AI interaction, generate transparent declarations, and ensure your assignments meet academic integrity policies.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/log">
                <PenLine className="mr-2 h-4 w-4" />
                Start Logging
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/entries">
                <FileText className="mr-2 h-4 w-4" />
                View Entries
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border bg-card shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
                  <feature.icon className="h-5 w-5 text-secondary-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
