import { test, expect } from "../fixtures/test";

const testEmail = process.env.E2E_TEST_EMAIL ?? process.env.TESTS_USER_EMAIL;
const testPassword = process.env.E2E_TEST_PASSWORD ?? process.env.TESTS_USER_PASS;
const supabaseConfigured = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY);

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
