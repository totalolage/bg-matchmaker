import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "arktype";
import { ComponentProps, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Id } from "@convex/_generated/dataModel";

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
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { GameSelector } from "./session-discovery/GameSelector";
import { Textarea } from "./ui/textarea";

// Define the form schema using Arktype
const sessionFormSchema = type({
  gameId: "string > 0",
  gameName: "string > 0",
  gameImage: "string | undefined",
  scheduledDate: "Date",
  scheduledTime: "string > 0",
  location: "string > 0",
  minPlayers: "2 <= number <= 10",
  maxPlayers: "2 <= number <= 10",
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
      scheduledDate: new Date(),
      scheduledTime: "19:00",
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
    form.setValue("minPlayers", game.minPlayers);
    form.setValue("maxPlayers", game.maxPlayers);
  };

  const onSubmit = form.handleSubmit(async (data: SessionFormData) => {
    try {
      // Convert date and time to timestamp
      const timeParts = data.scheduledTime.split(":");
      const hours = parseInt(timeParts[0] || "19", 10);
      const minutes = parseInt(timeParts[1] || "0", 10);
      const scheduledTimestamp = new Date(data.scheduledDate);
      scheduledTimestamp.setHours(hours, minutes, 0, 0);

      await createSession({
        gameId: data.gameId,
        gameName: data.gameName,
        gameImage: data.gameImage || undefined,
        minPlayers: data.minPlayers,
        maxPlayers: data.maxPlayers,
        scheduledTime: scheduledTimestamp.getTime(),
        description: data.description || undefined,
        location: data.location,
      });

      toast.success("Session created successfully!");
      form.reset();
      setSelectedGame(null);
      
      // Redirect to discovery page
      void router.navigate({ to: "/discover" });
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to create session");
    }
  });

  const minPlayers = form.watch("minPlayers");

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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          {/* Player Count */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="minPlayers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Players</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} players
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxPlayers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Players</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10]
                            .filter((num) => num >= minPlayers)
                            .map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} players
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              onClick={() => router.navigate({ to: "/discover" })}
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
