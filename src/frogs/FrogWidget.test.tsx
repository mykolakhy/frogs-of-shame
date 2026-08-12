// @vitest-environment jsdom
import type { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const state = vi.hoisted(() => ({ session: null as Session | null }));
const mockGetFavoriteIds = vi.hoisted(() => vi.fn());
const mockAddFavorite = vi.hoisted(() => vi.fn());
const mockRemoveFavorite = vi.hoisted(() => vi.fn());

vi.mock("./useAuthSessionBridge", () => ({
  useAuthSessionBridge: () => ({ session: state.session }),
}));

vi.mock("../../favorites.js", () => ({
  getFavoriteIds: (...args: unknown[]) => mockGetFavoriteIds(...args),
  addFavorite: (...args: unknown[]) => mockAddFavorite(...args),
  removeFavorite: (...args: unknown[]) => mockRemoveFavorite(...args),
}));

const { FrogWidget } = await import("./FrogWidget");

const frogs = [
  {
    id: "ancient-cursed-frog",
    title: "Ancient Cursed Frog",
    file: "ancient-cursed-frog.png",
    description: "A dark cursed relic frog.",
    tags: ["ancient", "cursed"],
  },
];

function renderWidget() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <FrogWidget />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  state.session = null;
  window.history.replaceState({}, "", "/");
  mockGetFavoriteIds.mockResolvedValue(new Set<string>());
  mockAddFavorite.mockResolvedValue(undefined);
  mockRemoveFavorite.mockResolvedValue(undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => frogs,
    }),
  );
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  Reflect.deleteProperty(navigator, "clipboard");
  Reflect.deleteProperty(navigator, "share");
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("FrogWidget catalog controls", () => {
  it("hides favorites controls for guests and only shows Clear during an active search", async () => {
    const user = userEvent.setup();
    renderWidget();

    expect(await screen.findByRole("heading", { name: "Ancient Cursed Frog" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "My Favorites" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add to favorites" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Search frogs" }), "cursed");

    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("shows favorites controls only for authenticated users", async () => {
    state.session = { user: { id: "user-1" } } as Session;
    renderWidget();

    expect(await screen.findByRole("heading", { name: "Ancient Cursed Frog" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My Favorites" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to favorites" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

    await userEvent.setup().type(screen.getByRole("searchbox", { name: "Search frogs" }), "ancient");

    await waitFor(() => expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument());
  });
});

describe("FrogWidget frog detail modal", () => {
  it("opens the selected frog with its metadata and independent actions", async () => {
    const user = userEvent.setup();
    renderWidget();

    const trigger = await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });

    expect(dialog).toBeInTheDocument();
    expect(window.location.search).toBe("?frog=ancient-cursed-frog");
    expect(within(dialog).getByRole("img", { name: "Ancient Cursed Frog" })).toHaveAttribute(
      "src",
      "./assets/frogs/ancient-cursed-frog.png",
    );
    expect(within(dialog).getByRole("list", { name: "Ancient Cursed Frog tags" })).toHaveTextContent("ancient");
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
    expect(within(dialog).queryByRole("button", { name: "Add to favorites" })).not.toBeInTheDocument();

    const download = within(dialog).getByRole("link", { name: "Download PNG" });
    expect(download).toHaveAttribute("href", "./assets/frogs/ancient-cursed-frog.png");
    expect(download).toHaveAttribute("download", "ancient-cursed-frog.png");
    expect(download).not.toHaveAttribute("target");
  });

  it("closes from the close control and restores focus to the originating card", async () => {
    const user = userEvent.setup();
    renderWidget();

    const trigger = await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.search).toBe("");
    expect(trigger).toHaveFocus();
  });

  it("keeps keyboard focus within the modal actions", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });
    const close = within(dialog).getByRole("button", { name: "Close" });
    const share = within(dialog).getByRole("button", { name: "Share frog" });
    const download = within(dialog).getByRole("link", { name: "Download PNG" });

    expect(close).toHaveFocus();
    await user.tab();
    expect(share).toHaveFocus();
    await user.tab();
    expect(download).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
  });

  it("closes with Escape and does not close when the modal content is clicked", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });

    await user.click(dialog);
    expect(screen.getByRole("dialog", { name: "Ancient Cursed Frog" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the dimmed backdrop is clicked", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });

    fireEvent.click(dialog.parentElement!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the same modal behavior for authenticated visitors", async () => {
    state.session = { user: { id: "user-1" } } as Session;
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));

    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });

    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My Favorites" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Add to favorites" })).toBeInTheDocument();
  });

  it("places Favorites between Close and Download and toggles the selected frog", async () => {
    state.session = { user: { id: "user-1" } } as Session;
    const favoriteIds = new Set<string>();
    mockGetFavoriteIds.mockImplementation(async () => new Set(favoriteIds));
    mockAddFavorite.mockImplementation(async (_userId: string, frogId: string) => {
      favoriteIds.add(frogId);
    });
    mockRemoveFavorite.mockImplementation(async (_userId: string, frogId: string) => {
      favoriteIds.delete(frogId);
    });
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });
    const actions = dialog.querySelector(".frog-detail-modal-actions");

    expect(actions).not.toBeNull();
    expect(within(actions as HTMLElement).getByRole("button", { name: "Close" })).toHaveClass("frog-detail-modal-close");
    expect(within(actions as HTMLElement).getByRole("button", { name: "Add to favorites" })).toBeInTheDocument();
    expect(within(actions as HTMLElement).getByRole("button", { name: "Share frog" })).toBeInTheDocument();
    expect(within(actions as HTMLElement).getByRole("link", { name: "Download PNG" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Add to favorites" }));

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Remove from favorites" })).toBeInTheDocument());
    expect(mockAddFavorite).toHaveBeenCalledWith("user-1", "ancient-cursed-frog");
    expect(screen.getByRole("dialog", { name: "Ancient Cursed Frog" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Remove from favorites" }));

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Add to favorites" })).toBeInTheDocument());
    expect(mockRemoveFavorite).toHaveBeenCalledWith("user-1", "ancient-cursed-frog");
  });

  it("opens the share panel, copies the deep link, and restores focus on close", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    expect((globalThis.navigator as Navigator & { clipboard?: { writeText: typeof writeText } }).clipboard?.writeText).toBe(
      writeText,
    );
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });
    const share = within(dialog).getByRole("button", { name: "Share frog" });

    await user.click(share);

    const sharePanel = screen.getByRole("dialog", { name: "Share this frog" });
    expect(sharePanel).toBeInTheDocument();
    expect(within(sharePanel).queryByRole("button", { name: "Share..." })).not.toBeInTheDocument();
    expect(within(sharePanel).getByRole("button", { name: "Copy link" })).toHaveFocus();

    await user.click(within(sharePanel).getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/?frog=ancient-cursed-frog`);
    expect(within(sharePanel).getByRole("status")).toHaveTextContent("Link copied.");

    await user.click(within(sharePanel).getByRole("button", { name: "Close share panel" }));

    expect(screen.getByRole("dialog", { name: "Share this frog" })).toHaveClass("is-closing");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Share this frog" })).not.toBeInTheDocument());
    expect(within(dialog).getByRole("button", { name: "Share frog" })).toHaveFocus();
  });

  it("uses the native share API with the frog deep link when supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const mockedNavigator = Object.create(navigator);
    Object.defineProperty(mockedNavigator, "share", {
      configurable: true,
      value: share,
    });
    vi.stubGlobal("navigator", mockedNavigator);
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });
    await user.click(within(dialog).getByRole("button", { name: "Share frog" }));

    const sharePanel = screen.getByRole("dialog", { name: "Share this frog" });
    await user.click(within(sharePanel).getByRole("button", { name: "Share..." }));

    expect(share).toHaveBeenCalledWith({
      title: "Ancient Cursed Frog",
      text: "Check out Ancient Cursed Frog",
      url: `${window.location.origin}/?frog=ancient-cursed-frog`,
    });
  });

  it("closes the share panel from an outside click without closing the frog modal", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    const detailDialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });
    await user.click(within(detailDialog).getByRole("button", { name: "Share frog" }));

    expect(screen.getByRole("dialog", { name: "Share this frog" })).toBeInTheDocument();
    fireEvent.pointerDown(document.body);

    expect(screen.getByRole("dialog", { name: "Share this frog" })).toHaveClass("is-closing");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Share this frog" })).not.toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "Ancient Cursed Frog" })).toBeInTheDocument();
  });

  it("opens the selected frog from a valid deep link", async () => {
    window.history.replaceState({}, "", "/?frog=ancient-cursed-frog");
    renderWidget();

    const dialog = await screen.findByRole("dialog", { name: "Ancient Cursed Frog" });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Open details for Ancient Cursed Frog" })).not.toHaveFocus();
  });

  it("ignores an unknown frog deep link and keeps the catalog usable", async () => {
    window.history.replaceState({}, "", "/?frog=missing-frog");
    renderWidget();

    expect(await screen.findByRole("heading", { name: "Ancient Cursed Frog" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("closes the modal and restores the URL when browser Back is used", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    expect(window.location.search).toBe("?frog=ancient-cursed-frog");

    window.history.back();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(window.location.search).toBe("");
  });
});
