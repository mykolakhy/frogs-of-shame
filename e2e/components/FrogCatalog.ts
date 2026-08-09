import { expect, type Locator, type Page } from "@playwright/test";

export class FrogCatalog {
  readonly searchInput: Locator;
  readonly resultCount: Locator;
  readonly favoritesFilter: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByRole("searchbox", { name: "Search frogs" });
    this.resultCount = page.locator("#resultCount");
    this.favoritesFilter = page.getByRole("button", { name: "My Favorites" });
  }

  async waitUntilLoaded() {
    await expect(this.searchInput).toBeVisible();
    await expect(this.resultCount).toHaveText(/\d+ of \d+ frogs? shown/);
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.page.getByRole("button", { name: "Clear" }).click();
  }

  card(title: string) {
    return this.page.getByRole("article").filter({
      has: this.page.getByRole("heading", { name: title }),
    });
  }

  async expectCardVisible(title: string) {
    await expect(this.card(title)).toBeVisible();
  }
}
