import { useState } from "react";
import { takeAction } from "../services/api";
import toast from "react-hot-toast";
import { Clock, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, FileText, ArrowUpRight } from "lucide-react";

const statusStyles = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  escalated: { bg: "bg-orange-100", text: "text-orange-700", icon: ArrowUpRight },
};

export default function ApprovalList({ expenses, onRefresh, showActions = true }) {
  const [expanded, setExpanded] = useState(null);
  const [actionForm, setActionForm] = useState({ expenseId: null, action: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (expenseId, action) => {
    if (actionForm.expenseId === expenseId && actionForm.action === action) {
      setActionForm({ expenseId: null, action: "", comment: "" });
      return;
    }
    setActionForm({ expenseId, action, comment: "" });
  };

  const submitAction = async () => {
    setSubmitting(true);
    try {
      await takeAction(actionForm.expenseId, {
        action: actionForm.action,
        comment: actionForm.comment,
      });
      toast.success(`Expense ${actionForm.action}d!`);
      setActionForm({ expenseId: null, action: "", comment: "" });
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="card text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400">No expenses found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((exp) => {
        const s = statusStyles[exp.status] || statusStyles.pending;
        const StatusIcon = s.icon;
        const isExpanded = expanded === exp.id;
        const isActioning = actionForm.expenseId === exp.id;

        return (
          <div key={exp.id} className="card">
            <div className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : exp.id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{exp.employee_name || "Employee"}</p>
                  <p className="text-xs text-gray-500 capitalize">{exp.category?.replace("_", " ")} | {exp.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {exp.currency} {exp.amount?.toFixed(2)}
                    {exp.converted_amount && exp.currency !== exp.default_currency && (
                      <span className="text-xs text-gray-400 block">
                        ~ {exp.default_currency} {exp.converted_amount?.toFixed(2)}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {exp.status}
                    </span>
                    {exp.trust_score !== undefined && exp.trust_score < 70 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" />
                        Low trust
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Vendor:</span>{" "}
                    <span className="text-gray-900">{exp.vendor_name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Description:</span>{" "}
                    <span className="text-gray-900">{exp.description || "-"}</span>
                  </div>
                  {exp.location && (
                    <div>
                      <span className="text-gray-500">Location:</span>{" "}
                      <span className="text-gray-900">{exp.location}</span>
                    </div>
                  )}
                  {exp.risk_level && (
                    <div>
                      <span className="text-gray-500">Risk Level:</span>{" "}
                      <span className={`font-medium capitalize ${
                        exp.risk_level === "high" ? "text-red-600" :
                        exp.risk_level === "medium" ? "text-amber-600" : "text-green-600"
                      }`}>{exp.risk_level}</span>
                    </div>
                  )}
                  {exp.ocr_match_status !== null && exp.ocr_match_status !== undefined && (
                    <div>
                      <span className="text-gray-500">OCR Match:</span>{" "}
                      <span className={exp.ocr_match_status ? "text-emerald-600" : "text-red-600"}>
                        {exp.ocr_match_status ? "Matched" : "Mismatch"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Receipt Image */}
                {exp.receipt_image_path && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Receipt</p>
                    <a
                      href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/uploads/${exp.receipt_image_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/uploads/${exp.receipt_image_path}`}
                        alt="Receipt"
                        className="max-h-48 rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90"
                      />
                    </a>
                    <p className="text-xs text-gray-400 mt-1">Click to open full size</p>
                  </div>
                )}

                {/* Approval Trail */}
                {exp.trail && exp.trail.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Approval Trail</p>
                    <div className="space-y-2">
                      {exp.trail.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            step.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                            step.status === "rejected" ? "bg-red-100 text-red-700" :
                            step.status === "escalated" ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-500"
                          }`}>{step.step_order}</span>
                          <span className="text-gray-700">{step.approver_name}</span>
                          <span className={`text-xs capitalize ${
                            step.status === "approved" ? "text-emerald-600" :
                            step.status === "rejected" ? "text-red-600" :
                            step.status === "escalated" ? "text-orange-600" : "text-gray-400"
                          }`}>({step.status})</span>
                          {step.comment && <span className="text-xs text-gray-400">- {step.comment}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {showActions && exp.status === "pending" && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(exp.id, "approve"); }}
                        className={`btn-success text-sm ${isActioning && actionForm.action === "approve" ? "ring-2 ring-emerald-300" : ""}`}
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(exp.id, "reject"); }}
                        className={`btn-danger text-sm ${isActioning && actionForm.action === "reject" ? "ring-2 ring-red-300" : ""}`}
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Reject
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(exp.id, "escalate"); }}
                        className={`btn-secondary text-sm ${isActioning && actionForm.action === "escalate" ? "ring-2 ring-gray-300" : ""}`}
                      >
                        <ArrowUpRight className="w-4 h-4 inline mr-1" />
                        Escalate
                      </button>
                    </div>

                    {isActioning && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input-field flex-1"
                          placeholder="Add a comment (optional)"
                          value={actionForm.comment}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setActionForm({ ...actionForm, comment: e.target.value })}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); submitAction(); }}
                          disabled={submitting}
                          className="btn-primary text-sm"
                        >
                          {submitting ? "..." : "Confirm"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
