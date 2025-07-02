import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Historico from "./pages/Historico";
import Financeiro from "./pages/Financeiro";
import Planos from "./pages/Planos";
import ApiKeys from "./pages/ApiKeys";
import Ajuda from "./pages/Ajuda";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminAfiliados from "./pages/admin/AdminAfiliados";
import AdminOperacoes from "./pages/admin/AdminOperacoes";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminRelatoriosIa from "./pages/admin/AdminRelatoriosIa";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, admin } = useAuth();

  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />

      {/* Área do usuário */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/app" element={
        <ProtectedRoute user={user}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/app/historico" element={
        <ProtectedRoute user={user}>
          <Historico />
        </ProtectedRoute>
      } />
      <Route path="/app/financeiro" element={
        <ProtectedRoute user={user}>
          <Financeiro />
        </ProtectedRoute>
      } />
      <Route path="/app/planos" element={
        <ProtectedRoute user={user}>
          <Planos />
        </ProtectedRoute>
      } />
      <Route path="/app/api-keys" element={
        <ProtectedRoute user={user}>
          <ApiKeys />
        </ProtectedRoute>
      } />
      <Route path="/app/ajuda" element={
        <ProtectedRoute user={user}>
          <Ajuda />
        </ProtectedRoute>
      } />

      {/* Área de administração */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute admin={admin}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/usuarios" element={
        <ProtectedRoute admin={admin}>
          <AdminUsuarios />
        </ProtectedRoute>
      } />
      <Route path="/admin/afiliados" element={
        <ProtectedRoute admin={admin}>
          <AdminAfiliados />
        </ProtectedRoute>
      } />
      <Route path="/admin/operacoes" element={
        <ProtectedRoute admin={admin}>
          <AdminOperacoes />
        </ProtectedRoute>
      } />
      <Route path="/admin/financeiro" element={
        <ProtectedRoute admin={admin}>
          <AdminFinanceiro />
        </ProtectedRoute>
      } />
      <Route path="/admin/logs" element={
        <ProtectedRoute admin={admin}>
          <AdminLogs />
        </ProtectedRoute>
      } />
      <Route path="/admin/relatorios-ia" element={
        <ProtectedRoute admin={admin}>
          <AdminRelatoriosIa />
        </ProtectedRoute>
      } />

      {/* Redirecionamento padrão */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
