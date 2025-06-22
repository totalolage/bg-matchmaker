/* eslint-disable react-refresh/only-export-components */
import { createContext, PropsWithChildren, useContext, useState } from "react";

interface SearchState {
  lastSearchQuery: string;
  lastCursor: string | null;
  lastPage: number;
  cachedResults: Map<string, unknown>;
}

interface SearchStateContextValue {
  searchState: SearchState;
  updateSearchState: (updates: Partial<SearchState>) => void;
  clearSearchState: () => void;
}

const SearchStateContext = createContext<SearchStateContextValue | undefined>(
  undefined,
);

function SearchStateProvider({ children }: PropsWithChildren) {
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

// Export only the provider component for fast refresh compatibility
export { SearchStateProvider };

// Create a separate export for the hook to maintain fast refresh
export const useSearchState = () => {
  const context = useContext(SearchStateContext);
  if (!context) {
    throw new Error("useSearchState must be used within SearchStateProvider");
  }
  return context;
};