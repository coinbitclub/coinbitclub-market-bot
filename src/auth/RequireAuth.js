// src/auth/RequireAuth.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAuth = ({ children }) => {
  const isAuthenticated = Boolean(localStorage.getItem('authToken')); // Exemplo de verificação de autenticação

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default RequireAuth;
