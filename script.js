const grid = document.querySelector("#frogGrid");
const template = document.querySelector("#frogCardTemplate");
const searchInput = document.querySelector("#searchInput");
const clearSearch = document.querySelector("#clearSearch");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");

let frogs = [];

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
  const filteredFrogs = frogs.filter((frog) => matchesQuery(frog, query));

  grid.replaceChildren();

  for (const frog of filteredFrogs) {
    const card = template.content.cloneNode(true);
    const article = card.querySelector(".frog-card");
    const imageLink = card.querySelector(".image-link");
    const image = card.querySelector("img");
    const title = card.querySelector("h2");
    const description = card.querySelector(".description");
    const tagList = card.querySelector(".tag-list");
    const downloadButton = card.querySelector(".download-button");
    const imagePath = `./assets/frogs/${frog.file}`;

    article.dataset.frogId = frog.id;
    imageLink.href = imagePath;
    image.src = imagePath;
    image.alt = frog.title;
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

loadFrogs();
