import axios from "axios";

// Central place for the env vars every API/integration test needs, so each
// test file doesn't repeat its own copy of this guard clause.
export function requireTestEnv() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const TEST_EMAIL = process.env.TESTS_USER_EMAIL;
  const TEST_PASSWORD = process.env.TESTS_USER_PASS;

  if (!SUPABASE_URL || !ANON_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / TESTS_USER_EMAIL / TESTS_USER_PASS — " +
        "run tests via `npm test` so BWS secrets are injected (see README's Secrets section).",
    );
  }

  return { SUPABASE_URL, ANON_KEY, TEST_EMAIL, TEST_PASSWORD };
}

// validateStatus lets tests assert on exact status codes directly instead of
// catching thrown errors for every negative case.
export function createAnonClient(supabaseUrl, anonKey) {
  return axios.create({
    baseURL: supabaseUrl,
    headers: { apikey: anonKey },
    validateStatus: () => true,
  });
}

export function createAuthedClient(supabaseUrl, anonKey, accessToken) {
  return axios.create({
    baseURL: supabaseUrl,
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    validateStatus: () => true,
  });
}
