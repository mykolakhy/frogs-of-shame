import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { supabase } from "../../supabaseClient.js";

export type AuthMode = "login" | "signup";

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

export function AuthModal({ mode, onModeChange, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const emailInput = useRef<HTMLInputElement>(null);

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
        setShowSuccessScreen(true);
      }
    },
  });

  useEffect(() => {
    emailInput.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isSignUp = mode === "signup";
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

  return createPortal(
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        id="authModal"
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authModalTitle"
        data-mode={mode}
      >
        <button id="authModalClose" className="modal-close" type="button" aria-label="Close" onClick={onClose}>
          &times;
        </button>

        <div id="authModalForm" hidden={showSuccessScreen}>
          <h2 id="authModalTitle">{isSignUp ? "Create account" : "Log in"}</h2>

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

          <form id="authForm" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input
                id="authEmail"
                type="email"
                autoComplete="email"
                required
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
              <a href="#" id="authForgotLink" onClick={(event) => event.preventDefault()}>
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
              {mutation.isPending ? (isSignUp ? "Creating account…" : "Logging in…") : isSignUp ? "Create account" : "Log in"}
            </button>
          </form>

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
        </div>

        <div id="authModalSuccess" className="auth-success" hidden={!showSuccessScreen}>
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
          <h2>Check your email</h2>
          <p>Check your email to confirm your account.</p>
          <button id="authSuccessDone" type="button" className="auth-submit" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
