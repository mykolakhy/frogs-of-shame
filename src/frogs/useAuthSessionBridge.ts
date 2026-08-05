import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient.js";

type AuthChangedDetail = {
  session: Session | null;
};

export function useAuthSessionBridge() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (mounted) {
        setSession(nextSession);
      }
    };

    const handleAuthChanged = (event: Event) => {
      const { session: nextSession } = (event as CustomEvent<AuthChangedDetail>).detail;
      applySession(nextSession);
    };

    document.addEventListener("frog-auth-changed", handleAuthChanged);

    const authClient = supabase;
    if (authClient) {
      void authClient.auth
        .getSession()
        .then(({ data }) => applySession(data.session))
        .catch((error) => console.error(error));
    }

    return () => {
      mounted = false;
      document.removeEventListener("frog-auth-changed", handleAuthChanged);
    };
  }, []);

  return { session };
}
