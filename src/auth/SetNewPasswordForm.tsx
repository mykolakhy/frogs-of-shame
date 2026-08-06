import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient.js";

type SetNewPasswordFormProps = {
  onSuccess: () => void;
};

export function SetNewPasswordForm({ onSuccess }: SetNewPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const passwordInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordInput.current?.focus();
  }, []);

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (newPassword) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }
    },
    onSuccess,
  });

  const errorMessage = validationError ?? mutation.error?.message ?? "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError("Passwords don't match.");
      return;
    }

    mutation.mutate(password);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span>New password</span>
        <div className="password-wrap">
          <input
            ref={passwordInput}
            id="authPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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

      <p className="auth-hint">At least 6 characters</p>

      <label className="auth-field">
        <span>Confirm new password</span>
        <div className="password-wrap">
          <input
            id="authConfirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
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
        {mutation.isPending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
