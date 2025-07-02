import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, admin, children }) {
  if (typeof user !== "undefined" && !user) {
    return <Navigate to="/login" replace />;
  }
  if (typeof admin !== "undefined" && !admin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
