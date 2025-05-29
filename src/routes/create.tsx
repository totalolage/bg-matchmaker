import { createFileRoute } from "@tanstack/react-router";
import { Navigation } from "../components/Navigation";
import { CreateSessionForm } from "../components/CreateSessionForm";

export const Route = createFileRoute("/create")({
  component: Create,
});

function Create() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center">Create Session</h1>
        </header>

        <main className="p-4 pb-20">
          <CreateSessionForm />
        </main>

        <Navigation />
      </div>
    </div>
  );
}
