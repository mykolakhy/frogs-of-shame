import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient.js";

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [event, setEvent] = useState<AuthChangeEvent | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const applySession = (nextEvent: AuthChangeEvent | null, nextSession: Session | null) => {
      setEvent(nextEvent);
      setSession(nextSession);
      document.dispatchEvent(new CustomEvent("frog-auth-changed", { detail: { session: nextSession } }));
    };

    // Initial hydration isn't a real auth event, so it's passed as null —
    // otherwise it could be mistaken for something like PASSWORD_RECOVERY
    // by code reacting to `event`.
    supabase.auth.getSession().then(({ data }) => applySession(null, data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((nextEvent, nextSession) =>
      applySession(nextEvent, nextSession),
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, event };
}
