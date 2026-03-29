import { BrowserRouter, Routes, Route } from "react-router-dom";

import ManagerDashboard from "./pages/Manager/ManagerDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ManagerDashboard />} />   {/* ✅ default */}
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;