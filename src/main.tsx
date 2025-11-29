import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { NotificationsProvider, notifyGlobal } from "./services/notifications";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ErrorType } from "@/constants/errorTypes";

// === React Query global error handler ===
const queryCache = new QueryCache({
  onError: (error: any) => {
    // This handler catches errors from all React Query operations globally.
    if (error?.type === ErrorType.NETWORK_ERROR) {
      notifyGlobal("error", "Network error — please check your connection.");
    } else if (error?.type === ErrorType.SERVER_ERROR) {
      notifyGlobal("error", "Server error — please try again later.");
    } else if (error?.type === ErrorType.UNAUTHORIZED) {
      notifyGlobal("warn", "Session expired. Please log in again.");
    } else if (error?.type === ErrorType.CLIENT_ERROR) {
      notifyGlobal("warn", error?.message || "Invalid request.");
    } else {
      notifyGlobal("error", "Unexpected error occurred. Please try again.");
    }
  },
});

const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.type === ErrorType.NETWORK_ERROR) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
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
