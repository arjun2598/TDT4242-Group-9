import Header from "@/components/Header";
import EntriesList from "@/components/EntriesList";

const Entries = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <EntriesList />
      </main>
    </div>
  );
};

export default Entries;
