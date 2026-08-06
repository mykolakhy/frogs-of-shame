// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AuthMode } from "./AuthModal";
import "@testing-library/jest-dom/vitest";

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("../../supabaseClient.js", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

const { AuthModal } = await import("./AuthModal");

function renderModal(props: { initialMode?: AuthMode; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  const queryClient = new QueryClient();

  function Harness() {
    const [mode, setMode] = useState<AuthMode>(props.initialMode ?? "login");
    return <AuthModal mode={mode} onModeChange={setMode} onClose={onClose} />;
  }

  render(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  );

  return { onClose };
}

const emailInput = () => document.getElementById("authEmail") as HTMLInputElement;
const passwordInput = () => document.getElementById("authPassword") as HTMLInputElement;
const confirmPasswordInput = () => document.getElementById("authConfirmPassword") as HTMLInputElement;
const overlay = () => document.querySelector(".modal-overlay") as HTMLElement;

beforeEach(() => {
  mockSignUp.mockReset();
  mockSignInWithPassword.mockReset();
  mockResetPasswordForEmail.mockReset();
  mockUpdateUser.mockReset();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("AuthModal — sign up validation", () => {
  it("shows a mismatch error and never calls signUp when passwords differ", async () => {
    const user = userEvent.setup();
    renderModal({ initialMode: "signup" });

    await user.type(emailInput(), "frog@example.com");
    await user.type(passwordInput(), "password1");
    await user.type(confirmPasswordInput(), "password2");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

describe("AuthModal — tab switching", () => {
  it("switches title/fields and clears a previous error when changing tabs", async () => {
    const user = userEvent.setup();
    renderModal({ initialMode: "login" });

    mockSignInWithPassword.mockResolvedValue({ data: null, error: { message: "Invalid login credentials" } });
    await user.type(emailInput(), "frog@example.com");
    await user.type(passwordInput(), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Sign up" }));

    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
    expect(document.getElementById("authConfirmField")).not.toHaveAttribute("hidden");
    expect(document.getElementById("authPasswordHint")).not.toHaveAttribute("hidden");
    expect(document.getElementById("authForgotRow")).toHaveAttribute("hidden");
    expect(screen.queryByText("Invalid login credentials")).not.toBeInTheDocument();
  });
});

describe("AuthModal — closing", () => {
  it("calls onClose on Escape", () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the backdrop but not when clicking inside the panel", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(document.getElementById("authModal") as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();

    await user.click(overlay());
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("AuthModal — password visibility toggles", () => {
  it("flips password and confirm-password fields independently", async () => {
    const user = userEvent.setup();
    renderModal({ initialMode: "signup" });

    expect(passwordInput()).toHaveAttribute("type", "password");
    expect(confirmPasswordInput()).toHaveAttribute("type", "password");

    await user.click(screen.getAllByRole("button", { name: "Show password" })[0]);
    expect(passwordInput()).toHaveAttribute("type", "text");
    expect(confirmPasswordInput()).toHaveAttribute("type", "password");

    await user.click(screen.getAllByRole("button", { name: "Show password" })[0]);
    expect(confirmPasswordInput()).toHaveAttribute("type", "text");
    expect(passwordInput()).toHaveAttribute("type", "text");
  });
});

describe("AuthModal — submit outcomes", () => {
  it("shows the success screen after a successful sign up", async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ data: {}, error: null });
    renderModal({ initialMode: "signup" });

    await user.type(emailInput(), "frog@example.com");
    await user.type(passwordInput(), "password1");
    await user.type(confirmPasswordInput(), "password1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(mockSignUp).toHaveBeenCalledWith({ email: "frog@example.com", password: "password1" });
  });

  it("shows the server error message and re-enables submit after a failed login", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({ data: null, error: { message: "Invalid login credentials" } });
    renderModal({ initialMode: "login" });

    await user.type(emailInput(), "frog@example.com");
    await user.type(passwordInput(), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    const errorText = await screen.findByText("Invalid login credentials");
    expect(errorText.closest("#authError")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("button", { name: "Log in" })).not.toBeDisabled());
  });
});

describe("AuthModal — forgot password", () => {
  it("switches to the forgot-password screen and back via 'Back to log in'", async () => {
    const user = userEvent.setup();
    renderModal({ initialMode: "login" });

    await user.click(screen.getByRole("link", { name: "Forgot password?" }));

    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to log in" }));
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("submits the typed email with the expected redirectTo and shows forgot-specific success copy", async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    renderModal({ initialMode: "forgot" });

    await user.type(emailInput(), "frog@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("frog@example.com", {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    expect(await screen.findByText("Check your email for a link to reset your password.")).toBeInTheDocument();
    // Distinguishing from signup's copy is the point of this assertion — a
    // regression that reused signup's success text would still pass a looser
    // "some success text shows up" check.
    expect(screen.queryByText("Check your email to confirm your account.")).not.toBeInTheDocument();
  });

  it("renders a resetPasswordForEmail error via #authError", async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: { message: "Something went wrong" } });
    renderModal({ initialMode: "forgot" });

    await user.type(emailInput(), "frog@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    const errorText = await screen.findByText("Something went wrong");
    expect(errorText.closest("#authError")).toBeInTheDocument();
  });
});

describe("AuthModal — set new password", () => {
  it("blocks submit on mismatched passwords and never calls updateUser", async () => {
    const user = userEvent.setup();
    renderModal({ initialMode: "reset" });

    await user.type(passwordInput(), "password1");
    await user.type(confirmPasswordInput(), "password2");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows the reset-done screen on success, and 'Done' closes the modal", async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
    const { onClose } = renderModal({ initialMode: "reset" });

    await user.type(passwordInput(), "newpassword1");
    await user.type(confirmPasswordInput(), "newpassword1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword1" });
    expect(await screen.findByText("Your password has been updated.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders an updateUser error via #authError", async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({ data: null, error: { message: "Auth session missing!" } });
    renderModal({ initialMode: "reset" });

    await user.type(passwordInput(), "newpassword1");
    await user.type(confirmPasswordInput(), "newpassword1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    const errorText = await screen.findByText("Auth session missing!");
    expect(errorText.closest("#authError")).toBeInTheDocument();
  });
});
