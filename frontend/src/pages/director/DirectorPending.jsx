import { useState, useEffect } from "react";
import { pendingApprovals } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import ApprovalList from "../../components/ApprovalList";

export default function DirectorPending() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    pendingApprovals()
      .then((res) => setExpenses(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-500 mt-1">Expenses awaiting your final approval</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <ApprovalList expenses={expenses} onRefresh={fetchData} showActions={true} />
      )}
    </DashboardLayout>
  );
}
