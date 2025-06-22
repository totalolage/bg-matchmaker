import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "arktype";
import { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

// Define the form schema using Arktype
const sessionFormSchema = type({
  sessionName: "string > 0",
});

type SessionFormData = typeof sessionFormSchema.infer;

export const CreateSessionForm = () => {
  const form = useForm<SessionFormData>({
    resolver: arktypeResolver(sessionFormSchema),
    defaultValues: {
      sessionName: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data: SessionFormData) => {
    try {
      // TODO: Implement session creation when backend is ready
      console.log("Creating session:", data);
      toast.success("Session creation will be implemented soon!");
      form.reset();
    } catch {
      toast.error("Failed to create session");
    }
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Create Session</h2>
      <Form {...form}>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <FormField
            control={form.control}
            name="sessionName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Session Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter session name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export type CreateSessionFormProps = ComponentProps<typeof CreateSessionForm>;