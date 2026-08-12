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

  test("guest can edit captions and download a captioned PNG", async ({ homePage }) => {
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
    await expect(homePage.catalog.detailShare(frogTitle)).toBeVisible();

    await modal.getByRole("button", { name: "Open caption editor" }).click();
    await modal.getByRole("textbox", { name: "Caption top" }).fill("TOP FROG");
    await modal.getByRole("textbox", { name: "Caption bottom" }).fill("BOTTOM FROG");
    await expect(modal.locator(".frog-caption-top")).toHaveText("TOP FROG");
    await expect(modal.locator(".frog-caption-bottom")).toHaveText("BOTTOM FROG");

    const [download] = await Promise.all([
      homePage.page.waitForEvent("download"),
      homePage.catalog.detailDownload(frogTitle).click(),
    ]);
    expect(download.suggestedFilename()).toBe("amazon_milk_frog-captioned.png");
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

  test("guest can open the share panel and copy the frog deep link", async ({ homePage }) => {
    const frogTitle = "Amazon Milk Frog";

    await homePage.goto();
    await homePage.catalog.openDetails(frogTitle);
    await homePage.catalog.detailShare(frogTitle).click();

    await expect(homePage.catalog.sharePanel()).toBeVisible();
    await homePage.page.context().grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(homePage.page.url()).origin,
    });
    await homePage.catalog.shareCopyLink().click();
    await expect(homePage.catalog.sharePanel().getByRole("status")).toHaveText("Link copied.");
    await expect(homePage.page).toHaveURL(/\?frog=amazon-milk$/);
  });

  test("mobile modal keeps Close in the header and overlays Share above the action row", async ({ homePage }) => {
    const frogTitle = "Amazon Milk Frog";
    await homePage.page.setViewportSize({ width: 390, height: 844 });
    await homePage.goto();
    await homePage.catalog.openDetails(frogTitle);

    const modal = homePage.catalog.detailModal(frogTitle);
    const header = modal.locator(".frog-detail-modal-header");
    const image = modal.locator(".frog-detail-modal-image");
    const workspace = modal.locator(".frog-detail-modal-workspace");
    const actions = modal.locator(".frog-detail-modal-actions");
    const close = homePage.catalog.detailClose(frogTitle);
    const share = homePage.catalog.detailShare(frogTitle);
    const [headerBox, imageBox, workspaceBox, actionsBox, closeBox, shareBox] = await Promise.all([
      header.boundingBox(),
      image.boundingBox(),
      workspace.boundingBox(),
      actions.boundingBox(),
      close.boundingBox(),
      share.boundingBox(),
    ]);

    expect(headerBox).not.toBeNull();
    expect(imageBox).not.toBeNull();
    expect(workspaceBox).not.toBeNull();
    expect(actionsBox).not.toBeNull();
    expect(closeBox).not.toBeNull();
    expect(shareBox).not.toBeNull();
    expect(closeBox!.y).toBeLessThan(imageBox!.y);
    expect(closeBox!.x).toBeGreaterThan(headerBox!.x + headerBox!.width / 2);
    expect(actionsBox!.y).toBeGreaterThanOrEqual(imageBox!.y + imageBox!.height);
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
    expect(shareBox!.width).toBeGreaterThanOrEqual(44);

    await share.click();
    const panelBox = await homePage.catalog.sharePanel().boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(shareBox!.y);
    expect(panelBox!.y).toBeLessThan(workspaceBox!.y + workspaceBox!.height);
  });

  test("valid frog deep link opens the matching modal and Back closes it", async ({ homePage }) => {
    await homePage.page.goto("/?frog=amazon-milk");
    await homePage.catalog.waitUntilLoaded();

    await expect(homePage.catalog.detailModal("Amazon Milk Frog")).toBeVisible();
    await expect(homePage.page).toHaveURL(/\?frog=amazon-milk$/);

    await homePage.goto();
    await homePage.catalog.openDetails("Amazon Milk Frog");
    await homePage.page.goBack();
    await expect(homePage.catalog.detailModal("Amazon Milk Frog")).toBeHidden();
    await expect(homePage.page).toHaveURL(/\/$/);
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
