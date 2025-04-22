import AddIdeaForm from "@/components/ideas/AddIdeaForm";
import IdeaList from "@/components/ideas/IdeaList";

export default function IdeasPage() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-foreground">Fikir Kutusu</h1>
      <div className="mb-8">
        <AddIdeaForm />
      </div>
      <div>
        <IdeaList />
      </div>
    </div>
  );
} 