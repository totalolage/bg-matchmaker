import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";

export const Route = createFileRoute("/profile_/edit")({
  component: EditProfile,
});

function EditProfile() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const updateDisplayName = useMutation(api.users.updateDisplayName);
  
  const [displayName, setDisplayName] = useState(user.displayName || user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }

    setIsSaving(true);
    setError("");
    
    try {
      await updateDisplayName({ displayName: displayName.trim() });
      toast.success("Profile updated successfully");
      void navigate({ to: "/profile" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="max-w-md mx-auto space-y-6">
          {/* Profile Picture */}
          <div className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-2">
              <AvatarImage 
                src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
              />
              <AvatarFallback>
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-gray-500">Profile picture from Discord</p>
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError("");
              }}
              placeholder="Enter your display name"
            />
            {displayName !== user.name && (
              <p className="text-xs text-gray-500 mt-1">
                Your username: @{user.name}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          {/* Discord Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Discord Account</h3>
            <div className="text-sm text-gray-600">
              <p>Username: @{user.name}</p>
              <p>ID: {user.discordId}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This information is synced from your Discord account and cannot be changed here.
            </p>
          </div>
        </div>
      </main>

      {/* Save Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving || displayName.trim() === (user.displayName || user.name)}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save className="mr-2" size={18} />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}