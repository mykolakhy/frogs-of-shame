# Frogs of Shame

A small image bank for searchable, downloadable frog images. It is built as a static site, so it can be hosted on GitHub Pages, Netlify, Vercel, S3, or any static file host.

Live site: <https://mykolakhy.github.io/frogs-of-shame/>

## Run Locally

From this folder:

```bash
python3 -m http.server 5173
```

Open:

```text
http://localhost:5173
```

A local server is recommended because browsers usually block `fetch("./assets/frogs.json")` when `index.html` is opened directly from the filesystem.

## Project Structure

```text
frog-shame-bank/
  index.html
  styles.css
  script.js
  assets/
    frogs.json
    frogs/
      *.png
```

The searchable catalog lives in `assets/frogs.json`; image files live in `assets/frogs/`.

## Add Another Frog

1. Put the new image file in `assets/frogs/`.
2. Add a new entry to `assets/frogs.json`.
3. Run the site locally and confirm the frog appears in search results.
4. Open a pull request against `main`.

Example entry:

```json
{
  "id": "example-frog",
  "title": "Example Frog of Shame",
  "file": "example_frog_of_shame.png",
  "description": "Short human-readable description shown on the card.",
  "tags": ["example", "green", "funny", "shame"]
}
```

## Tagging Tips

Use tags for words people may search by:

- visual style: `cosmic`, `bronze`, `neon`, `dark`
- color: `green`, `purple`, `gold`
- mood: `cursed`, `horror`, `funny`, `dramatic`
- objects or themes: `runes`, `planets`, `radioactive`, `slime`

Search matches title, description, filename, and tags.

## Contributing

Changes should go through pull requests. The `main` branch is protected and requires code-owner review before merge.

## License

This project is released under the MIT License. See `LICENSE` for details.
