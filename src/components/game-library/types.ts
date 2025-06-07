export type GameSearchResult = {
  bggId: string;
  name: string;
  image: string;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  complexity: number;
};

export type ExpertiseLevel =
  | "novice"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export type GameLibraryItem = {
  gameId: string;
  gameName: string;
  gameImage?: string;
  expertiseLevel: ExpertiseLevel;
};

export type ExpertiseLevelOption = {
  value: ExpertiseLevel;
  label: string;
  color: string;
};