# They Are Frogs

A small image bank for searchable, downloadable frog images. It is built as a static site, so it can be hosted on GitHub Pages, Netlify, Vercel, S3, or any static file host.

Live site: <https://mykolakhy.github.io/they-are-frogs/>

## Secrets

No `.env` files are used anywhere in this repo. Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) live in a Bitwarden Secrets Manager (BWS) project and are fetched live at dev/build time via the `bws` CLI.

One-time local setup (requires the [`bws` CLI](https://bitwarden.com/help/secrets-manager-cli/) installed, and a BWS access token + project ID from whoever administers the BWS project):

```bash
security add-generic-password -a "$USER" -s "THEY_ARE_FROGS_BWS_ACCESS_TOKEN" -w
security add-generic-password -a "$USER" -s "THEY_ARE_FROGS_BWS_PROJECT_ID" -w
```

Each command prompts for a value — paste in your real BWS access token / project ID. These two pointers are stored in your local macOS Keychain; the actual Supabase secrets never touch disk.

`npm run dev` / `build` / `preview` all go through [`scripts/with-secrets.sh`](scripts/with-secrets.sh), which reads those two Keychain entries and runs `bws run` to inject the real secrets into Vite's environment for that command only.

On CI (Jenkins), the same two pointers come from Jenkins Credentials instead of Keychain — see [`Jenkinsfile`](Jenkinsfile).

## Run Locally

From this folder (after the one-time secrets setup above):

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
  scripts/
    with-secrets.sh
  public/
    assets/
      frogs.json
      frogs/
        *.png
  supabase/
    migrations/
      0001_favorites.sql
  Jenkinsfile
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
