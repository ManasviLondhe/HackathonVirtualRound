import { useState, useEffect } from "react";
import { approvalHistory } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import { Clock, CheckCircle, XCircle, Search } from "lucide-react";

const statusStyles = {
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

export default function ManagerHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    approvalHistory()
      .then((res) => setHistory(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(
    (h) => (h.employee_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (h.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approval History</h1>
        <p className="text-gray-500 mt-1">Past decisions</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" className="input-field pl-10" placeholder="Search..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <th className="text-left py-3 px-4 font-medium text-gray-500">My Decision</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Comment</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No history</td></tr>
              ) : (
                filtered.map((h, idx) => {
                  const s = statusStyles[h.my_decision] || { bg: "bg-gray-100", text: "text-gray-700" };
                  return (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{h.employee_name}</td>
                      <td className="py-3 px-4 text-gray-600 capitalize">{h.category?.replace("_"," ")}</td>
                      <td className="py-3 px-4 font-medium">{h.currency} {h.amount?.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                          {h.my_decision}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{h.my_comment || "-"}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{h.acted_at ? new Date(h.acted_at).toLocaleDateString() : "-"}</td>
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
