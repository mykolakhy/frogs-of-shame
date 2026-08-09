import { expect, type Locator, type Page } from "@playwright/test";

export class AuthModal {
  readonly dialog: Locator;
  readonly session: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole("dialog");
    this.session = page.locator("#authSession");
  }

  async openLogin() {
    await this.page.locator("#openLogIn").click();
    await expect(this.dialog).toBeVisible();
  }

  async openSignup() {
    await this.page.locator("#openSignUp").click();
    await expect(this.dialog).toBeVisible();
    await expect(this.dialog.getByRole("heading", { name: "Create account" })).toBeVisible();
  }

  async switchToSignup() {
    await this.dialog.getByRole("tab", { name: "Sign up" }).click();
    await expect(this.dialog.getByRole("heading", { name: "Create account" })).toBeVisible();
  }

  async switchToLogin() {
    await this.dialog.getByRole("tab", { name: "Log in" }).click();
    await expect(this.dialog.getByRole("heading", { name: "Log in" })).toBeVisible();
  }

  async fillLogin(email: string, password: string) {
    await this.dialog.getByLabel("Email").fill(email);
    await this.dialog.locator("#authPassword").fill(password);
  }

  async fillSignup(email: string, password: string, confirmPassword: string) {
    await this.dialog.getByLabel("Email").fill(email);
    await this.dialog.locator("#authPassword").fill(password);
    await this.dialog.locator("#authConfirmPassword").fill(confirmPassword);
  }

  async submitSignup() {
    await this.dialog.getByRole("button", { name: "Create account" }).click();
  }

  async closeWithButton() {
    await this.dialog.getByRole("button", { name: "Close" }).click();
    await expect(this.dialog).toBeHidden();
  }

  async closeWithEscape() {
    await this.page.keyboard.press("Escape");
    await expect(this.dialog).toBeHidden();
  }

  async closeWithBackdrop() {
    await this.page.locator(".modal-overlay").click({ position: { x: 8, y: 8 } });
    await expect(this.dialog).toBeHidden();
  }

  async login(email: string, password: string) {
    await this.fillLogin(email, password);
    await this.dialog.getByRole("button", { name: "Log in" }).click();
    await expect(this.dialog).toBeHidden();
    await expect(this.session).toContainText(`Signed in as ${email}`);
  }
}
