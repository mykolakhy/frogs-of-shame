import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, getFavoriteIds, removeFavorite } from "../../favorites.js";
import { useAuthSessionBridge } from "./useAuthSessionBridge";
import { parseFrogCatalog } from "./frogCatalog";
import { matchesFrogQuery, type Frog } from "./frogSearch";

type FavoriteMutationVariables = {
  frogId: string;
  wasFavorited: boolean;
};

type FavoriteMutationContext = {
  previousFavoriteIds: Set<string>;
};

async function fetchFrogs(): Promise<Frog[]> {
  const response = await fetch("./assets/frogs.json");

  if (!response.ok) {
    throw new Error(`Catalog request failed: ${response.status}`);
  }

  return parseFrogCatalog(await response.json());
}

export function FrogWidget() {
  const { session } = useAuthSessionBridge();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const userId = session?.user?.id ?? null;
  const favoriteQueryKey = ["favoriteIds", userId] as const;

  const frogsQuery = useQuery({
    queryKey: ["frogs"],
    queryFn: fetchFrogs,
    retry: false,
    staleTime: Infinity,
  });

  const favoriteIdsQuery = useQuery<Set<string>>({
    queryKey: favoriteQueryKey,
    queryFn: async () => {
      if (!userId) {
        return new Set<string>();
      }

      return getFavoriteIds(userId) as Promise<Set<string>>;
    },
    enabled: Boolean(userId),
    retry: false,
  });

  const favoriteMutation = useMutation<void, Error, FavoriteMutationVariables, FavoriteMutationContext>({
    mutationFn: async ({ frogId, wasFavorited }) => {
      if (!userId) {
        throw new Error("You must be logged in to update favorites.");
      }

      if (wasFavorited) {
        await removeFavorite(userId, frogId);
      } else {
        await addFavorite(userId, frogId);
      }
    },
    onMutate: async ({ frogId, wasFavorited }) => {
      await queryClient.cancelQueries({ queryKey: favoriteQueryKey });

      const previousFavoriteIds = queryClient.getQueryData<Set<string>>(favoriteQueryKey) ?? new Set<string>();
      const nextFavoriteIds = new Set(previousFavoriteIds);

      if (wasFavorited) {
        nextFavoriteIds.delete(frogId);
      } else {
        nextFavoriteIds.add(frogId);
      }

      queryClient.setQueryData(favoriteQueryKey, nextFavoriteIds);

      return { previousFavoriteIds };
    },
    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(favoriteQueryKey, context.previousFavoriteIds);
      }
      console.error(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoriteQueryKey }),
  });

  useEffect(() => {
    if (frogsQuery.error) {
      console.error(frogsQuery.error);
    }
  }, [frogsQuery.error]);

  useEffect(() => {
    if (favoriteIdsQuery.error) {
      console.error(favoriteIdsQuery.error);
    }
  }, [favoriteIdsQuery.error]);

  useEffect(() => {
    if (!userId) {
      setShowFavoritesOnly(false);
    }
  }, [userId]);

  const frogs = frogsQuery.data ?? [];
  const favoriteIds = favoriteIdsQuery.data ?? new Set<string>();
  const filteredFrogs = useMemo(
    () => frogs.filter((frog) => matchesFrogQuery(frog, query) && (!showFavoritesOnly || favoriteIds.has(frog.id))),
    [favoriteIds, frogs, query, showFavoritesOnly],
  );

  const handleClearSearch = () => {
    setQuery("");
    searchInput.current?.focus();
  };

  const handleFavoriteToggle = (frogId: string) => {
    if (!userId) {
      return;
    }

    favoriteMutation.mutate({ frogId, wasFavorited: favoriteIds.has(frogId) });
  };

  const resultText = frogsQuery.isPending
    ? "Loading frogs..."
    : frogsQuery.isError
      ? "Could not load frog catalog"
      : `${filteredFrogs.length} of ${frogs.length} frog${frogs.length === 1 ? "" : "s"} shown`;
  const showEmptyState = frogsQuery.isError || (!frogsQuery.isPending && filteredFrogs.length === 0);
  const emptyStateMessage = frogsQuery.isError
    ? "Start a local web server from this folder so the browser can load assets/frogs.json."
    : showFavoritesOnly
      ? "No favorites yet — click the star on a frog to save it."
      : "Try a broader search term or add another tag to the frog catalog.";

  return (
    <>
      <section className="search-panel" aria-labelledby="search-title">
        <div>
          <h2 id="search-title">Find a frog</h2>
          <p>
            Search by name, color, mood, material, theme, or any tag in the
            catalog.
          </p>
        </div>
        <label className="search-box">
          <span>Search frogs</span>
          <input
            ref={searchInput}
            id="searchInput"
            type="search"
            placeholder="Try: cosmic, radioactive, bronze, cursed"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="toolbar" aria-live="polite">
        <span id="resultCount">{resultText}</span>
        <div className="toolbar-actions">
          {userId ? (
            <button
              id="favoritesFilter"
              type="button"
              aria-pressed={showFavoritesOnly}
              onClick={() => setShowFavoritesOnly((visible) => !visible)}
            >
              My Favorites
            </button>
          ) : null}
          {query.trim() ? (
            <button id="clearSearch" type="button" onClick={handleClearSearch}>
              Clear
            </button>
          ) : null}
        </div>
      </section>

      <section id="frogGrid" className="frog-grid" aria-label="Frog image results">
        {filteredFrogs.map((frog) => (
          <FrogCard
            key={frog.id}
            frog={frog}
            isFavorited={favoriteIds.has(frog.id)}
            isAuthenticated={Boolean(userId)}
            isPending={favoriteMutation.isPending && favoriteMutation.variables?.frogId === frog.id}
            onFavoriteToggle={handleFavoriteToggle}
          />
        ))}
      </section>

      <section id="emptyState" className="empty-state" hidden={!showEmptyState}>
        <h2>No frogs found</h2>
        <p>{emptyStateMessage}</p>
      </section>
    </>
  );
}

