import { describe, expect, test } from "vitest";
import { requireTestEnv, createAnonClient } from "./helpers/supabaseApi.js";
import { AuthApi } from "./helpers/authApi.js";

const { SUPABASE_URL, ANON_KEY, TEST_EMAIL, TEST_PASSWORD } = requireTestEnv();
const authApi = new AuthApi(createAnonClient(SUPABASE_URL, ANON_KEY));

// No service_role key is available to this suite (only the anon key + one
// dedicated test user), so there's no way to delete a user created via a real
// signup call afterward. The "successful signup" happy path is intentionally
// NOT covered here to avoid leaving orphaned accounts in the live Supabase
// project on every test run — only rejection paths, which never create a row.
describe("POST /auth/v1/token?grant_type=password", () => {
  test("valid credentials return a session for the matching user", async () => {
    const { status, data } = await authApi.login(TEST_EMAIL, TEST_PASSWORD);

    expect(status).toBe(200);
    expect(data.access_token).toEqual(expect.any(String));
    expect(data.user.email).toBe(TEST_EMAIL);
  });

  test("wrong password is rejected without a session", async () => {
    const { status, data } = await authApi.login(TEST_EMAIL, "definitely-not-the-password");

    expect(status).toBe(400);
    expect(data.error_code).toBe("invalid_credentials");
    expect(data.access_token).toBeUndefined();
  });

  test("unknown email is rejected with the same error as a wrong password (no account enumeration)", async () => {
    const { status, data } = await authApi.login(`no-such-user-${Date.now()}@example.com`, "whatever123");

    expect(status).toBe(400);
    expect(data.error_code).toBe("invalid_credentials");
  });
});

describe("POST /auth/v1/signup", () => {
  test("signing up with an already-registered email does not create a new identity", async () => {
    const { status, data } = await authApi.signUp(TEST_EMAIL, TEST_PASSWORD);

    // Supabase deliberately returns 200 with a user-shaped body here instead of
    // a "this email is taken" error, to avoid leaking which emails are
    // registered (account enumeration). The tell is an empty `identities`
    // array and no session — that's what distinguishes this from a real signup.
    expect(status).toBe(200);
    expect(data.identities).toEqual([]);
    expect(data.access_token).toBeUndefined();
  });

  test("a password shorter than the minimum length is rejected", async () => {
    const { status, data } = await authApi.signUp(`qa-weak-password-${Date.now()}@example.com`, "123");

    expect(status).toBe(422);
    expect(data.error_code).toBe("weak_password");
    expect(data.msg).toBe("Password should be at least 6 characters.");
  });
});
