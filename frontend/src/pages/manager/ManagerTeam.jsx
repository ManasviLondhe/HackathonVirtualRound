import { useState, useEffect } from "react";
import { teamExpenses } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import ApprovalList from "../../components/ApprovalList";

export default function ManagerTeam() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    teamExpenses()
      .then((res) => setExpenses(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Expenses</h1>
        <p className="text-gray-500 mt-1">All expenses from your team members</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <ApprovalList expenses={expenses} onRefresh={fetchData} showActions={false} />
      )}
    </DashboardLayout>
  );
}
