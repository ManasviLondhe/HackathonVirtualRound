import { useState, useEffect } from "react";
import { createUser, listEmployees, listApprovers, deleteEmployee } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import toast from "react-hot-toast";
import { UserPlus, Trash2, Users, Search } from "lucide-react";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "employee", manager_id: "", approver_mappings: [],
  });

  const fetchData = () => {
    Promise.all([listEmployees(), listApprovers()])
      .then(([empRes, appRes]) => {
        setEmployees(empRes.data);
        setApprovers(appRes.data);
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Failed to load employees");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const managers = approvers.filter((a) => a.role === "manager" || a.approver_designation === "Manager");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.manager_id) {
      toast.error("Please assign a manager before creating an employee.");
      return;
    }
    try {
      await createUser({
        ...form,
        manager_id: form.manager_id ? parseInt(form.manager_id) : null,
        approver_mappings: form.approver_mappings,
      });
      toast.success("Employee created! Credentials will be sent via email.");
      setShowForm(false);
      setForm({ name: "", email: "", password: "", role: "employee", manager_id: "", approver_mappings: [] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create employee");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete employee "${name}"?`)) return;
    try {
      await deleteEmployee(id);
      toast.success("Employee deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const addMapping = () => {
    setForm((prev) => ({
      ...prev,
      approver_mappings: [...prev.approver_mappings, { approver_id: "", step_order: prev.approver_mappings.length + 1 }],
    }));
  };

  const updateMapping = (idx, field, value) => {
    setForm((prev) => {
      const maps = [...prev.approver_mappings];
      maps[idx] = { ...maps[idx], [field]: field === "approver_id" ? parseInt(value) : parseInt(value) };
      return { ...prev, approver_mappings: maps };
    });
  };

  const removeMapping = (idx) => {
    setForm((prev) => ({
      ...prev,
      approver_mappings: prev.approver_mappings.filter((_, i) => i !== idx).map((m, i) => ({ ...m, step_order: i + 1 })),
    }));
  };

  const filtered = employees.filter(
    (e) => e.role === "employee" && (e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage your company employees</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Employee</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
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
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Manager</label>
                <select className="input-field" value={form.manager_id}
                  onChange={(e) => setForm({ ...form, manager_id: e.target.value })}>
                  <option value="">No Manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.approver_designation})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Approval Chain Mapping */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Approval Chain</label>
                <button type="button" onClick={addMapping} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  + Add Step
                </button>
              </div>
              {form.approver_mappings.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-500 w-16">Step {m.step_order}</span>
                  <select className="input-field flex-1" value={m.approver_id}
                    onChange={(e) => updateMapping(idx, "approver_id", e.target.value)}>
                    <option value="">Select Approver</option>
                    {approvers.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.approver_designation || a.role})</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeMapping(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Create Employee</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" className="input-field pl-10" placeholder="Search employees..."
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
                <th className="text-left py-3 px-4 font-medium text-gray-500">Manager</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Trust Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Approval Chain</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No employees found</td></tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-700">{emp.name[0]}</span>
                        </div>
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{emp.email}</td>
                    <td className="py-3 px-4 text-gray-600">{emp.manager_name || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        (emp.trust_score || 100) >= 80 ? "bg-emerald-100 text-emerald-700" :
                        (emp.trust_score || 100) >= 50 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {emp.trust_score ?? 100}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {emp.approver_chain?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {emp.approver_chain.map((a, i) => (
                            <span key={i} className="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                              {a.step_order}. {a.approver_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not set</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDelete(emp.id, emp.name)}
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
