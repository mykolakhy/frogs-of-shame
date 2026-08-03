import { supabase } from "./supabaseClient.js";
import { getFavoriteIds, addFavorite, removeFavorite } from "./favorites.js";

const grid = document.querySelector("#frogGrid");
const template = document.querySelector("#frogCardTemplate");
const searchInput = document.querySelector("#searchInput");
const clearSearch = document.querySelector("#clearSearch");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const favoritesFilterButton = document.querySelector("#favoritesFilter");

let frogs = [];
let favoriteIds = new Set();
let currentUserId = null;
let showFavoritesOnly = false;
const pendingFrogIds = new Set();

const normalize = (value) => value.toLowerCase().trim();

const searchableText = (frog) =>
  normalize([frog.title, frog.description, frog.file, ...(frog.tags ?? [])].join(" "));

const matchesQuery = (frog, query) => {
  if (!query) {
    return true;
  }

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = searchableText(frog);

  return words.every((word) => haystack.includes(word));
};

const renderFrogs = () => {
  const query = searchInput.value;
  const filteredFrogs = frogs.filter(
    (frog) => matchesQuery(frog, query) && (!showFavoritesOnly || favoriteIds.has(frog.id)),
  );

  grid.replaceChildren();

  for (const frog of filteredFrogs) {
    const card = template.content.cloneNode(true);
    const article = card.querySelector(".frog-card");
    const imageLink = card.querySelector(".image-link");
    const image = card.querySelector("img");
    const favoriteToggle = card.querySelector(".favorite-toggle");
    const title = card.querySelector("h2");
    const description = card.querySelector(".description");
    const tagList = card.querySelector(".tag-list");
    const downloadButton = card.querySelector(".download-button");
    const imagePath = `./assets/frogs/${frog.file}`;
    const isFavorited = favoriteIds.has(frog.id);

    article.dataset.frogId = frog.id;
    imageLink.href = imagePath;
    image.src = imagePath;
    image.alt = frog.title;
    favoriteToggle.setAttribute("aria-pressed", String(isFavorited));
    favoriteToggle.textContent = isFavorited ? "★" : "☆";
    favoriteToggle.disabled = !currentUserId;
    favoriteToggle.setAttribute(
      "aria-label",
      currentUserId ? (isFavorited ? "Remove from favorites" : "Add to favorites") : "Log in to save favorites",
    );
    title.textContent = frog.title;
    description.textContent = frog.description;
    downloadButton.href = imagePath;
    downloadButton.download = frog.file;

    for (const tag of frog.tags) {
      const item = document.createElement("li");
      item.textContent = tag;
      tagList.append(item);
    }

    grid.append(card);
  }

  const total = frogs.length;
  const visible = filteredFrogs.length;
  resultCount.textContent = `${visible} of ${total} frog${total === 1 ? "" : "s"} shown`;
  emptyState.hidden = visible > 0;
  emptyState.querySelector("p").textContent = showFavoritesOnly
    ? "No favorites yet — click the star on a frog to save it."
    : "Try a broader search term or add another tag to the frog catalog.";
};

const loadFrogs = async () => {
  try {
    const response = await fetch("./assets/frogs.json");

    if (!response.ok) {
      throw new Error(`Catalog request failed: ${response.status}`);
    }

    frogs = await response.json();
    renderFrogs();
  } catch (error) {
    resultCount.textContent = "Could not load frog catalog";
    emptyState.hidden = false;
    emptyState.querySelector("p").textContent =
      "Start a local web server from this folder so the browser can load assets/frogs.json.";
    console.error(error);
  }
};

searchInput.addEventListener("input", renderFrogs);
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  renderFrogs();
});

favoritesFilterButton.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  favoritesFilterButton.setAttribute("aria-pressed", String(showFavoritesOnly));
  renderFrogs();
});

const refocusFavoriteToggle = (frogId) =>
  grid.querySelector(`[data-frog-id="${frogId}"] .favorite-toggle`)?.focus();

grid.addEventListener("click", async (event) => {
  const button = event.target.closest(".favorite-toggle");
  if (!button || !currentUserId) {
    return;
  }

  const frogId = button.closest(".frog-card").dataset.frogId;
  if (pendingFrogIds.has(frogId)) {
    return;
  }
  pendingFrogIds.add(frogId);

  const isFavorited = favoriteIds.has(frogId);
  isFavorited ? favoriteIds.delete(frogId) : favoriteIds.add(frogId);
  renderFrogs();
  refocusFavoriteToggle(frogId);

  try {
    isFavorited ? await removeFavorite(currentUserId, frogId) : await addFavorite(currentUserId, frogId);
  } catch (error) {
    isFavorited ? favoriteIds.add(frogId) : favoriteIds.delete(frogId);
    renderFrogs();
    refocusFavoriteToggle(frogId);
    console.error(error);
  } finally {
    pendingFrogIds.delete(frogId);
  }
});

const applySession = async (session) => {
  currentUserId = session?.user?.id ?? null;
  favoritesFilterButton.disabled = !currentUserId;
  favoritesFilterButton.title = currentUserId ? "" : "Log in to filter favorites";

  if (!currentUserId) {
    showFavoritesOnly = false;
    favoritesFilterButton.setAttribute("aria-pressed", "false");
    favoriteIds = new Set();
    renderFrogs();
    return;
  }

  try {
    favoriteIds = await getFavoriteIds(currentUserId);
  } catch (error) {
    favoriteIds = new Set();
    console.error(error);
  }
  renderFrogs();
};

document.addEventListener("frog-auth-changed", (event) => applySession(event.detail.session));

// auth.js's `onAuthStateChange`-driven dispatch of "frog-auth-changed" isn't
// guaranteed to land after this listener is registered (a restored session
// can fire before script.js's module body finishes running) — so fetch the
// current session directly here too, as the reliable source for initial state.
if (supabase) {
  supabase.auth.getSession().then(({ data }) => applySession(data.session));
}

loadFrogs();
