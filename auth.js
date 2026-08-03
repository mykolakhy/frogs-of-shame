import { supabase } from "./supabaseClient.js";

const authPanel = document.querySelector("#authPanel");
const authForm = document.querySelector("#authForm");
const emailInput = document.querySelector("#authEmail");
const passwordInput = document.querySelector("#authPassword");
const signUpButton = document.querySelector("#authSignUp");
const message = document.querySelector("#authMessage");
const sessionPanel = document.querySelector("#authSession");
const sessionEmail = document.querySelector("#authSessionEmail");
const logOutButton = document.querySelector("#authLogOut");

const showMessage = (text) => {
  message.textContent = text;
  message.hidden = !text;
};

const setSession = (session) => {
  const loggedIn = Boolean(session?.user);
  authForm.hidden = loggedIn;
  sessionPanel.hidden = !loggedIn;
  sessionEmail.textContent = loggedIn ? `Signed in as ${session.user.email}` : "";
  document.dispatchEvent(new CustomEvent("frog-auth-changed", { detail: { session } }));
};

if (!supabase) {
  authPanel.hidden = true;
} else {
  supabase.auth.getSession().then(({ data }) => setSession(data.session));
  supabase.auth.onAuthStateChange((_event, session) => setSession(session));

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value,
    });

    if (error) {
      showMessage(error.message);
    }
  });

  signUpButton.addEventListener("click", async () => {
    showMessage("");

    const { error } = await supabase.auth.signUp({
      email: emailInput.value,
      password: passwordInput.value,
    });

    showMessage(error ? error.message : "Check your email to confirm your account.");
  });

  logOutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
  });
}
