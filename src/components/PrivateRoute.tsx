// path: neelgar-society-react/src/components/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PrivateRoute: renders children if authenticated.
 * - If still initializing (rehydrating / refresh attempt), render null (or spinner).
 * - If unauthenticated after init, redirect to /login.
 */

export default function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    // You can replace this with a spinner component if you have one:
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
