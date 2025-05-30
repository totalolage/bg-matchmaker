import { createFileRoute } from "@tanstack/react-router";
import { CreateSessionForm } from "../components/CreateSessionForm";
import { PageLayout, PageHeader, PageContent } from "../components/PageLayout";

export const Route = createFileRoute("/create")({
  component: Create,
});

function Create() {
  return (
    <PageLayout>
      <PageHeader>
        <h1 className="text-2xl font-bold text-gray-900 text-center">Create Session</h1>
      </PageHeader>

      <PageContent>
        <CreateSessionForm />
      </PageContent>
    </PageLayout>
  );
}