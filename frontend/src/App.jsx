import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminApprovers from "./pages/admin/AdminApprovers";
import AdminExpenses from "./pages/admin/AdminExpenses";
import AdminSettings from "./pages/admin/AdminSettings";

// Employee pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import SubmitExpense from "./pages/employee/SubmitExpense";
import MyExpenses from "./pages/employee/MyExpenses";

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerPending from "./pages/manager/ManagerPending";
import ManagerHistory from "./pages/manager/ManagerHistory";
import ManagerTeam from "./pages/manager/ManagerTeam";

// Finance Head pages
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinancePending from "./pages/finance/FinancePending";
import FinanceHistory from "./pages/finance/FinanceHistory";

// Director pages
import DirectorDashboard from "./pages/director/DirectorDashboard";
import DirectorPending from "./pages/director/DirectorPending";
import DirectorHistory from "./pages/director/DirectorHistory";

const ROLE_ROUTES = {
  admin: "/admin",
  employee: "/employee",
  manager: "/manager",
  finance_head: "/finance",
  director: "/director",
};

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_ROUTES[user.role] || "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute roles={["admin"]}><AdminEmployees /></ProtectedRoute>} />
      <Route path="/admin/approvers" element={<ProtectedRoute roles={["admin"]}><AdminApprovers /></ProtectedRoute>} />
      <Route path="/admin/expenses" element={<ProtectedRoute roles={["admin"]}><AdminExpenses /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={["admin"]}><AdminSettings /></ProtectedRoute>} />

      {/* Employee routes */}
      <Route path="/employee" element={<ProtectedRoute roles={["employee"]}><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/employee/submit" element={<ProtectedRoute roles={["employee"]}><SubmitExpense /></ProtectedRoute>} />
      <Route path="/employee/history" element={<ProtectedRoute roles={["employee"]}><MyExpenses /></ProtectedRoute>} />

      {/* Manager routes */}
      <Route path="/manager" element={<ProtectedRoute roles={["manager"]}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/pending" element={<ProtectedRoute roles={["manager"]}><ManagerPending /></ProtectedRoute>} />
      <Route path="/manager/history" element={<ProtectedRoute roles={["manager"]}><ManagerHistory /></ProtectedRoute>} />
      <Route path="/manager/team" element={<ProtectedRoute roles={["manager"]}><ManagerTeam /></ProtectedRoute>} />

      {/* Finance Head routes */}
      <Route path="/finance" element={<ProtectedRoute roles={["finance_head"]}><FinanceDashboard /></ProtectedRoute>} />
      <Route path="/finance/pending" element={<ProtectedRoute roles={["finance_head"]}><FinancePending /></ProtectedRoute>} />
      <Route path="/finance/history" element={<ProtectedRoute roles={["finance_head"]}><FinanceHistory /></ProtectedRoute>} />

      {/* Director routes */}
      <Route path="/director" element={<ProtectedRoute roles={["director"]}><DirectorDashboard /></ProtectedRoute>} />
      <Route path="/director/pending" element={<ProtectedRoute roles={["director"]}><DirectorPending /></ProtectedRoute>} />
      <Route path="/director/history" element={<ProtectedRoute roles={["director"]}><DirectorHistory /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
