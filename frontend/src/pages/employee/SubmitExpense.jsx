import { useState, useEffect } from "react";
import { submitExpense, ocrReceipt, getMe } from "../../services/api";
import DashboardLayout from "../../components/DashboardLayout";
import toast from "react-hot-toast";
import { Upload, Plus, Trash2, Send, Camera, Loader2 } from "lucide-react";

const CATEGORIES = ["travel", "meals", "office_supplies", "transportation", "accommodation", "communication", "entertainment", "medical", "other"];

export default function SubmitExpense() {
  const [form, setForm] = useState({
    amount: "", currency: "", category: "travel", description: "", vendor_name: "",
    date: new Date().toISOString().split("T")[0], time: "", location: "", expense_lines: [],
  });
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMe().then((res) => {
      setForm((prev) => ({ ...prev, currency: res.data.default_currency || "USD" }));
    });
  }, []);

  const handleReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceipt(file);
    setPreview(URL.createObjectURL(file));

    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("receipt", file);
      const res = await ocrReceipt(fd);
      const data = res.data;
      if (data.amount) setForm((prev) => ({ ...prev, amount: data.amount.toString() }));
      if (data.vendor) setForm((prev) => ({ ...prev, vendor_name: data.vendor }));
      if (data.date) setForm((prev) => ({ ...prev, date: data.date }));
      toast.success("Receipt scanned!");
    } catch {
      toast.error("OCR failed - please enter details manually");
    } finally {
      setOcrLoading(false);
    }
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      expense_lines: [...prev.expense_lines, { item_name: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const updateLine = (idx, field, value) => {
    setForm((prev) => {
      const lines = [...prev.expense_lines];
      lines[idx] = { ...lines[idx], [field]: value };
      return { ...prev, expense_lines: lines };
    });
  };

  const removeLine = (idx) => {
    setForm((prev) => ({ ...prev, expense_lines: prev.expense_lines.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("amount", parseFloat(form.amount));
      fd.append("currency", form.currency);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("vendor_name", form.vendor_name);
      fd.append("date", form.date);
      fd.append("time", form.time);
      fd.append("location", form.location);
      fd.append("expense_lines", JSON.stringify(form.expense_lines));
      if (receipt) fd.append("receipt", receipt);

      await submitExpense(fd);
      toast.success("Expense submitted for approval!");
      setForm({
        amount: "", currency: form.currency, category: "travel", description: "",
        vendor_name: "", date: new Date().toISOString().split("T")[0], time: "", location: "", expense_lines: [],
      });
      setReceipt(null);
      setPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Expense</h1>
        <p className="text-gray-500 mt-1">Upload receipt and fill in details</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Receipt Upload */}
        <div className="card lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-4">Receipt</h2>
          <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleReceipt} />
            {preview ? (
              <img src={preview} alt="Receipt" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div>
                <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload receipt</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG supported</p>
              </div>
            )}
          </label>
          {ocrLoading && (
            <div className="flex items-center gap-2 mt-3 text-sm text-indigo-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Scanning receipt...
            </div>
          )}
        </div>

        {/* Form */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Expense Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" step="0.01" required className="input-field" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input type="text" className="input-field bg-gray-50" value={form.currency} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="input-field" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required className="input-field" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                <input type="text" className="input-field" value={form.vendor_name}
                  onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" className="input-field" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input-field" rows={2} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Expense Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Line Items (optional)</label>
                <button type="button" onClick={addLine} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
              {form.expense_lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input type="text" className="input-field flex-1" placeholder="Item name"
                    value={line.item_name} onChange={(e) => updateLine(idx, "item_name", e.target.value)} />
                  <input type="number" className="input-field w-20" placeholder="Qty" min="1"
                    value={line.quantity} onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 1)} />
                  <input type="number" step="0.01" className="input-field w-28" placeholder="Price"
                    value={line.unit_price} onChange={(e) => updateLine(idx, "unit_price", parseFloat(e.target.value) || 0)} />
                  <button type="button" onClick={() => removeLine(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Expense"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
