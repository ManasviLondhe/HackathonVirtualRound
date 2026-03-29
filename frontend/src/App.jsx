import { BrowserRouter, Routes, Route } from "react-router-dom";
<<<<<<< HEAD

import ManagerDashboard from "./pages/Manager/ManagerDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
=======
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login.jsx";
import SignIn from "./pages/SignIn.jsx";
>>>>>>> 96996f77a7b3d2ff35356d3d54996cfbc08707cc

function App() {
  return (
    <BrowserRouter>
      <Routes>
<<<<<<< HEAD
        <Route path="/" element={<ManagerDashboard />} />   {/* ✅ default */}
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
=======
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<SignIn />} />
>>>>>>> 96996f77a7b3d2ff35356d3d54996cfbc08707cc
      </Routes>
    </BrowserRouter>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> 96996f77a7b3d2ff35356d3d54996cfbc08707cc
