import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient.js";

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const applySession = (session: Session | null) => {
      setSession(session);
      document.dispatchEvent(new CustomEvent("frog-auth-changed", { detail: { session } }));
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session };
}
