import { useState, useEffect } from "react";
import { myExpenses } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import { DollarSign, Clock, CheckCircle, XCircle, FileText } from "lucide-react";

export default function EmployeeDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    myExpenses()
      .then((res) => setExpenses(res.data))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: expenses.length,
    pending: expenses.filter((e) => e.status === "pending").length,
    approved: expenses.filter((e) => e.status === "approved").length,
    rejected: expenses.filter((e) => e.status === "rejected").length,
    totalAmount: expenses.reduce((s, e) => s + (e.amount || 0), 0),
  };

  const recentExpenses = expenses.slice(0, 5);

  const statusStyles = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your expense submissions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total", value: stats.total, icon: FileText, color: "bg-indigo-500" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "bg-amber-500" },
              { label: "Approved", value: stats.approved, icon: CheckCircle, color: "bg-emerald-500" },
              { label: "Rejected", value: stats.rejected, icon: XCircle, color: "bg-red-500" },
              { label: "Total Spent", value: `$${stats.totalAmount.toFixed(0)}`, icon: DollarSign, color: "bg-purple-500" },
            ].map((s) => {
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

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>
            {recentExpenses.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No expenses submitted yet</p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{exp.category}</p>
                        <p className="text-xs text-gray-500">{exp.date} {exp.description && `- ${exp.description}`}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{exp.currency} {exp.amount?.toFixed(2)}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[exp.status]}`}>
                        {exp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
