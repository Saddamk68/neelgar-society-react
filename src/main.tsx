import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationsProvider } from "./services/notifications";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry only once, and skip retry on network errors
      retry: (failureCount, error: any) => {
        if (error?.type === "NETWORK_ERROR") return false;
        return failureCount < 1; // one retry max
      },
      refetchOnWindowFocus: false, // optional - prevents reloading on tab focus
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationsProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </NotificationsProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
