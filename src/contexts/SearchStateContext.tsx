import { createContext, ReactNode, useContext, useState } from "react";

interface SearchState {
  lastSearchQuery: string;
  lastCursor: string | null;
  lastPage: number;
  cachedResults: Map<string, any>;
}

interface SearchStateContextValue {
  searchState: SearchState;
  updateSearchState: (updates: Partial<SearchState>) => void;
  clearSearchState: () => void;
}

const SearchStateContext = createContext<SearchStateContextValue | undefined>(
  undefined,
);

export function SearchStateProvider({ children }: { children: ReactNode }) {
  const [searchState, setSearchState] = useState<SearchState>({
    lastSearchQuery: "",
    lastCursor: null,
    lastPage: 1,
    cachedResults: new Map(),
  });

  const updateSearchState = (updates: Partial<SearchState>) => {
    setSearchState((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const clearSearchState = () => {
    setSearchState({
      lastSearchQuery: "",
      lastCursor: null,
      lastPage: 1,
      cachedResults: new Map(),
    });
  };

  return (
    <SearchStateContext.Provider
      value={{
        searchState,
        updateSearchState,
        clearSearchState,
      }}
    >
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState() {
  const context = useContext(SearchStateContext);
  if (!context) {
    throw new Error("useSearchState must be used within SearchStateProvider");
  }
  return context;
}