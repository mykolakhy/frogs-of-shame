import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { supabase } from "../../supabaseClient.js";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { SetNewPasswordForm } from "./SetNewPasswordForm";

export type AuthMode = "login" | "signup" | "forgot" | "reset";

type AuthModalProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
};

type AuthSubmission = {
  mode: AuthMode;
  email: string;
  password: string;
};

type SuccessVariant = "signup" | "forgot" | "reset-done" | null;

export function AuthModal({ mode, onModeChange, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successVariant, setSuccessVariant] = useState<SuccessVariant>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isCredentialsMode = mode === "login" || mode === "signup";
  const isSignUp = mode === "signup";

  const mutation = useMutation<unknown, Error, AuthSubmission>({
    mutationFn: async ({ mode: submissionMode, email: submissionEmail, password: submissionPassword }) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const response =
        submissionMode === "signup"
          ? await supabase.auth.signUp({ email: submissionEmail, password: submissionPassword })
          : await supabase.auth.signInWithPassword({ email: submissionEmail, password: submissionPassword });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
    onSuccess: (_data, variables) => {
      if (variables.mode === "signup") {
        setSuccessVariant("signup");
      }
    },
  });

  useEffect(() => {
    if (isCredentialsMode) {
      emailInput.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ).filter((element) => element.offsetParent !== null);

        if (focusableElements.length === 0) {
          return;
        }

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstFocusableElement) {
          event.preventDefault();
          lastFocusableElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
          event.preventDefault();
          firstFocusableElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // Intentionally only depends on onClose, not mode — this should focus
    // once per modal mount, not re-focus on every mode switch (matches the
    // existing login<->signup tab behavior). The isCredentialsMode check
    // above just guards against focusing a ref that isn't rendered when the
    // modal mounts straight into "reset" mode (PASSWORD_RECOVERY auto-open).
  }, [onClose]);

  const errorMessage = validationError ?? mutation.error?.message ?? "";

  const handleModeChange = (nextMode: AuthMode) => {
    mutation.reset();
    setValidationError(null);
    onModeChange(nextMode);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.reset();
    setValidationError(null);

    if (isSignUp && password !== confirmPassword) {
      setValidationError("Passwords don't match.");
      return;
    }

    mutation.mutate({ mode, email, password });
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const title =
    mode === "signup"
      ? "Create account"
      : mode === "forgot"
        ? "Reset your password"
        : mode === "reset"
          ? "Set a new password"
          : "Log in";

  const successHeading = successVariant === "reset-done" ? "All set" : "Check your email";
  const successMessage =
    successVariant === "signup"
      ? "Check your email to confirm your account."
      : successVariant === "forgot"
        ? "Check your email for a link to reset your password."
        : "Your password has been updated.";

  return createPortal(
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        id="authModal"
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authModalTitle"
        data-mode={mode}
        ref={dialogRef}
      >
        <button id="authModalClose" className="modal-close" type="button" aria-label="Close" onClick={onClose}>
          &times;
        </button>

        <div id="authModalForm" hidden={successVariant !== null}>
          <h2 id="authModalTitle">{title}</h2>

          {isCredentialsMode ? (
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                className="auth-tab"
                role="tab"
                aria-selected={mode === "login"}
                onClick={() => handleModeChange("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className="auth-tab"
                role="tab"
                aria-selected={mode === "signup"}
                onClick={() => handleModeChange("signup")}
              >
                Sign up
              </button>
            </div>
          ) : null}

          {isCredentialsMode ? (
            <form id="authForm" className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <span>Email</span>
                <input
                  ref={emailInput}
                  id="authEmail"
                  type="email"
                  autoComplete="email"
                  required
                  className={mutation.isError ? "invalid" : undefined}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="auth-field">
                <span>Password</span>
                <div className="password-wrap">
                  <input
                    id="authPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    minLength={6}
                    className={errorMessage ? "invalid" : undefined}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </div>
              </label>

              <p id="authPasswordHint" className="auth-hint" hidden={!isSignUp}>
                At least 6 characters
              </p>

              <label id="authConfirmField" className="auth-field" hidden={!isSignUp}>
                <span>Confirm password</span>
                <div className="password-wrap">
                  <input
                    id="authConfirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required={isSignUp}
                    minLength={6}
                    className={validationError ? "invalid" : undefined}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </div>
              </label>

              <div id="authForgotRow" className="auth-forgot-row" hidden={isSignUp}>
                <a
                  href="#"
                  id="authForgotLink"
                  onClick={(event) => {
                    event.preventDefault();
                    handleModeChange("forgot");
                  }}
                >
                  Forgot password?
                </a>
              </div>

              <p id="authError" className="auth-error" role="alert" hidden={!errorMessage}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9"></circle>
                  <line x1="12" y1="8" x2="12" y2="13"></line>
                  <line x1="12" y1="16" x2="12" y2="16.01"></line>
                </svg>
                <span id="authErrorText">{errorMessage}</span>
              </p>

              <button id="authSubmit" type="submit" className="auth-submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? isSignUp
                    ? "Creating account…"
                    : "Logging in…"
                  : isSignUp
                    ? "Create account"
                    : "Log in"}
              </button>
            </form>
          ) : null}

          {mode === "forgot" ? (
            <ForgotPasswordForm
              onSuccess={() => setSuccessVariant("forgot")}
              onBackToLogin={() => handleModeChange("login")}
            />
          ) : null}

          {mode === "reset" ? <SetNewPasswordForm onSuccess={() => setSuccessVariant("reset-done")} /> : null}

          {isCredentialsMode ? (
            <p className="auth-switch">
              <span id="authSwitchText">{isSignUp ? "Already have an account?" : "Don't have an account?"}</span>
              <button
                type="button"
                id="authSwitchLink"
                className="link-button"
                onClick={() => handleModeChange(isSignUp ? "login" : "signup")}
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          ) : null}
        </div>

        <div id="authModalSuccess" className="auth-success" hidden={successVariant === null}>
          <div className="auth-success-icon">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
          </div>
          <h2>{successHeading}</h2>
          <p>{successMessage}</p>
          <button id="authSuccessDone" type="button" className="auth-submit" onClick={onClose}>
            {successVariant === "reset-done" ? "Done" : "Got it"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
