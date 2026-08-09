import { test, expect } from "../fixtures/test";
import {
  deleteSupabaseUser,
  deleteSupabaseUserByEmail,
  hasSupabaseAdminCredentials,
} from "../../tests/support/services/supabaseAdmin";

const testEmail = process.env.E2E_TEST_EMAIL ?? process.env.TESTS_USER_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD ?? process.env.TESTS_USER_PASS;
const supabaseConfigured = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY);
const signupE2eEnabled = process.env.E2E_SIGNUP_TEST_ENABLED === "true";
const signupEmail = process.env.E2E_SIGNUP_EMAIL;

test.describe("authentication", () => {
  test.beforeEach(() => {
    test.skip(!supabaseConfigured, "Supabase environment variables are required for authentication E2E tests.");
  });

  test("registered user can log in and see favorites controls", async ({ homePage }) => {
    test.skip(!testEmail || !testPassword, "E2E test-user credentials are required for authenticated login.");

    await homePage.goto();
    await homePage.auth.openLogin();
    await homePage.auth.login(testEmail!, testPassword!);

    await expect(homePage.catalog.favoritesFilter).toBeVisible();
    await expect(homePage.page.getByRole("button", { name: "Add to favorites" }).first()).toBeVisible();
  });

  test("invalid credentials show an error without closing the login modal", async ({ homePage }) => {
    test.skip(!testEmail, "A test-user email is required for the invalid-login scenario.");

    await homePage.goto();
    await homePage.auth.openLogin();
    await homePage.auth.fillLogin(testEmail!, "definitely-not-the-password");
    await homePage.auth.dialog.getByRole("button", { name: "Log in" }).click();

    await expect(homePage.auth.dialog).toBeVisible();
    await expect(homePage.auth.dialog.getByRole("alert")).toContainText("Invalid login credentials");
  });

  test("opens both auth modes and switches between login and signup", async ({ homePage }) => {
    await homePage.goto();

    await homePage.auth.openLogin();
    await expect(homePage.auth.dialog.getByRole("heading", { name: "Log in" })).toBeVisible();
    await homePage.auth.closeWithButton();

    await homePage.auth.openSignup();
    await homePage.auth.switchToLogin();
    await homePage.auth.switchToSignup();
  });

  test("signup validation rejects mismatched passwords without creating a user", async ({ homePage }) => {
    await homePage.goto();
    let signupRequests = 0;
    homePage.page.on("request", (request) => {
      if (request.url().includes("/auth/v1/signup")) {
        signupRequests += 1;
      }
    });

    await homePage.auth.openSignup();
    await homePage.auth.fillSignup("e2e-validation@example.com", "password1", "password2");
    await homePage.auth.submitSignup();

    await expect(homePage.auth.dialog.getByRole("alert")).toHaveText("Passwords don't match.");
    await expect(homePage.auth.dialog).toBeVisible();
    expect(signupRequests).toBe(0);
  });

  test("new user can complete signup and the test user is deleted afterwards", async ({ homePage }) => {
    test.skip(
      !signupE2eEnabled,
      "Set E2E_SIGNUP_TEST_ENABLED=true after configuring a Supabase SMTP provider for disposable signup addresses.",
    );
    test.skip(
      !hasSupabaseAdminCredentials(),
      "SUPABASE_SECRET_KEY is required to clean up the signup test user.",
    );
    test.skip(
      !signupEmail,
      "E2E_SIGNUP_EMAIL must be a dedicated address authorized to receive Supabase confirmation emails.",
    );

    let createdUserId: string | undefined;

    try {
      await deleteSupabaseUserByEmail(signupEmail!);
      await homePage.goto();
      await homePage.auth.openSignup();
      await homePage.auth.fillSignup(signupEmail!, "password1", "password1");

      const signupResponsePromise = homePage.page.waitForResponse(
        (response) => response.url().includes("/auth/v1/signup") && response.request().method() === "POST",
      );
      await homePage.auth.submitSignup();

      const signupResponse = await signupResponsePromise;
      const signupBody = (await signupResponse.json()) as { id?: string; email?: string };
      createdUserId = signupBody.id;

      expect(signupResponse.ok(), JSON.stringify(signupBody)).toBe(true);
      expect(createdUserId, `Signup response: ${JSON.stringify(signupBody)}`).toEqual(expect.any(String));
      await expect(homePage.auth.dialog.getByRole("heading", { name: "Check your email" })).toBeVisible();
    } finally {
      if (createdUserId) {
        await deleteSupabaseUser(createdUserId);
      } else {
        await deleteSupabaseUserByEmail(signupEmail!);
      }
    }
  });

  test("closes the auth modal with the close button, Escape, and the backdrop", async ({ homePage }) => {
    await homePage.goto();

    await homePage.auth.openLogin();
    await homePage.auth.closeWithButton();

    await homePage.auth.openSignup();
    await homePage.auth.closeWithEscape();

    await homePage.auth.openLogin();
    await homePage.auth.closeWithBackdrop();
  });
});
