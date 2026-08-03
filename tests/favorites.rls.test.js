import axios from "axios";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

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

// validateStatus lets tests assert on RLS-rejection status codes directly
// instead of catching thrown errors for every negative case.
const anon = axios.create({
  baseURL: SUPABASE_URL,
  headers: { apikey: ANON_KEY },
  validateStatus: () => true,
});

const testFrogId = `rls-test-${Date.now()}`;
let userId;
let authed;

beforeAll(async () => {
  const login = await anon.post("/auth/v1/token?grant_type=password", {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (login.status !== 200) {
    throw new Error(`Test-user login failed (${login.status}): ${JSON.stringify(login.data)}`);
  }

  userId = login.data.user.id;
  authed = axios.create({
    baseURL: SUPABASE_URL,
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${login.data.access_token}` },
    validateStatus: () => true,
  });
});

afterAll(async () => {
  await authed?.delete(`/rest/v1/favorites?frog_id=eq.${testFrogId}`);
});

describe("favorites RLS policies", () => {
  test("anonymous requests see no rows", async () => {
    const { status, data } = await anon.get("/rest/v1/favorites");
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });

  test("anonymous insert is rejected", async () => {
    const { status } = await anon.post("/rest/v1/favorites", {
      user_id: "00000000-0000-0000-0000-000000000000",
      frog_id: testFrogId,
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test("authenticated user can insert and read their own favorite", async () => {
    const insert = await authed.post("/rest/v1/favorites", { user_id: userId, frog_id: testFrogId });
    expect(insert.status).toBe(201);

    const read = await authed.get(`/rest/v1/favorites?frog_id=eq.${testFrogId}`);
    expect(read.data).toHaveLength(1);
    expect(read.data[0].user_id).toBe(userId);
  });

  test("authenticated user cannot insert a favorite for another user_id", async () => {
    const { status } = await authed.post("/rest/v1/favorites", {
      user_id: "00000000-0000-0000-0000-000000000000",
      frog_id: `${testFrogId}-other`,
    });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  test("authenticated user can delete their own favorite", async () => {
    const del = await authed.delete(`/rest/v1/favorites?frog_id=eq.${testFrogId}`);
    expect(del.status).toBe(204);

    const read = await authed.get(`/rest/v1/favorites?frog_id=eq.${testFrogId}`);
    expect(read.data).toHaveLength(0);
  });
});
