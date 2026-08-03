# They Are Frogs

A small image bank for searchable, downloadable frog images. It is built as a static site, so it can be hosted on GitHub Pages, Netlify, Vercel, S3, or any static file host.

Live site: <https://mykolakhy.github.io/they-are-frogs/>

## Run Locally

From this folder:

```bash
npm install
npm run dev
```

Open the URL Vite prints (defaults to `http://localhost:5173`).

To try a production build locally:

```bash
npm run build
npm run preview
```

## Project Structure

```text
they-are-frogs/
  index.html
  styles.css
  script.js
  supabaseClient.js
  auth.js
  public/
    assets/
      frogs.json
      frogs/
        *.png
  supabase/
    migrations/
      0001_favorites.sql
```

The searchable catalog lives in `public/assets/frogs.json`; image files live in `public/assets/frogs/`. Files under `public/` are Vite's static passthrough directory, so they're served/copied unchanged in both dev and build (still reachable at `./assets/...` at runtime).

## Add Another Frog

1. Put the new image file in `public/assets/frogs/`.
2. Add a new entry to `public/assets/frogs.json`.
3. Run the site locally and confirm the frog appears in search results.
4. Open a pull request against `main`.

Example entry:

```json
{
  "id": "example-frog",
  "title": "Example Frog",
  "file": "example_frog.png",
  "description": "Short human-readable description shown on the card.",
  "tags": ["example", "green", "funny"]
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
