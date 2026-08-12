import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Download, Share2, Star, X } from "lucide-react";
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

const FROG_QUERY_PARAM = "frog";

function getFrogIdFromUrl() {
  return new URL(window.location.href).searchParams.get(FROG_QUERY_PARAM);
}

function getUrlWithoutFrogQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete(FROG_QUERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

function getFrogUrl(frogId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(FROG_QUERY_PARAM, frogId);
  return url.toString();
}

function getRelativeFrogUrl(frogId: string) {
  const url = new URL(getFrogUrl(frogId));
  return `${url.pathname}${url.search}${url.hash}`;
}

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
  const [selectedFrog, setSelectedFrog] = useState<Frog | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const selectedFrogTrigger = useRef<HTMLButtonElement | null>(null);
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

  useEffect(() => {
    if (frogsQuery.isPending || !frogsQuery.data || selectedFrog) {
      return;
    }

    const frogId = getFrogIdFromUrl();
    if (!frogId) {
      return;
    }

    const deepLinkedFrog = frogsQuery.data.find((frog) => frog.id === frogId);
    if (deepLinkedFrog) {
      selectedFrogTrigger.current = null;
      setSelectedFrog(deepLinkedFrog);
      return;
    }

    window.history.replaceState(window.history.state, "", getUrlWithoutFrogQuery());
  }, [frogsQuery.data, frogsQuery.isPending, selectedFrog]);

  useEffect(() => {
    const handlePopState = () => {
      const frogId = getFrogIdFromUrl();
      const frog = frogs.find((candidate) => candidate.id === frogId);

      if (frog) {
        selectedFrogTrigger.current = null;
        setSelectedFrog(frog);
        return;
      }

      setSelectedFrog(null);
      selectedFrogTrigger.current?.focus();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [frogs]);

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

  const handleOpenDetails = useCallback((frog: Frog, trigger: HTMLButtonElement) => {
    selectedFrogTrigger.current = trigger;
    window.history.pushState(
      { ...window.history.state, frogModal: true, frogId: frog.id },
      "",
      getRelativeFrogUrl(frog.id),
    );
    setSelectedFrog(frog);
  }, []);

  const handleCloseDetails = useCallback(() => {
    window.history.replaceState(window.history.state, "", getUrlWithoutFrogQuery());
    setSelectedFrog(null);
    selectedFrogTrigger.current?.focus();
  }, []);

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
            onOpenDetails={handleOpenDetails}
          />
        ))}
      </section>

      <section id="emptyState" className="empty-state" hidden={!showEmptyState}>
        <h2>No frogs found</h2>
        <p>{emptyStateMessage}</p>
      </section>

      {selectedFrog ? (
        <FrogDetailModal
          frog={selectedFrog}
          isAuthenticated={Boolean(userId)}
          isFavorited={favoriteIds.has(selectedFrog.id)}
          isPending={favoriteMutation.isPending && favoriteMutation.variables?.frogId === selectedFrog.id}
          onFavoriteToggle={handleFavoriteToggle}
          onClose={handleCloseDetails}
        />
      ) : null}
    </>
  );
}

type FrogCardProps = {
  frog: Frog;
  isFavorited: boolean;
  isAuthenticated: boolean;
  isPending: boolean;
  onFavoriteToggle: (frogId: string) => void;
  onOpenDetails: (frog: Frog, trigger: HTMLButtonElement) => void;
};

