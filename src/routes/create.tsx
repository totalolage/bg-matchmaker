import { createFileRoute } from "@tanstack/react-router";
import { CreateSessionForm } from "../components/CreateSessionForm";

export const Route = createFileRoute("/create")({
  component: Create,
});

function Create() {
  return (
    <div className="h-full bg-white flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center">Create Session</h1>
        </header>

        <main className="p-4 flex-1 overflow-y-auto">
          <CreateSessionForm />
        </main>
      </div>
  );
}
