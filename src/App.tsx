import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./components/Dashboard";
import CO2Calculator from "./components/CO2Calculator";
import EmissionsReport from "./components/EmissionsReport";

const App = () => {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calculate" element={<CO2Calculator />} />
          <Route path="/reports" element={<EmissionsReport />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
};

export default App;