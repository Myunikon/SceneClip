import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppGuard } from "./components/AppGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./assets/main.css";
import "sonner/dist/styles.css";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppGuard>
        <App />
      </AppGuard>
    </ErrorBoundary>
  </React.StrictMode>,
);
