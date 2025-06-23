import { createFileRoute } from "@tanstack/react-router";

import { CreateSessionForm } from "../../components/CreateSessionForm";
import {
  PageContent,
  PageHeader,
  PageLayout,
} from "../../components/PageLayout";

export const Route = createFileRoute("/sessions/create")({
  component: Create,
});

function Create() {
  return (
    <PageLayout>
      <PageHeader>
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Create Session
        </h1>
      </PageHeader>

      <PageContent>
        <CreateSessionForm />
      </PageContent>
    </PageLayout>
  );
}
