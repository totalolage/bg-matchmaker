import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useRouter } from "@tanstack/react-router";
import { type } from "arktype";
import { format } from "date-fns";
import { Calendar, MapPin, Users } from "lucide-react";
import { ComponentProps, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { GameSelector } from "./session-discovery/GameSelector";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";

// Define the form schema using Arktype
const sessionFormSchema = type({
  gameId: "string > 0",
  gameName: "string > 0",
  gameImage: "string | undefined",
  scheduledDateTime: "string > 0", // Using datetime-local input
  location: "string > 0",
  minPlayers: "number >= 1",
  maxPlayers: "number >= 1",
  description: "string | undefined",
});

type SessionFormData = typeof sessionFormSchema.infer;

interface Game {
  _id: Id<"gameData">;
  boardGameAtlasId: string;
  name: string;
  imageUrl?: string;
  alternateNames?: string[];
  minPlayers: number;
  maxPlayers: number;
  playTime: number;
}

export const CreateSessionForm = () => {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const user = useQuery(api.users.getCurrentUser);
  const createSession = useMutation(api.sessions.createSession);

  const form = useForm<SessionFormData>({
    resolver: arktypeResolver(sessionFormSchema),
    defaultValues: {
      gameId: "",
      gameName: "",
      gameImage: undefined,
      scheduledDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      location: "",
      minPlayers: 2,
      maxPlayers: 4,
      description: "",
    },
  });

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    form.setValue("gameId", game.boardGameAtlasId);
    form.setValue("gameName", game.name);
    form.setValue("gameImage", game.imageUrl);
    // Set player range based on game's min/max
    form.setValue("minPlayers", game.minPlayers);
    form.setValue("maxPlayers", game.maxPlayers);
  };

  const onSubmit = form.handleSubmit(async (data: SessionFormData) => {
    try {
      // Convert datetime-local to timestamp
      const scheduledTimestamp = new Date(data.scheduledDateTime).getTime();

      const sessionId = await createSession({
        gameId: data.gameId,
        gameName: data.gameName,
        gameImage: data.gameImage || undefined,
        minPlayers: data.minPlayers,
        maxPlayers: data.maxPlayers,
        scheduledTime: scheduledTimestamp,
        description: data.description || undefined,
        location: data.location,
      });

      toast.success("Session created successfully!");
      form.reset();
      setSelectedGame(null);

      // Redirect to session detail page
      void router.navigate({
        to: "/sessions/$sessionId",
        params: { sessionId },
      });
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to create session");
    }
  });

  const minPlayers = form.watch("minPlayers");
  const maxPlayers = form.watch("maxPlayers");

  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create a New Session</h2>

      <Form {...form}>
        <form onSubmit={e => void onSubmit(e)} className="space-y-6">
          {/* Game Selection */}
          <div className="space-y-2">
            <FormLabel>Select Game</FormLabel>
            <GameSelector
              selectedGame={selectedGame}
              onGameSelect={handleGameSelect}
              userGameLibrary={user.gameLibrary || []}
            />
          </div>

          {/* Date and Time */}
          <FormField
            control={form.control}
            name="scheduledDateTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      className="pl-10"
                      min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  When will the session take place?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter location (e.g., My place, Board Game Cafe)"
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Where will the session take place?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Player Count Range */}
          <div className="space-y-2">
            <FormLabel>Player Count Range</FormLabel>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium min-w-[3rem]">
                  {minPlayers} players
                </span>
                <Slider
                  value={[minPlayers, maxPlayers]}
                  onValueChange={value => {
                    if (value[0] !== undefined) {
                      form.setValue("minPlayers", value[0]);
                    }
                    if (value[1] !== undefined) {
                      form.setValue("maxPlayers", value[1]);
                    }
                  }}
                  min={selectedGame?.minPlayers || 1}
                  max={selectedGame?.maxPlayers || 10}
                  step={1}
                  className="flex-1"
                  disabled={!selectedGame}
                />
                <span className="text-sm font-medium min-w-[3rem]">
                  {maxPlayers} players
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-12">
                <span>Minimum: {minPlayers}</span>
                <span>Maximum: {maxPlayers}</span>
              </div>
            </div>
            <FormDescription>
              Adjust the range for how many players can join your session
            </FormDescription>
          </div>

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional details about the session..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide any additional information about the session
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !selectedGame}
              className="flex-1"
            >
              {form.formState.isSubmitting ? "Creating..." : "Create Session"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void router.navigate({ to: "/discover" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export type CreateSessionFormProps = ComponentProps<typeof CreateSessionForm>;
