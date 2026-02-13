import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from "./lib/queryClient";
import { AppGuard } from "./components/providers/AppGuard";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./assets/main.css";
import "./lib/i18n";
import "sonner/dist/styles.css";

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppGuard>
          <RouterProvider router={router} />
        </AppGuard>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

