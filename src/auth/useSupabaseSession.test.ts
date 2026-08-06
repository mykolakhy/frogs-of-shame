// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();

type SupabaseMock = {
  auth: {
    getSession: typeof mockGetSession;
    onAuthStateChange: typeof mockOnAuthStateChange;
  };
} | null;

const state = vi.hoisted(() => ({ supabase: null as SupabaseMock }));

vi.mock("../../supabaseClient.js", () => ({
  get supabase() {
    return state.supabase;
  },
}));

const { useSupabaseSession } = await import("./useSupabaseSession");

const fakeSession = (id: string, email: string) => ({ user: { id, email } }) as unknown as Session;

describe("useSupabaseSession", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockUnsubscribe.mockReset();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } });
    state.supabase = { auth: { getSession: mockGetSession, onAuthStateChange: mockOnAuthStateChange } };
  });

  afterEach(() => {
    state.supabase = null;
  });

  it("calls getSession once and subscribes via onAuthStateChange on mount", async () => {
    renderHook(() => useSupabaseSession());

    await waitFor(() => expect(mockGetSession).toHaveBeenCalledTimes(1));
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("dispatches frog-auth-changed with the session from the initial getSession resolution", async () => {
    const session = fakeSession("u1", "a@b.com");
    mockGetSession.mockResolvedValue({ data: { session } });

    const handler = vi.fn();
    document.addEventListener("frog-auth-changed", handler);

    renderHook(() => useSupabaseSession());

    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({ session });

    document.removeEventListener("frog-auth-changed", handler);
  });

  it("dispatches frog-auth-changed when onAuthStateChange fires", async () => {
    let authCallback: ((event: string, session: Session | null) => void) | undefined;
    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: Session | null) => void) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const handler = vi.fn();
    document.addEventListener("frog-auth-changed", handler);

    renderHook(() => useSupabaseSession());
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());

    handler.mockClear();
    const newSession = fakeSession("u2", "c@d.com");
    authCallback?.("SIGNED_IN", newSession);

    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({ session: newSession });

    document.removeEventListener("frog-auth-changed", handler);
  });

  it("exposes the PASSWORD_RECOVERY event type when onAuthStateChange fires with it", async () => {
    let authCallback: ((event: string, session: Session | null) => void) | undefined;
    mockOnAuthStateChange.mockImplementation((callback: (event: string, session: Session | null) => void) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    const { result } = renderHook(() => useSupabaseSession());
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());

    expect(result.current.event).toBeNull();

    const recoverySession = fakeSession("u3", "recover@example.com");
    authCallback?.("PASSWORD_RECOVERY", recoverySession);

    await waitFor(() => expect(result.current.event).toBe("PASSWORD_RECOVERY"));
    expect(result.current.session).toEqual(recoverySession);
  });

  it("unsubscribes from the auth listener on unmount", async () => {
    const { unmount } = renderHook(() => useSupabaseSession());

    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe("useSupabaseSession when Supabase isn't configured", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    state.supabase = null;
  });

  it("never calls Supabase or dispatches frog-auth-changed", async () => {
    const handler = vi.fn();
    document.addEventListener("frog-auth-changed", handler);

    renderHook(() => useSupabaseSession());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockOnAuthStateChange).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();

    document.removeEventListener("frog-auth-changed", handler);
  });
});
