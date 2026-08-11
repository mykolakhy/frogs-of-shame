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
    expect(trigger).toHaveFocus();
  });

  it("keeps keyboard focus within the modal actions", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Open details for Ancient Cursed Frog" }));
    const dialog = screen.getByRole("dialog", { name: "Ancient Cursed Frog" });
    const close = within(dialog).getByRole("button", { name: "Close" });
    const download = within(dialog).getByRole("link", { name: "Download PNG" });

    expect(close).toHaveFocus();
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
    expect(actions?.children[0]).toHaveAttribute("aria-label", "Close");
    expect(actions?.children[1]).toHaveAttribute("aria-label", "Add to favorites");
    expect(actions?.children[2]).toHaveAttribute("aria-label", "Download PNG");

    await user.click(within(dialog).getByRole("button", { name: "Add to favorites" }));

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Remove from favorites" })).toBeInTheDocument());
    expect(mockAddFavorite).toHaveBeenCalledWith("user-1", "ancient-cursed-frog");
    expect(screen.getByRole("dialog", { name: "Ancient Cursed Frog" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Remove from favorites" }));

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Add to favorites" })).toBeInTheDocument());
    expect(mockRemoveFavorite).toHaveBeenCalledWith("user-1", "ancient-cursed-frog");
  });
});
