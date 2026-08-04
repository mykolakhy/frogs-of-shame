import { supabase } from "./supabaseClient.js";

const authPanel = document.querySelector("#authPanel");
const openLogInButton = document.querySelector("#openLogIn");
const openSignUpButton = document.querySelector("#openSignUp");
const sessionPanel = document.querySelector("#authSession");
const sessionEmail = document.querySelector("#authSessionEmail");
const logOutButton = document.querySelector("#authLogOut");

const overlay = document.querySelector("#authModalOverlay");
const modal = document.querySelector("#authModal");
const modalClose = document.querySelector("#authModalClose");
const modalForm = document.querySelector("#authModalForm");
const modalSuccess = document.querySelector("#authModalSuccess");
const modalTitle = document.querySelector("#authModalTitle");
const tabs = document.querySelectorAll(".auth-tab");
const form = document.querySelector("#authForm");
const emailInput = document.querySelector("#authEmail");
const passwordInput = document.querySelector("#authPassword");
const passwordHint = document.querySelector("#authPasswordHint");
const confirmField = document.querySelector("#authConfirmField");
const confirmInput = document.querySelector("#authConfirmPassword");
const forgotRow = document.querySelector("#authForgotRow");
const forgotLink = document.querySelector("#authForgotLink");
const errorBox = document.querySelector("#authError");
const errorText = document.querySelector("#authErrorText");
const submitButton = document.querySelector("#authSubmit");
const switchText = document.querySelector("#authSwitchText");
const switchLink = document.querySelector("#authSwitchLink");
const successDone = document.querySelector("#authSuccessDone");

const showError = (text) => {
  errorText.textContent = text;
  errorBox.hidden = !text;
};

const setMode = (mode) => {
  modal.dataset.mode = mode;
  tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.mode === mode)));

  const isSignUp = mode === "signup";
  modalTitle.textContent = isSignUp ? "Create account" : "Log in";
  confirmField.hidden = !isSignUp;
  confirmInput.required = isSignUp;
  passwordHint.hidden = !isSignUp;
  forgotRow.hidden = isSignUp;
  submitButton.textContent = isSignUp ? "Create account" : "Log in";
  switchText.textContent = isSignUp ? "Already have an account?" : "Don't have an account?";
  switchLink.textContent = isSignUp ? "Log in" : "Sign up";

  showError("");
};

const openModal = (mode) => {
  form.reset();
  modalForm.hidden = false;
  modalSuccess.hidden = true;
  setMode(mode);
  overlay.hidden = false;
  emailInput.focus();
};

const closeModal = () => {
  overlay.hidden = true;
};

const showSuccess = () => {
  modalForm.hidden = true;
  modalSuccess.hidden = false;
};

const setSession = (session) => {
  const loggedIn = Boolean(session?.user);
  authPanel.hidden = loggedIn;
  sessionPanel.hidden = !loggedIn;
  sessionEmail.textContent = loggedIn ? `Signed in as ${session.user.email}` : "";
  if (loggedIn) {
    closeModal();
  }
  document.dispatchEvent(new CustomEvent("frog-auth-changed", { detail: { session } }));
};

if (!supabase) {
  authPanel.hidden = true;
} else {
  supabase.auth.getSession().then(({ data }) => setSession(data.session));
  supabase.auth.onAuthStateChange((_event, session) => setSession(session));

  openLogInButton.addEventListener("click", () => openModal("login"));
  openSignUpButton.addEventListener("click", () => openModal("signup"));
  modalClose.addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      closeModal();
    }
  });

  tabs.forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
  switchLink.addEventListener("click", () => setMode(modal.dataset.mode === "login" ? "signup" : "login"));
  forgotLink.addEventListener("click", (event) => event.preventDefault());
  successDone.addEventListener("click", closeModal);

  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const target = document.getElementById(toggle.dataset.target);
      target.type = target.type === "password" ? "text" : "password";
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showError("");

    const mode = modal.dataset.mode;

    if (mode === "signup" && passwordInput.value !== confirmInput.value) {
      showError("Passwords don't match.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = mode === "signup" ? "Creating account…" : "Logging in…";

    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email: emailInput.value, password: passwordInput.value })
        : await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });

    submitButton.disabled = false;
    submitButton.textContent = mode === "signup" ? "Create account" : "Log in";

    if (error) {
      showError(error.message);
      return;
    }

    if (mode === "signup") {
      showSuccess();
    }
  });

  logOutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
  });
}
