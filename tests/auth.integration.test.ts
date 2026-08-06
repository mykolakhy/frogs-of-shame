import { afterEach, describe, expect, test } from "vitest";
import { requireTestEnv } from "./helpers/supabaseApi.js";
import { supabase } from "../supabaseClient.js";

// Unlike auth.api.test.ts (raw HTTP against Supabase's REST/Auth API, any
// client's contract), this suite drives the actual @supabase/supabase-js
// client the app itself imports (supabaseClient.js), unmocked, against the
// live project — the same integration boundary TAF-5's unit tests mock out.
// It's the thing that would catch "the SDK call is wired up wrong" bugs that
// a mocked unit test structurally cannot.
const { TEST_EMAIL, TEST_PASSWORD } = requireTestEnv();

if (!supabase) {
  throw new Error(
    "supabaseClient.js returned no client — run tests via `npm test` so BWS secrets are injected " +
      "(see README's Secrets section).",
  );
}

// TS can't carry the null-check narrowing above into the test() closures
// below (same reason AuthWidget.tsx binds `authClient` locally) — so bind a
// non-null local once and use that everywhere instead of `supabase` directly.
const client = supabase;

afterEach(async () => {
  await client.auth.signOut();
});

describe("client.auth.signInWithPassword", () => {
  test("valid credentials return a session for the matching user", async () => {
    const { data, error } = await client.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(error).toBeNull();
    expect(data.session?.access_token).toEqual(expect.any(String));
    expect(data.user?.email).toBe(TEST_EMAIL);
  });

  test("wrong password returns an error and no session", async () => {
    const { data, error } = await client.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: "definitely-not-the-password",
    });

    expect(error?.code).toBe("invalid_credentials");
    expect(error?.status).toBe(400);
    expect(data.session).toBeNull();
    expect(data.user).toBeNull();
  });
});

describe("client.auth.signUp", () => {
  test("an already-registered email returns no session and no new identity", async () => {
    const { data, error } = await client.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    // Same anti-enumeration behavior verified at the REST layer in
    // auth.api.test.ts: no error, but an empty `identities` array and no
    // session distinguish this from a real signup.
    expect(error).toBeNull();
    expect(data.session).toBeNull();
    expect(data.user?.identities).toEqual([]);
  });
});

describe("client.auth.signOut", () => {
  test("clears the current session", async () => {
    await client.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const before = await client.auth.getSession();
    expect(before.data.session).not.toBeNull();

    const { error } = await client.auth.signOut();
    expect(error).toBeNull();

    const after = await client.auth.getSession();
    expect(after.data.session).toBeNull();
  });
});
