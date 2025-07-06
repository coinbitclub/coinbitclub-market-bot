// src/auth/RequireAuth.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * @param { ReactNode } children 
 * @param { string[] } roles  — lista de roles permitidas, ex: ['admin']
 */
export default function RequireAuth({ children, roles = [] }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); // defina na hora do login

  if (!token) {
    // sem token → login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles.length > 0 && !roles.includes(userRole)) {
    // token existe mas role não autorizada → página não encontrada ou “Acesso negado”
    return <Navigate to="/" replace />;
  }
  return children;
}
