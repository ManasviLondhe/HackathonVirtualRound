import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Users, UserCheck, Settings, LogOut, Menu, X,
  FileText, Clock, CheckCircle, DollarSign, Shield, ChevronDown
} from "lucide-react";

const NAV_ITEMS = {
  admin: [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/employees", icon: Users, label: "Employees" },
    { to: "/admin/approvers", icon: UserCheck, label: "Approvers" },
    { to: "/admin/expenses", icon: FileText, label: "All Expenses" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ],
  employee: [
    { to: "/employee", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/employee/submit", icon: DollarSign, label: "Submit Expense" },
    { to: "/employee/history", icon: Clock, label: "My Expenses" },
  ],
  manager: [
    { to: "/manager", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/manager/pending", icon: Clock, label: "Pending Approvals" },
    { to: "/manager/history", icon: CheckCircle, label: "History" },
    { to: "/manager/team", icon: Users, label: "Team Expenses" },
  ],
  finance_head: [
    { to: "/finance", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/finance/pending", icon: Clock, label: "Pending Approvals" },
    { to: "/finance/history", icon: CheckCircle, label: "History" },
  ],
  director: [
    { to: "/director", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/director/pending", icon: Clock, label: "Pending Approvals" },
    { to: "/director/history", icon: CheckCircle, label: "History" },
  ],
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || "employee";
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.employee;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = {
    admin: "Admin",
    employee: "Employee",
    manager: "Manager",
    finance_head: "Finance Head",
    director: "Director",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FlowPay</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="bg-indigo-50 rounded-lg px-3 py-2 mb-4">
            <p className="text-sm font-medium text-indigo-900">{user?.name || "User"}</p>
            <p className="text-xs text-indigo-600">{roleLabel[role]}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <button className="lg:hidden mr-4" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-700">
                {(user?.name || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