type FrogCardProps = {
  frog: Frog;
  isFavorited: boolean;
  isAuthenticated: boolean;
  isPending: boolean;
  onFavoriteToggle: (frogId: string) => void;
};

function FrogCard({ frog, isFavorited, isAuthenticated, isPending, onFavoriteToggle }: FrogCardProps) {
  const imagePath = `./assets/frogs/${frog.file}`;
  const previewPath = `./assets/frogs/previews/${frog.file.replace(/\.[^.]+$/, ".webp")}`;

  return (
    <article className="frog-card" data-frog-id={frog.id}>
      <a className="image-link" href={imagePath} target="_blank" rel="noreferrer">
        <picture>
          <source type="image/webp" srcSet={previewPath} />
          <img
            loading="lazy"
            src={imagePath}
            alt={frog.title}
            onError={(event) => {
              if (event.currentTarget.dataset.fallbackApplied) {
                return;
              }

              event.currentTarget.dataset.fallbackApplied = "true";
              event.currentTarget.src = imagePath;
            }}
          />
        </picture>
      </a>
      {isAuthenticated ? (
        <button
          className="favorite-toggle"
          type="button"
          aria-pressed={isFavorited}
          disabled={isPending}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          onClick={() => onFavoriteToggle(frog.id)}
        >
          {isFavorited ? "★" : "☆"}
        </button>
      ) : null}
      <div className="frog-card-body">
        <div>
          <h2>{frog.title}</h2>
          <p className="description">{frog.description}</p>
        </div>
        <ul className="tag-list" aria-label="Tags">
          {frog.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <a className="download-button" href={imagePath} download={frog.file}>
          Download PNG
        </a>
      </div>
    </article>
  );
}
