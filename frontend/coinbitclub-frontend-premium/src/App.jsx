import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";

// Páginas públicas
import Landing from "./pages/Landing";
import Plans from "./pages/Plans";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import MaintenanceMode from "./pages/MaintenanceMode";
import SupportCenter from "./pages/SupportCenter";
import HelpCenter from "./pages/HelpCenter";
import UpdateLogs from "./pages/UpdateLogs";

// Páginas do usuário
import DashboardUser from "./pages/DashboardUser";
import Operations from "./pages/Operations";
import Profile from "./pages/Profile";
import FinancialHistory from "./pages/FinancialHistory";
import TradeDetails from "./pages/TradeDetails";
import UserSettings from "./pages/UserSettings";
import PerformanceReport from "./pages/PerformanceReport";
import DataExport from "./pages/DataExport";
import RiskManagement from "./pages/RiskManagement";
import UserRanking from "./pages/UserRanking";
import TradeChart from "./pages/TradeChart";
import ApiKeys from "./pages/ApiKeys";
import Integrations from "./pages/Integrations";
import Alerts from "./pages/Alerts";
import WithdrawHistory from "./pages/WithdrawHistory";
import Billing from "./pages/Billing";
import UserActivity from "./pages/UserActivity";
import InviteFriends from "./pages/InviteFriends";
import OpenAIConsole from "./pages/OpenAIConsole";
import TradingSettings from "./pages/TradingSettings";
import WithdrawalRequest from "./pages/WithdrawalRequest";

// Páginas admin
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AffiliateReport from "./pages/AffiliateReport";
import AuditLogs from "./pages/AuditLogs";
import LoginHistory from "./pages/LoginHistory";
import CommissionSettings from "./pages/CommissionSettings";
import PlanManager from "./pages/PlanManager";
import AffiliatesPayouts from "./pages/AffiliatesPayouts";
import IntegrationsApproval from "./pages/IntegrationsApproval";

// Páginas afiliado
import AffiliateDashboard from "./pages/AffiliateDashboard";

function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/planos" element={<Plans />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/suporte" element={<SupportCenter />} />
          <Route path="/ajuda" element={<HelpCenter />} />
          <Route path="/novidades" element={<UpdateLogs />} />
          <Route path="/manutencao" element={<MaintenanceMode />} />
          <Route path="*" element={<NotFound />} />

          {/* Usuário autenticado */}
          <Route
            path="/user/*"
            element={
              <PrivateRoute allowedRoles={["user", "admin", "affiliate"]}>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col bg-background">
                    <Header />
                    <main className="p-6 flex-1">
                      <Routes>
                        <Route path="dashboard" element={<DashboardUser />} />
                        <Route path="operations" element={<Operations />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="financeiro" element={<FinancialHistory />} />
                        <Route path="operacao/:id" element={<TradeDetails />} />
                        <Route path="configuracoes" element={<UserSettings />} />
                        <Route path="performance" element={<PerformanceReport />} />
                        <Route path="exportar" element={<DataExport />} />
                        <Route path="risk" element={<RiskManagement />} />
                        <Route path="ranking" element={<UserRanking />} />
                        <Route path="chart" element={<TradeChart />} />
                        <Route path="apikeys" element={<ApiKeys />} />
                        <Route path="integracoes" element={<Integrations />} />
                        <Route path="alertas" element={<Alerts />} />
                        <Route path="saques" element={<WithdrawHistory />} />
                        <Route path="billing" element={<Billing />} />
                        <Route path="atividade" element={<UserActivity />} />
                        <Route path="convidar" element={<InviteFriends />} />
                        <Route path="openai" element={<OpenAIConsole />} />
                        <Route path="ajustes-bot" element={<TradingSettings />} />
                        <Route path="saque" element={<WithdrawalRequest />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <div className="flex min-h-screen">
                  <Sidebar admin />
                  <div className="flex-1 flex flex-col bg-background">
                    <Header admin />
                    <main className="p-6 flex-1">
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="usuarios" element={<AdminUsers />} />
                        <Route path="afiliados" element={<AffiliateReport />} />
                        <Route path="auditoria" element={<AuditLogs />} />
                        <Route path="logins" element={<LoginHistory />} />
                        <Route path="comissoes" element={<CommissionSettings />} />
                        <Route path="planos" element={<PlanManager />} />
                        <Route path="afiliados-pagamentos" element={<AffiliatesPayouts />} />
                        <Route path="aprovacoes" element={<IntegrationsApproval />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />

          {/* Afiliado */}
          <Route
            path="/afiliado/*"
            element={
              <PrivateRoute allowedRoles={["affiliate"]}>
                <div className="flex min-h-screen">
                  <Sidebar affiliate />
                  <div className="flex-1 flex flex-col bg-background">
                    <Header affiliate />
                    <main className="p-6 flex-1">
                      <Routes>
                        <Route path="dashboard" element={<AffiliateDashboard />} />
                        {/* Outras telas de afiliado se necessário */}
                      </Routes>
                    </main>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
