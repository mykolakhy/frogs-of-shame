import { test, expect } from "../fixtures/test";

test.describe("frog catalog", () => {
  test("guest can search for a frog and clear the search", async ({ homePage }) => {
    await homePage.goto();

    await homePage.catalog.searchFor("cosmic");
    await homePage.catalog.expectCardVisible("Cosmic Frog");
    await expect(homePage.catalog.clearButton).toBeVisible();

    await homePage.catalog.clearSearch();
    await expect(homePage.catalog.clearButton).toBeHidden();
  });

  test("guest does not see authenticated favorites controls", async ({ homePage }) => {
    await homePage.goto();

    await expect(homePage.catalog.favoritesFilter).toBeHidden();
    await expect(homePage.page.getByRole("button", { name: "Add to favorites" })).toBeHidden();
  });

  test("guest can open frog details and download the original PNG", async ({ homePage }) => {
    const frogTitle = "Amazon Milk Frog";

    await homePage.goto();
    await homePage.catalog.openDetails(frogTitle);

    const modal = homePage.catalog.detailModal(frogTitle);
    await expect(modal.getByRole("heading", { name: frogTitle })).toBeVisible();
    await expect(homePage.catalog.detailImage(frogTitle)).toHaveAttribute(
      "src",
      "./assets/frogs/amazon_milk_frog.png",
    );
    await expect(modal.getByRole("list", { name: `${frogTitle} tags` })).toContainText("amazon");

    const downloadLink = homePage.catalog.detailDownload(frogTitle);
    await expect(downloadLink).toHaveAttribute("download", "amazon_milk_frog.png");
    await expect(downloadLink).not.toHaveAttribute("target");

    const [download] = await Promise.all([homePage.page.waitForEvent("download"), downloadLink.click()]);
    expect(download.suggestedFilename()).toBe("amazon_milk_frog.png");
  });

  test("frog detail modal is horizontally centered with aligned content", async ({ homePage }) => {
    const frogTitle = "Amazon Milk Frog";

    await homePage.goto();
    await homePage.catalog.openDetails(frogTitle);

    const modal = homePage.catalog.detailModal(frogTitle);
    const content = modal.locator(".frog-detail-modal-content");
    const header = modal.locator(".frog-detail-modal-header");
    const imageFrame = modal.locator(".frog-detail-modal-image");
    const image = homePage.catalog.detailImage(frogTitle);
    const actions = modal.locator(".frog-detail-modal-actions");
    const viewport = homePage.page.viewportSize();
    const modalBox = await modal.boundingBox();
    const contentBox = await content.boundingBox();
    const headerBox = await header.boundingBox();
    const imageFrameBox = await imageFrame.boundingBox();
    const imageBox = await image.boundingBox();
    const actionsBox = await actions.boundingBox();

    expect(viewport).not.toBeNull();
    expect(modalBox).not.toBeNull();
    expect(contentBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(imageFrameBox).not.toBeNull();
    expect(imageBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();

    expect(Math.abs((modalBox!.x + modalBox!.width / 2) - viewport!.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs((contentBox!.x + contentBox!.width / 2) - viewport!.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(headerBox!.x - imageFrameBox!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((imageBox!.x + imageBox!.width / 2) - (imageFrameBox!.x + imageFrameBox!.width / 2))).toBeLessThanOrEqual(1);
    expect(imageBox!.x + imageBox!.width).toBeLessThanOrEqual(actionsBox!.x);
  });

  test("frog detail modal closes with its button, Escape, and backdrop", async ({ homePage }) => {
    const frogTitle = "Amazon Milk Frog";

    await homePage.goto();
    await homePage.catalog.openDetails(frogTitle);
    await homePage.catalog.detailClose(frogTitle).click();
    await expect(homePage.catalog.detailModal(frogTitle)).toBeHidden();

    await homePage.catalog.openDetails(frogTitle);
    await homePage.page.keyboard.press("Escape");
    await expect(homePage.catalog.detailModal(frogTitle)).toBeHidden();

    await homePage.catalog.openDetails(frogTitle);
    await homePage.page.locator(".frog-detail-modal-backdrop").click({ position: { x: 8, y: 8 } });
    await expect(homePage.catalog.detailModal(frogTitle)).toBeHidden();
  });
});
