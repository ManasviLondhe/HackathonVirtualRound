import { useState, useEffect } from "react";
import { adminExpenses } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import { Search, FileText, Clock, CheckCircle, XCircle } from "lucide-react";

const statusStyles = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminExpenses()
      .then((res) => setExpenses(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = expenses.filter((e) => {
    const matchSearch =
      (e.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
        <p className="text-gray-500 mt-1">View all company expense submissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" className="input-field pl-10" placeholder="Search by employee, category..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Risk</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No expenses found</td></tr>
              ) : (
                filtered.map((exp) => {
                  const s = statusStyles[exp.status] || statusStyles.pending;
                  const StatusIcon = s.icon;
                  return (
                    <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{exp.employee_name}</td>
                      <td className="py-3 px-4 text-gray-600 capitalize">{exp.category}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {exp.currency} {exp.amount?.toFixed(2)}
                        {exp.converted_amount && exp.currency !== exp.default_currency && (
                          <span className="text-xs text-gray-400 block">
                            ~ {exp.default_currency} {exp.converted_amount?.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{exp.date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {exp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          exp.risk_level === "high" ? "bg-red-100 text-red-700" :
                          exp.risk_level === "medium" ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {exp.risk_level || "low"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{exp.description || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
