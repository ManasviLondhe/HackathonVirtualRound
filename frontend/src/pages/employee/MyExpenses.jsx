import { useState, useEffect } from "react";
import { myExpenses } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import { Search, Clock, CheckCircle, XCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";

const statusStyles = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

export default function MyExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    myExpenses()
      .then((res) => setExpenses(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = expenses.filter(
    (e) => (e.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
        <p className="text-gray-500 mt-1">View all your submitted expenses</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" className="input-field pl-10" placeholder="Search by category, description..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No expenses found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exp) => {
            const s = statusStyles[exp.status] || statusStyles.pending;
            const StatusIcon = s.icon;
            const isExpanded = expanded === exp.id;
            return (
              <div key={exp.id} className="card">
                <div className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : exp.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{exp.category?.replace("_", " ")}</p>
                      <p className="text-xs text-gray-500">{exp.date} {exp.vendor_name && `| ${exp.vendor_name}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{exp.currency} {exp.amount?.toFixed(2)}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {exp.status}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {exp.description && (
                      <p className="text-sm text-gray-600 mb-3">{exp.description}</p>
                    )}

                    {/* Approval Trail */}
                    {exp.trail && exp.trail.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Approval Trail</p>
                        <div className="space-y-2">
                          {exp.trail.map((step, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                step.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                                step.status === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-500"
                              }`}>
                                {step.step_order}
                              </span>
                              <span className="text-gray-700">{step.approver_name}</span>
                              <span className={`text-xs capitalize ${
                                step.status === "approved" ? "text-emerald-600" :
                                step.status === "rejected" ? "text-red-600" : "text-gray-400"
                              }`}>
                                ({step.status})
                              </span>
                              {step.comment && <span className="text-xs text-gray-400">- {step.comment}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Line Items */}
                    {exp.expense_lines?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Line Items</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          {exp.expense_lines.map((line, i) => (
                            <div key={i} className="flex justify-between text-sm py-1">
                              <span className="text-gray-700">{line.item_name} x{line.quantity}</span>
                              <span className="font-medium">{(line.unit_price * line.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
