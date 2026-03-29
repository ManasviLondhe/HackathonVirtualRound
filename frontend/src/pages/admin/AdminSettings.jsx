import { useState, useEffect } from "react";
import { saveSMTP, getSMTP } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import toast from "react-hot-toast";
import { Settings, Mail, Lock, Save, Eye, EyeOff } from "lucide-react";

export default function AdminSettings() {
  const [form, setForm] = useState({ smtp_email: "", smtp_app_password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    getSMTP()
      .then((res) => {
        setForm((prev) => ({ ...prev, smtp_email: res.data.smtp_email || "" }));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSMTP(form);
      toast.success("SMTP settings saved! Credentials will now be emailed to new users.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure email settings for credential delivery</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="max-w-xl">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Configuration (SMTP)</h2>
                <p className="text-sm text-gray-500">
                  Used to send login credentials to employees and approvers
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email (Gmail)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="input-field pl-10"
                    placeholder="admin@gmail.com"
                    value={form.smtp_email}
                    onChange={(e) => setForm({ ...form, smtp_email: e.target.value })}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">This email will be used as the sender for all notifications</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="Google App Password"
                    value={form.smtp_app_password}
                    onChange={(e) => setForm({ ...form, smtp_app_password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Generate an App Password from Google Account settings (2FA must be enabled)
                </p>
              </div>

              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </form>
          </div>

          <div className="card mt-4">
            <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-700 mt-0.5 shrink-0">1</span>
                Configure your Gmail and App Password above
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-700 mt-0.5 shrink-0">2</span>
                When you create employees or approvers, their credentials are automatically emailed
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-700 mt-0.5 shrink-0">3</span>
                Users must change their password on first login
              </li>
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
