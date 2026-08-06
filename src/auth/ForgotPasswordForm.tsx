import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient.js";

type ForgotPasswordFormProps = {
  onSuccess: () => void;
  onBackToLogin: () => void;
};

export function ForgotPasswordForm({ onSuccess, onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const emailInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInput.current?.focus();
  }, []);

  const mutation = useMutation<void, Error, string>({
    mutationFn: async (submittedEmail) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      // origin + pathname (not .href) so a stale hash/query from a previous
      // recovery attempt never gets carried into the new reset link.
      const { error } = await supabase.auth.resetPasswordForEmail(submittedEmail, {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(email);
  };

  const errorMessage = mutation.error?.message ?? "";

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span>Email</span>
        <input
          ref={emailInput}
          id="authEmail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
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
        {mutation.isPending ? "Sending…" : "Send reset link"}
      </button>

      <p className="auth-switch">
        <button type="button" className="link-button" onClick={onBackToLogin}>
          Back to log in
        </button>
      </p>
    </form>
  );
}
