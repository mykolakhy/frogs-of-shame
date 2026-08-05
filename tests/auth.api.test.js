import axios from "axios";
import { describe, expect, test } from "vitest";

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

// validateStatus lets tests assert on exact rejection status codes directly
// instead of catching thrown errors for every negative case (same pattern as
// tests/favorites.rls.test.js).
const anon = axios.create({
  baseURL: SUPABASE_URL,
  headers: { apikey: ANON_KEY },
  validateStatus: () => true,
});

// No service_role key is available to this suite (only the anon key + one
// dedicated test user), so there's no way to delete a user created via a real
// signup call afterward. The "successful signup" happy path is intentionally
// NOT covered here to avoid leaving orphaned accounts in the live Supabase
// project on every test run — only rejection paths, which never create a row.
describe("POST /auth/v1/token?grant_type=password", () => {
  test("valid credentials return a session for the matching user", async () => {
    const { status, data } = await anon.post("/auth/v1/token?grant_type=password", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(status).toBe(200);
    expect(data.access_token).toEqual(expect.any(String));
    expect(data.user.email).toBe(TEST_EMAIL);
  });

  test("wrong password is rejected without a session", async () => {
    const { status, data } = await anon.post("/auth/v1/token?grant_type=password", {
      email: TEST_EMAIL,
      password: "definitely-not-the-password",
    });

    expect(status).toBe(400);
    expect(data.error_code).toBe("invalid_credentials");
    expect(data.access_token).toBeUndefined();
  });

  test("unknown email is rejected with the same error as a wrong password (no account enumeration)", async () => {
    const { status, data } = await anon.post("/auth/v1/token?grant_type=password", {
      email: `no-such-user-${Date.now()}@example.com`,
      password: "whatever123",
    });

    expect(status).toBe(400);
    expect(data.error_code).toBe("invalid_credentials");
  });
});

describe("POST /auth/v1/signup", () => {
  test("signing up with an already-registered email does not create a new identity", async () => {
    const { status, data } = await anon.post("/auth/v1/signup", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    // Supabase deliberately returns 200 with a user-shaped body here instead of
    // a "this email is taken" error, to avoid leaking which emails are
    // registered (account enumeration). The tell is an empty `identities`
    // array and no session — that's what distinguishes this from a real signup.
    expect(status).toBe(200);
    expect(data.identities).toEqual([]);
    expect(data.access_token).toBeUndefined();
  });

  test("a password shorter than the minimum length is rejected", async () => {
    const { status, data } = await anon.post("/auth/v1/signup", {
      email: `qa-weak-password-${Date.now()}@example.com`,
      password: "123",
    });

    expect(status).toBe(422);
    expect(data.error_code).toBe("weak_password");
    expect(data.msg).toBe("Password should be at least 6 characters.");
  });
});
