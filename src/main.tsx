import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { AuthWidget } from "./auth/AuthWidget";
import { FrogWidget } from "./frogs/FrogWidget";

const authRoot = document.getElementById("auth-root");
const frogsRoot = document.getElementById("frogs-root");

if (!authRoot || !frogsRoot) {
  throw new Error("Required app root element not found.");
}

const queryClient = new QueryClient();

createRoot(authRoot).render(
  <QueryClientProvider client={queryClient}>
    <AuthWidget />
  </QueryClientProvider>,
);

createRoot(frogsRoot).render(
  <QueryClientProvider client={queryClient}>
    <FrogWidget />
  </QueryClientProvider>,
);
