import { useState, useEffect } from "react";
import { pendingApprovals, approvalHistory } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import { Clock, CheckCircle, XCircle } from "lucide-react";

export default function DirectorDashboard() {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([pendingApprovals(), approvalHistory()])
      .then(([pendRes, histRes]) => {
        const history = histRes.data;
        setStats({
          pending: pendRes.data.length,
          approved: history.filter((h) => h.my_decision === "approved").length,
          rejected: history.filter((h) => h.my_decision === "rejected").length,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "bg-amber-500" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "bg-emerald-500" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "bg-red-500" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Director Dashboard</h1>
        <p className="text-gray-500 mt-1">Final approval authority</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((s) => {
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
      )}
    </DashboardLayout>
  );
}
