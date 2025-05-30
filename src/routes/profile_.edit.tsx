import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { useForm } from "react-hook-form";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "arktype";
import { useEffect, useMemo } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { useMutation } from "@tanstack/react-query";

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

  const handleSave = useMemo(
    () =>
      form.handleSubmit(async ({ displayName }) => {
        if (updateDisplayName.isPending) return false;
        if (displayName.trim() === user.displayName) return false;

        await updateDisplayName.mutateAsync({ displayName });

        toast.success("Profile updated");
        return true; // Successfully saved
      }),
    [form, updateDisplayName, user.displayName],
  );

  useEffect(
    () =>
      router.subscribe("onBeforeNavigate", () => {
        void handleSave();
      }),
    [handleSave, router],
  );

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4">
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
      </header>

      <main className="p-4 flex-1 overflow-y-auto">
        <Form {...form}>
          <div className="max-w-md mx-auto space-y-6">
            {/* Profile Picture */}
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-2">
                <AvatarImage
                  src={
                    user.profilePic ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                  }
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
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
      </main>
    </div>
  );
}
