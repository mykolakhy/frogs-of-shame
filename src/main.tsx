import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { AuthWidget } from "./auth/AuthWidget";

const authRoot = document.getElementById("auth-root");

if (!authRoot) {
  throw new Error("Auth root element not found.");
}

const queryClient = new QueryClient();

createRoot(authRoot).render(
  <QueryClientProvider client={queryClient}>
    <AuthWidget />
  </QueryClientProvider>,
);
