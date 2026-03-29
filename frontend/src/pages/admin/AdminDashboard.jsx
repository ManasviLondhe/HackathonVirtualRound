import { useState, useEffect } from "react";
import { getCurrentUsers, listEmployees, listApprovers, adminExpenses } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, UserCheck, FileText, DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ employees: 0, approvers: 0, expenses: 0, pending: 0, approved: 0, rejected: 0 });
  const [currentUsers, setCurrentUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listEmployees(), listApprovers(), adminExpenses(), getCurrentUsers()])
      .then(([empRes, appRes, expRes, curRes]) => {
        const expenses = expRes.data;
        setStats({
          employees: empRes.data.filter((e) => e.role === "employee").length,
          approvers: appRes.data.length,
          expenses: expenses.length,
          pending: expenses.filter((e) => e.status === "pending").length,
          approved: expenses.filter((e) => e.status === "approved").length,
          rejected: expenses.filter((e) => e.status === "rejected").length,
        });
        setCurrentUsers(curRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Employees", value: stats.employees, icon: Users, color: "bg-blue-500" },
    { label: "Approvers", value: stats.approvers, icon: UserCheck, color: "bg-purple-500" },
    { label: "Total Expenses", value: stats.expenses, icon: FileText, color: "bg-indigo-500" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "bg-amber-500" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "bg-emerald-500" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "bg-red-500" },
  ];

  const roleLabels = { employee: "Employees", manager: "Managers", finance_head: "Finance Heads", director: "Directors" };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your company</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card">
                  <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Current users by role */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(roleLabels).map(([role, label]) => (
              <div key={role} className="card">
                <h3 className="font-semibold text-gray-900 mb-3">{label}</h3>
                {(currentUsers[role] || []).length === 0 ? (
                  <p className="text-sm text-gray-400">No {label.toLowerCase()} yet</p>
                ) : (
                  <div className="space-y-2">
                    {(currentUsers[role] || []).map((u) => (
                      <div key={u.id} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-indigo-700">{u.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
