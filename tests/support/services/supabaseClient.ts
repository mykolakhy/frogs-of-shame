import axios, { type AxiosInstance } from "axios";

export type TestEnv = {
  SUPABASE_URL: string;
  ANON_KEY: string;
  TEST_EMAIL: string;
  TEST_PASSWORD: string;
};

// Central place for the environment guard and HTTP clients used by service
// objects in API and integration tests.
export function requireTestEnv(): TestEnv {
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

// validateStatus lets tests assert exact status codes directly instead of
// catching thrown errors for every negative case.
export function createAnonClient(supabaseUrl: string, anonKey: string): AxiosInstance {
  return axios.create({
    baseURL: supabaseUrl,
    headers: { apikey: anonKey },
    validateStatus: () => true,
  });
}

export function createAuthedClient(supabaseUrl: string, anonKey: string, accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: supabaseUrl,
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    validateStatus: () => true,
  });
}
