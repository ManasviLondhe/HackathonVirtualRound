// frontend/src/services/authService.js

const BASE_URL = "http://127.0.0.1:8000";

// 🔹 Login API (ROLE-BASED)
export const loginUser = async (email, password, role) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
      role: role,
    }),
  });

  const data = await res.json();

  // ❌ Handle errors properly
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Login failed");
  }

  // ✅ Save token + user
  if (data.token) {
    localStorage.setItem("token", data.token);
  }

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
};

// 🔹 Logout (VERY IMPORTANT)
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// 🔹 Get Logged In User
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// 🔹 Check Auth
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};






// signup api
/* ─── Admin / Company Signup ─── */
export async function signupCompany(
  companyName,
  location,
  currency,
  email,
  bio,
  password
) {
  const res = await fetch(`${BASE_URL}/signup/company`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName, location, currency, email, bio, password }),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Signup failed");
  }
  return data;
}