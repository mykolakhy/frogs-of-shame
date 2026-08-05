import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.js";
import { AuthModal, type AuthMode } from "./AuthModal";
import { useSupabaseSession } from "./useSupabaseSession";

export function AuthWidget() {
  const { session } = useSupabaseSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  useEffect(() => {
    if (session) {
      setIsModalOpen(false);
    }
  }, [session]);

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
