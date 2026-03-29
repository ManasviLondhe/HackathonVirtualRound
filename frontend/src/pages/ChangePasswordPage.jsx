import { useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, DollarSign } from "lucide-react";

const ROLE_ROUTES = {
  admin: "/admin",
  employee: "/employee",
  manager: "/manager",
  finance_head: "/finance",
  director: "/director",
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await changePassword({ old_password: form.old_password, new_password: form.new_password });
      toast.success("Password changed successfully!");
      flushSync(() => {
        setUser((prev) => ({ ...prev, must_change_password: false }));
      });
      navigate(ROLE_ROUTES[user?.role] || "/employee");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
          <p className="text-gray-500 mt-1">You must change your password to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showOld ? "text" : "password"}
                  required
                  className="input-field pl-10 pr-10"
                  value={form.old_password}
                  onChange={(e) => setForm({ ...form, old_password: e.target.value })}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowOld(!showOld)}>
                  {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showNew ? "text" : "password"}
                  required
                  className="input-field pl-10 pr-10"
                  value={form.new_password}
                  onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" required className="input-field pl-10" value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
