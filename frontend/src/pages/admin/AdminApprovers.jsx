import { useState, useEffect } from "react";
import { createUser, listApprovers, deleteApprover } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import toast from "react-hot-toast";
import { UserPlus, Trash2, Shield, Search } from "lucide-react";

const DESIGNATIONS = [
  { value: "manager", label: "Manager" },
  { value: "finance_head", label: "Finance Head" },
  { value: "director", label: "Director" },
];

export default function AdminApprovers() {
  const [approvers, setApprovers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" });

  const fetchData = () => {
    listApprovers()
      .then((res) => setApprovers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(form);
      toast.success("Approver created! Credentials will be sent via email.");
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "manager" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create approver");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete approver "${name}"?`)) return;
    try {
      await deleteApprover(id);
      toast.success("Approver deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filtered = approvers.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  const designationColors = {
    Manager: "bg-blue-100 text-blue-700",
    "Finance Head": "bg-purple-100 text-purple-700",
    Director: "bg-amber-100 text-amber-700",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvers</h1>
          <p className="text-gray-500 mt-1">Manage managers, finance heads & directors</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Approver
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Approver</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" required className="input-field" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="input-field" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="text" required className="input-field" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Temporary password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select className="input-field" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {DESIGNATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Create Approver</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" className="input-field pl-10" placeholder="Search approvers..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Designation</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Created</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No approvers found</td></tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{app.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{app.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        designationColors[app.approver_designation] || "bg-gray-100 text-gray-700"
                      }`}>
                        {app.approver_designation || app.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{app.role?.replace("_", " ")}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDelete(app.id, app.name)}
                        className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