function FrogCard({
  frog,
  isFavorited,
  isAuthenticated,
  isPending,
  onFavoriteToggle,
  onOpenDetails,
}: FrogCardProps) {
  const imagePath = `./assets/frogs/${frog.file}`;
  const previewPath = `./assets/frogs/previews/${frog.file.replace(/\.[^.]+$/, ".webp")}`;

  return (
    <article className="frog-card" data-frog-id={frog.id}>
      <button
        className="image-link"
        type="button"
        aria-label={`Open details for ${frog.title}`}
        onClick={(event) => onOpenDetails(frog, event.currentTarget)}
      >
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
      </button>
      {isAuthenticated ? (
        <button
          className="favorite-toggle"
          type="button"
          aria-pressed={isFavorited}
          disabled={isPending}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          onClick={() => onFavoriteToggle(frog.id)}
        >
          <Star aria-hidden="true" size={20} fill={isFavorited ? "currentColor" : "none"} />
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

type FrogDetailModalProps = {
  frog: Frog;
  isAuthenticated: boolean;
  isFavorited: boolean;
  isPending: boolean;
  onFavoriteToggle: (frogId: string) => void;
  onClose: () => void;
};

function FrogDetailModal({ frog, isAuthenticated, isFavorited, isPending, onFavoriteToggle, onClose }: FrogDetailModalProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const shareButton = useRef<HTMLButtonElement>(null);
  const copyLinkButton = useRef<HTMLButtonElement>(null);
  const sharePanel = useRef<HTMLDivElement>(null);
  const modal = useRef<HTMLElement>(null);
  const titleId = useId();
  const sharePanelId = useId();
  const sharePanelTitleId = useId();
  const imagePath = `./assets/frogs/${frog.file}`;
  const shareUrl = getFrogUrl(frog.id);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const browserNavigator = globalThis.navigator as Navigator & {
    share?: (data: { title: string; text: string; url: string }) => Promise<void>;
  };
  const canUseNativeShare = typeof browserNavigator.share === "function";

  const closeSharePanel = useCallback(() => {
    setIsShareOpen(false);
    setCopyStatus("idle");
    shareButton.current?.focus();
  }, []);

  const handleCopyLink = async () => {
    try {
      if (!browserNavigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable.");
      }

      await browserNavigator.clipboard.writeText(shareUrl);
      setCopyStatus("success");
    } catch (error) {
      console.error(error);
      setCopyStatus("error");
    }
  };

  const handleNativeShare = async () => {
    if (!browserNavigator.share) {
      return;
    }

    try {
      await browserNavigator.share({
        title: frog.title,
        text: `Check out ${frog.title}`,
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error(error);
    }
  };

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isShareOpen) {
          closeSharePanel();
        } else {
          onClose();
        }
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = modal.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        );

        if (!focusableElements?.length) {
          return;
        }

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstFocusableElement) {
          event.preventDefault();
          lastFocusableElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
          event.preventDefault();
          firstFocusableElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSharePanel, isShareOpen, onClose]);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  useEffect(() => {
    if (isShareOpen) {
      copyLinkButton.current?.focus();
    }
  }, [isShareOpen]);

  useEffect(() => {
    if (!isShareOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !sharePanel.current?.contains(target) && !shareButton.current?.contains(target)) {
        closeSharePanel();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeSharePanel, isShareOpen]);

  useEffect(() => {
    setIsShareOpen(false);
    setCopyStatus("idle");
  }, [frog.id]);

  return (
    <div
      className="frog-detail-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section ref={modal} className="frog-detail-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="frog-detail-modal-header">
          <h2 id={titleId}>{frog.title}</h2>
          <ul className="tag-list" aria-label={`${frog.title} tags`}>
            {frog.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </header>

        <div className="frog-detail-modal-content">
          <div className="frog-detail-modal-image">
            <img src={imagePath} alt={frog.title} />
          </div>

          <div className="frog-detail-modal-actions">
            <button ref={closeButton} className="modal-icon-button" type="button" aria-label="Close" onClick={onClose}>
              <X aria-hidden="true" size={20} />
            </button>
            {isAuthenticated ? (
              <button
                className="modal-icon-button"
                type="button"
                aria-pressed={isFavorited}
                disabled={isPending}
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                onClick={() => onFavoriteToggle(frog.id)}
              >
                <Star aria-hidden="true" size={20} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            ) : null}
            <button
              ref={shareButton}
              className="modal-icon-button"
              type="button"
              aria-label="Share frog"
              aria-expanded={isShareOpen}
              aria-controls={sharePanelId}
              onClick={() => setIsShareOpen((open) => !open)}
            >
              <Share2 className="modal-share-icon" aria-hidden="true" size={20} />
            </button>
            {isShareOpen ? (
              <div
                ref={sharePanel}
                id={sharePanelId}
                className="frog-share-panel"
                role="dialog"
                aria-labelledby={sharePanelTitleId}
              >
                <div className="frog-share-panel-header">
                  <h3 id={sharePanelTitleId}>Share this frog</h3>
                  <button className="share-panel-close" type="button" aria-label="Close share panel" onClick={closeSharePanel}>
                    <X aria-hidden="true" size={16} />
                  </button>
                </div>
                <button ref={copyLinkButton} className="share-panel-action" type="button" onClick={handleCopyLink}>
                  {copyStatus === "success" ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
                  Copy link
                </button>
                {canUseNativeShare ? (
                  <button className="share-panel-action" type="button" onClick={handleNativeShare}>
                    <Share2 aria-hidden="true" size={18} />
                    Share...
                  </button>
                ) : null}
                {copyStatus !== "idle" ? (
                  <p className="share-panel-status" role="status" aria-live="polite">
                    {copyStatus === "success" ? "Link copied." : "Could not copy the link."}
                  </p>
                ) : null}
              </div>
            ) : null}
            <a className="modal-icon-button" href={imagePath} download={frog.file} aria-label="Download PNG">
              <Download aria-hidden="true" size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
