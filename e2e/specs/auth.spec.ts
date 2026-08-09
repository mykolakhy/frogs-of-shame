import { test, expect } from "../fixtures/test";

test.describe("authentication", () => {
  test("registered user can log in and see favorites controls", async ({ homePage }) => {
    const email = process.env.E2E_TEST_EMAIL ?? process.env.TESTS_USER_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD ?? process.env.TESTS_USER_PASS;

    test.skip(!email || !password, "E2E_TEST_EMAIL/E2E_TEST_PASSWORD or the shared test-user secrets are required.");

    await homePage.goto();
    await homePage.auth.openLogin();
    await homePage.auth.login(email!, password!);

    await expect(homePage.catalog.favoritesFilter).toBeVisible();
    await expect(homePage.page.getByRole("button", { name: "Add to favorites" }).first()).toBeVisible();
  });
});
