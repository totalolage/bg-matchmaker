import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useMutation } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { type } from "arktype";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PageContent, PageHeader, PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@convex/_generated/api";
import { useMutation as useConvexMutation } from "convex/react";

const profileFormSchema = type({
  displayName: "string",
});

type ProfileFormData = typeof profileFormSchema.infer;

export const Route = createFileRoute("/profile_/edit")({
  component: EditProfile,
});

function EditProfile() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const router = useRouter();
  const updateDisplayName = useMutation({
    mutationFn: useConvexMutation(api.users.updateDisplayName),
  });

  const form = useForm<ProfileFormData>({
    resolver: arktypeResolver(profileFormSchema),
    defaultValues: {
      displayName: user.displayName || "",
    },
  });

  const handleSave = form.handleSubmit(async ({ displayName }) => {
    if (updateDisplayName.isPending) return false;
    if (
      displayName.trim() === user.displayName ||
      (!displayName.trim() && user.name === user.displayName)
    )
      return false;

    await updateDisplayName.mutateAsync({ displayName });

    toast.success("Profile updated");
    return true; // Successfully saved
  });

  useEffect(
    () =>
      router.subscribe("onBeforeNavigate", () => {
        void handleSave();
      }),
    [handleSave, router],
  );

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center">
          <Button
            onClick={() => void navigate({ to: "/profile" })}
            variant="ghost"
            size="icon"
            className="-ml-2"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 ml-3">Edit Profile</h1>
        </div>
      </PageHeader>

      <PageContent>
        <Form {...form}>
          <div className="max-w-md mx-auto space-y-6">
            {/* Profile Picture */}
            <div className="text-center">
              <UserAvatar size="xl" className="mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Profile picture from Discord
              </p>
            </div>

            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onBlur={() => {
                        field.onBlur();
                        void handleSave();
                      }}
                      placeholder={user.name}
                    />
                  </FormControl>
                  <FormDescription>Your username: @{user.name}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discord Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Discord Account
              </h3>
              <div className="text-sm text-gray-600">
                <p>Username: @{user.name}</p>
                <p>ID: {user.discordId}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This information is synced from your Discord account and cannot
                be changed here.
              </p>
            </div>
          </div>
        </Form>
      </PageContent>
    </PageLayout>
  );
}
