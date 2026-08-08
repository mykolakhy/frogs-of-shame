import { expect, type Locator, type Page } from "@playwright/test";

export class AuthModal {
  readonly dialog: Locator;
  readonly session: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole("dialog", { name: "Log in" });
    this.session = page.locator("#authSession");
  }

  async openLogin() {
    await this.page.locator("#openLogIn").click();
    await expect(this.dialog).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.dialog.getByLabel("Email").fill(email);
    await this.dialog.getByLabel("Password").fill(password);
    await this.dialog.getByRole("button", { name: "Log in" }).click();
    await expect(this.dialog).toBeHidden();
    await expect(this.session).toContainText(`Signed in as ${email}`);
  }
}
