import Header from "@/components/Header";
import UsageLogForm from "@/components/UsageLogForm";

const LogUsage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <UsageLogForm />
      </main>
    </div>
  );
};

export default LogUsage;
