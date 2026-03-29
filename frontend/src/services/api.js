import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const signup = (data) => api.post("/auth/signup", data);
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const changePassword = (data) => api.post("/auth/change-password", data);

// Countries
export const getCountries = () => api.get("/countries");

// Admin - Users
export const createUser = (data) => api.post("/admin/users", data);
export const listApprovers = () => api.get("/admin/approvers");
export const deleteApprover = (id) => api.delete(`/admin/approvers/${id}`);
export const listEmployees = () => api.get("/admin/employees");
export const deleteEmployee = (id) => api.delete(`/admin/employees/${id}`);
export const getCurrentUsers = () => api.get("/admin/current-users");

// Admin - Settings
export const saveSMTP = (data) => api.post("/admin/settings/smtp", data);
export const getSMTP = () => api.get("/admin/settings/smtp");

// Admin - Approval Flow
export const saveApprovalFlow = (data) => api.post("/admin/approval-flow", data);
export const getApprovalFlow = () => api.get("/admin/approval-flow");

// Admin - Approval Rules
export const createApprovalRule = (data) => api.post("/admin/approval-rules", data);
export const listApprovalRules = () => api.get("/admin/approval-rules");
export const deleteApprovalRule = (id) => api.delete(`/admin/approval-rules/${id}`);

// Admin - Risk Thresholds
export const listRiskThresholds = () => api.get("/admin/risk-thresholds");
export const setRiskThreshold = (data) => api.post("/admin/risk-thresholds", data);
export const deleteRiskThreshold = (id) => api.delete(`/admin/risk-thresholds/${id}`);

// Admin - Trust Score
export const updateTrustScore = (data) => api.post("/admin/trust-score", data);

// Admin - Relationships
export const listRelationships = () => api.get("/admin/relationships");
export const createRelationship = (data) => api.post("/admin/relationships", data);
export const deleteRelationship = (id) => api.delete(`/admin/relationships/${id}`);

// Admin - Expenses (admin view)
export const adminExpenses = () => api.get("/admin/expenses");

// Expenses
export const submitExpense = (formData) =>
  api.post("/expenses/submit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const ocrReceipt = (formData) =>
  api.post("/expenses/ocr", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const myExpenses = () => api.get("/expenses/my");
export const getExpense = (id) => api.get(`/expenses/${id}`);

// Approvals
export const pendingApprovals = () => api.get("/approvals/pending");
export const takeAction = (expenseId, data) =>
  api.post(`/approvals/${expenseId}/action`, data);
export const approvalHistory = () => api.get("/approvals/history");
export const teamExpenses = () => api.get("/approvals/team-expenses");

export default api;
