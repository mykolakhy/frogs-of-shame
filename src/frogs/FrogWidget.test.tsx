// @vitest-environment jsdom
import type { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
