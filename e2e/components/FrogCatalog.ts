import { expect, type Locator, type Page } from "@playwright/test";

export class FrogCatalog {
  readonly searchInput: Locator;
  readonly resultCount: Locator;
  readonly favoritesFilter: Locator;
  readonly clearButton: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByRole("searchbox", { name: "Search frogs" });
    this.resultCount = page.locator("#resultCount");
    this.favoritesFilter = page.getByRole("button", { name: "My Favorites" });
    this.clearButton = page.locator("#clearSearch");
  }

  async waitUntilLoaded() {
    await expect(this.searchInput).toBeVisible();
    await expect(this.resultCount).toHaveText(/\d+ of \d+ frogs? shown/);
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.clearButton.click();
  }

  card(title: string) {
    return this.page.getByRole("article").filter({
      has: this.page.getByRole("heading", { name: title }),
    });
  }

  async expectCardVisible(title: string) {
    await expect(this.card(title)).toBeVisible();
  }

  async openDetails(title: string) {
    await this.card(title).getByRole("button", { name: `Open details for ${title}` }).click();
    await expect(this.detailModal(title)).toBeVisible();
  }

  detailModal(title: string) {
    return this.page.getByRole("dialog", { name: title });
  }

  detailImage(title: string) {
    return this.detailModal(title).getByRole("img", { name: title });
  }

  detailDownload(title: string) {
    return this.detailModal(title).getByRole("link", { name: "Download PNG" });
  }

  detailClose(title: string) {
    return this.detailModal(title).getByRole("button", { name: "Close" });
  }
}
