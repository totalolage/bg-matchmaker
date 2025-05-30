import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useForm } from "react-hook-form";
import { type } from "arktype";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { toast } from "sonner";

// Define the form schema using Arktype
const sessionFormSchema = type({
  sessionName: "string > 0"
});

type SessionFormData = typeof sessionFormSchema.infer;

export function CreateSessionForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SessionFormData>({
    resolver: arktypeResolver(sessionFormSchema),
    defaultValues: {
      sessionName: ""
    }
  });

  const onSubmit = async (data: SessionFormData) => {
    try {
      // TODO: Implement session creation when backend is ready
      console.log("Creating session:", data);
      toast.success("Session creation will be implemented soon!");
      reset();
    } catch (err) {
      toast.error("Failed to create session");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Create Session</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="sessionName" className="block text-sm font-medium mb-1">
            Session Name
          </Label>
          <Input 
            id="sessionName"
            type="text" 
            placeholder="Enter session name" 
            {...register("sessionName")}
            aria-invalid={errors.sessionName ? "true" : "false"}
          />
          {errors.sessionName && (
            <p className="text-sm text-red-600 mt-1">Session name is required</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </form>
    </div>
  );
}