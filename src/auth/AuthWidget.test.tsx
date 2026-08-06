// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import "@testing-library/jest-dom/vitest";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();
const mockUnsubscribe = vi.fn();

type SupabaseMock = {
  auth: {
    getSession: typeof mockGetSession;
    onAuthStateChange: typeof mockOnAuthStateChange;
    signOut: typeof mockSignOut;
  };
} | null;

const state = vi.hoisted(() => ({ supabase: null as SupabaseMock }));

vi.mock("../../supabaseClient.js", () => ({
  get supabase() {
    return state.supabase;
  },
}));

const { AuthWidget } = await import("./AuthWidget");

const fakeSession = (id: string, email: string) => ({ user: { id, email } }) as unknown as Session;

let authCallback: ((event: string, session: Session | null) => void) | undefined;

function renderWidget() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthWidget />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
  mockSignOut.mockReset();
  mockUnsubscribe.mockReset();
  authCallback = undefined;

  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockOnAuthStateChange.mockImplementation((callback: (event: string, session: Session | null) => void) => {
    authCallback = callback;
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  });

  state.supabase = { auth: { getSession: mockGetSession, onAuthStateChange: mockOnAuthStateChange, signOut: mockSignOut } };
});

afterEach(() => {
  state.supabase = null;
  document.body.innerHTML = "";
});

describe("AuthWidget — no Supabase configured", () => {
  it("renders nothing", () => {
    state.supabase = null;
    const { container } = renderWidget();
    expect(container).toBeEmptyDOMElement();
  });
});

describe("AuthWidget — logged out", () => {
  it("shows the Log in / Sign up buttons", async () => {
    renderWidget();
    expect(await screen.findByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
  });
});

describe("AuthWidget — logged in", () => {
  it("shows the signed-in panel and logs out on click", async () => {
    const user = userEvent.setup();
    mockGetSession.mockResolvedValue({ data: { session: fakeSession("u1", "frog@example.com") } });

    renderWidget();

    expect(await screen.findByText("Signed in as frog@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

describe("AuthWidget — opening the modal", () => {
  it("opens on the Log in tab when the Log in button is clicked", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Log in" }));
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("opens on the Sign up tab when the Sign up button is clicked", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Sign up" }));
    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
  });
});

describe("AuthWidget — auto-close on login", () => {
  it("closes the modal once a session appears via onAuthStateChange", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(await screen.findByRole("button", { name: "Log in" }));
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();

    authCallback?.("SIGNED_IN", fakeSession("u1", "frog@example.com"));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Log in" })).not.toBeInTheDocument());
    expect(await screen.findByText("Signed in as frog@example.com")).toBeInTheDocument();
  });
});

describe("AuthWidget — password recovery", () => {
  it("force-opens the modal into the reset screen on a PASSWORD_RECOVERY event, even though the modal was closed and nothing was clicked", async () => {
    renderWidget();

    // Sanity check: modal genuinely starts closed, unlike the other tests
    // above which open it via a button click first.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    authCallback?.("PASSWORD_RECOVERY", fakeSession("u1", "recover@example.com"));

    expect(await screen.findByRole("heading", { name: "Set a new password" })).toBeInTheDocument();
  });

  it("does not close the reset screen the way a normal SIGNED_IN event would (the recovery-session guard)", async () => {
    renderWidget();

    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    authCallback?.("PASSWORD_RECOVERY", fakeSession("u1", "recover@example.com"));
    expect(await screen.findByRole("heading", { name: "Set a new password" })).toBeInTheDocument();

    // Give the auto-close-on-session effect a chance to run — if the guard in
    // AuthWidget were removed/broken, this is where the modal would
    // incorrectly disappear.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByRole("heading", { name: "Set a new password" })).toBeInTheDocument();
  });
});
