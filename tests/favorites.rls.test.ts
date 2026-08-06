import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { requireTestEnv, createAnonClient, createAuthedClient } from "./helpers/supabaseApi.js";
import { AuthApi } from "./helpers/authApi.js";
import { FavoritesApi } from "./helpers/favoritesApi.js";

const { SUPABASE_URL, ANON_KEY, TEST_EMAIL, TEST_PASSWORD } = requireTestEnv();

const anonClient = createAnonClient(SUPABASE_URL, ANON_KEY);
const authApi = new AuthApi(anonClient);
const anonFavorites = new FavoritesApi(anonClient);

const testFrogId = `rls-test-${Date.now()}`;
let userId: string;
let authedFavorites: FavoritesApi;

beforeAll(async () => {
  const { status, data } = await authApi.login(TEST_EMAIL, TEST_PASSWORD);
  if (status !== 200) {
    throw new Error(`Test-user login failed (${status}): ${JSON.stringify(data)}`);
  }

  userId = data.user.id;
  authedFavorites = new FavoritesApi(createAuthedClient(SUPABASE_URL, ANON_KEY, data.access_token));
});

afterAll(async () => {
  await authedFavorites?.delete(testFrogId);
});

describe("favorites RLS policies", () => {
  test("anonymous requests see no rows", async () => {
    const { status, data } = await anonFavorites.list();
    expect(status).toBe(200);
    expect(data).toEqual([]);
  });

  test("anonymous insert is rejected", async () => {
    const { status, data } = await anonFavorites.insert("00000000-0000-0000-0000-000000000000", testFrogId);
    expect(status).toBe(401);
    expect(data.code).toBe("42501"); // Postgres: RLS policy violation
  });

  test("authenticated user can insert and read their own favorite", async () => {
    const insert = await authedFavorites.insert(userId, testFrogId);
    expect(insert.status).toBe(201);

    const read = await authedFavorites.list(testFrogId);
    expect(read.data).toHaveLength(1);
    expect(read.data[0].user_id).toBe(userId);
  });

  test("authenticated user cannot insert a favorite for another user_id", async () => {
    const { status, data } = await authedFavorites.insert(
      "00000000-0000-0000-0000-000000000000",
      `${testFrogId}-other`,
    );
    expect(status).toBe(403);
    expect(data.code).toBe("42501"); // Postgres: RLS policy violation
  });

  test("authenticated user can delete their own favorite", async () => {
    const del = await authedFavorites.delete(testFrogId);
    expect(del.status).toBe(204);

    const read = await authedFavorites.list(testFrogId);
    expect(read.data).toHaveLength(0);
  });
});
