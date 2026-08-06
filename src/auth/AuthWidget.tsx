import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.js";
import { AuthModal, type AuthMode } from "./AuthModal";
import { useSupabaseSession } from "./useSupabaseSession";

export function AuthWidget() {
  const { session, event } = useSupabaseSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  // A PASSWORD_RECOVERY event forces the modal open into the "set new
  // password" screen, even if it was closed and even though the user didn't
  // click anything — this is how the emailed reset link's redirect back to
  // the site is handled.
  useEffect(() => {
    if (event === "PASSWORD_RECOVERY") {
      setMode("reset");
      setIsModalOpen(true);
    }
  }, [event]);

  // Recovery also produces a truthy `session` (Supabase issues a real,
  // short-lived session so updateUser() can be called), which would
  // otherwise trip this close-on-session effect and slam the reset screen
  // shut the instant it opens. Gate on `event`, not `mode` — gating on mode
  // would create a same-render ordering dependency between this effect and
  // the one above (which one sets mode first). Gating on event is
  // self-contained regardless of effect order. Don't remove this guard
  // without understanding why — it's load-bearing for the reset flow.
  useEffect(() => {
    if (session && event !== "PASSWORD_RECOVERY") {
      setIsModalOpen(false);
    }
  }, [session, event]);

  const openModal = useCallback((nextMode: AuthMode) => {
    setMode(nextMode);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  if (!supabase) {
    return null;
  }

  const authClient = supabase;
  if (!authClient) {
    return null;
  }

  const signedInSession = session?.user ? session : null;

  return (
    <>
      <section className="auth-panel" aria-label="Account">
        {signedInSession ? (
          <div id="authSession" className="auth-session">
            <span id="authSessionEmail">Signed in as {signedInSession.user.email ?? ""}</span>
            <button id="authLogOut" type="button" onClick={() => void authClient.auth.signOut()}>
              Log out
            </button>
          </div>
        ) : (
          <div id="authHeaderButtons" className="auth-header-buttons">
            <button id="openLogIn" type="button" onClick={() => openModal("login")}>
              Log in
            </button>
            <button id="openSignUp" type="button" className="auth-cta" onClick={() => openModal("signup")}>
              Sign up
            </button>
          </div>
        )}
      </section>

      {isModalOpen ? <AuthModal mode={mode} onModeChange={setMode} onClose={closeModal} /> : null}
    </>
  );
}
