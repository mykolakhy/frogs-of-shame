# They Are Frogs

A small image bank for searchable, downloadable frog images. It is built as a static site, so it can be hosted on GitHub Pages, Netlify, Vercel, S3, or any static file host.

Live site: <https://theyarefrogs.com/>

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

The `favorites` table's row-level-security policies are exercised by real HTTP calls against Supabase (see [Tests](#tests) below), which needs one more BWS secret pair: `TESTS_USER_EMAIL` and `TESTS_USER_PASS`, holding the credentials of a dedicated Supabase Auth user with a confirmed email (create it once via the Supabase dashboard, then add its email/password as those two secrets in the same BWS project). This account only ever touches its own `favorites` rows, so it needs no special privileges.

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

## Tests

```bash
npm test
```

Runs [`tests/favorites.rls.test.js`](tests/favorites.rls.test.js) via Vitest — integration tests that hit the live Supabase REST API directly with axios (not `supabase-js`) to verify the `favorites` table's row-level-security policies actually hold: anonymous requests see/write nothing, and an authenticated user can only read, insert, and delete their own rows. Requires the `TESTS_USER_EMAIL`/`TESTS_USER_PASS` BWS secrets described above; runs against the real project, so it creates and cleans up one throwaway `favorites` row per run.

## CI/CD (Jenkins)

[`Jenkinsfile`](Jenkinsfile) defines the pipeline: Checkout → Install → Typecheck → Test → Build → Deploy (pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves). This section is for setting up a Jenkins instance that can run it — the live site's Jenkins already exists, so you only need this if you're standing up your own (e.g. a fresh machine, or a fork).

1. **Install and run Jenkins** (macOS, via Homebrew):

   ```bash
   brew install jenkins-lts
   brew services start jenkins-lts
   ```

   `brew services` runs it as a background `launchd` service on `http://localhost:8080` that survives closing the terminal and restarts automatically on login (vs. running `jenkins-lts` directly in a terminal, which dies when that terminal closes).

2. **First-time setup wizard**: open `http://localhost:8080`, unlock with the contents of `~/.jenkins/secrets/initialAdminPassword`, install the suggested plugins (includes Git and Pipeline, both required here), then create your own admin user — don't leave the generated unlock password as your permanent login.

3. **Fix Jenkins' PATH** — a `launchd` service starts with a bare `PATH` (`/usr/bin:/bin:/usr/sbin:/sbin`), so it won't see Node/npm (if installed via nvm) or the `bws` CLI (if installed via Homebrew on Apple Silicon). Rather than hardcoding your local username/paths into this (public) Jenkinsfile, add them as a **local-only** Jenkins global environment variable via a Groovy init script — this file lives in `~/.jenkins/`, never in this repo:

   ```groovy
   // ~/.jenkins/init.groovy.d/global-path.groovy
   import jenkins.model.Jenkins
   import hudson.slaves.EnvironmentVariablesNodeProperty

   def jenkins = Jenkins.get()
   def globalNodeProperties = jenkins.getGlobalNodeProperties()
   def envVarsProperties = globalNodeProperties.getAll(EnvironmentVariablesNodeProperty.class)

   def envVars
   if (envVarsProperties.isEmpty()) {
     def newProperty = new EnvironmentVariablesNodeProperty()
     globalNodeProperties.add(newProperty)
     envVars = newProperty.getEnvVars()
   } else {
     envVars = envVarsProperties.get(0).getEnvVars()
   }

   // "PATH+EXTRA" is Jenkins' convention for prepending to PATH instead of replacing it.
   envVars.put("PATH+EXTRA", "/opt/homebrew/bin:/opt/homebrew/sbin:${System.getenv('HOME')}/.nvm/versions/node/<your-node-version>/bin")
   jenkins.save()
   ```

   Init scripts in `init.groovy.d/` run once on every Jenkins startup, so `brew services restart jenkins-lts` afterward picks it up.

4. **Install the `bws` CLI** on the Jenkins host (the [Bitwarden Secrets Manager CLI](https://bitwarden.com/help/secrets-manager-cli/)) and make sure it's on the `PATH` from step 3.

5. **Add Jenkins Credentials** (Manage Jenkins → Credentials → System → Global credentials → Add Credentials):
   - Secret text, ID `THEY_ARE_FROGS_BWS_ACCESS_TOKEN`
   - Secret text, ID `THEY_ARE_FROGS_BWS_PROJECT_ID`
   - Username with password, ID `github-pages-deploy-token` — your GitHub username + a personal access token with `repo` scope (used to push to `gh-pages`)

6. **Create the pipeline job**: New Item → Pipeline, name it (the live one is `they-are-frogs-deploy`) → "Pipeline script from SCM" → Git → this repo's URL → branch `*/main` → script path `Jenkinsfile`.

7. **Point GitHub Pages at the output**: repo Settings → Pages → Source → "Deploy from a branch" → `gh-pages` → `/ (root)`.

Builds currently run on-demand via "Build Now" in the Jenkins UI — there's no GitHub webhook wired up, since that would require this Jenkins host to be reachable from the internet (and running whenever a build should fire), which a laptop-hosted instance isn't by default.

## Project Structure

```text
they-are-frogs/
  index.html
  styles.css
  package.json
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    auth/
      AuthModal.tsx
      AuthWidget.tsx
      useSupabaseSession.ts
    frogs/
      FrogWidget.tsx
      useAuthSessionBridge.ts
  script.js             # legacy fallback; no longer loaded
  supabaseClient.js
  favorites.js
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
  tests/
    favorites.rls.test.js
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
