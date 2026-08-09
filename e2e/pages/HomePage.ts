import type { Page } from "@playwright/test";
import { AuthModal } from "../components/AuthModal";
import { FrogCatalog } from "../components/FrogCatalog";

export class HomePage {
  readonly auth: AuthModal;
  readonly catalog: FrogCatalog;

  constructor(readonly page: Page) {
    this.auth = new AuthModal(page);
    this.catalog = new FrogCatalog(page);
  }

  async goto() {
    await this.page.goto("/");
    await this.catalog.waitUntilLoaded();
  }
}
