import { test, expect } from "../fixtures/test";

test.describe("frog catalog", () => {
  test("guest can search for a frog and clear the search", async ({ homePage }) => {
    await homePage.goto();

    await homePage.catalog.searchFor("cosmic");
    await homePage.catalog.expectCardVisible("Cosmic Frog");
    await expect(homePage.page.getByRole("button", { name: "Clear" })).toBeVisible();

    await homePage.catalog.clearSearch();
    await expect(homePage.page.getByRole("button", { name: "Clear" })).toBeHidden();
  });

  test("guest does not see authenticated favorites controls", async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.catalog.favoritesFilter).toBeHidden();
    await expect(homePage.page.getByRole("button", { name: "Add to favorites" })).toBeHidden();
  });
});
