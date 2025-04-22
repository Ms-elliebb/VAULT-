import AddAppForm from "@/components/apps-manager/AddAppForm";
import AppList from "@/components/apps-manager/AppList";

export default function AppsManagerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-center">Elza Apps Manager</h1>
      <div className="max-w-4xl mx-auto">
        <AddAppForm />
        <AppList />
      </div>
    </div>
  );
} 