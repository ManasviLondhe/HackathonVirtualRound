const BASE_URL = "http://localhost:8000";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// =========================
// GET: Manager Requests
// =========================
export const getManagerRequests = async () => {
  try {
    const res = await fetch(`${BASE_URL}/manager/requests`, {
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error("Failed to fetch manager requests");

    return await res.json();
  } catch (err) {
    console.error("Error fetching requests:", err);
    return [];
  }
};

// =========================
// POST: Approve
// =========================
export const approveRequest = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/approve/${id}`, {
      method: "POST",
      headers: getHeaders(),
    });

    return res.ok;
  } catch (err) {
    console.error("Error approving request:", err);
    return false;
  }
};

// =========================
// POST: Reject
// =========================
export const rejectRequest = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/reject/${id}`, {
      method: "POST",
      headers: getHeaders(),
    });

    return res.ok;
  } catch (err) {
    console.error("Error rejecting request:", err);
    return false;
  }
};

// =========================
// GET Employee Expenses
// =========================
export const getEmployeeExpenses = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/expenses/my`, {
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error("Failed to fetch expenses");

    const data = await res.json();
    return data.expenses || data || [];
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return [];
  }
};

// =========================
// GET Summary
// =========================
export const getEmployeeSummary = async () => {
  try {
    const res = await fetch(`${BASE_URL}/employee/summary`, {
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error("Failed to fetch summary");

    return await res.json();
  } catch (err) {
    console.error("Error fetching summary:", err);
    return null;
  }
};