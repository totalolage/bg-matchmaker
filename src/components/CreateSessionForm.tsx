import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

export function CreateSessionForm() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Create Session</h2>
      <form className="space-y-4">
        <div>
          <Label className="block text-sm font-medium mb-1">Session Name</Label>
          <Input type="text" placeholder="Enter session name" />
        </div>
        <Button type="submit">
          Create
        </Button>
      </form>
    </div>
  );
}