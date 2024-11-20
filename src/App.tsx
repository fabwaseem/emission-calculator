import CO2Calculator from "./components/CO2Calculator";
import DashboardLayout from "./components/DashboardLayout";

const App: React.FC = () => {
  return (
    <DashboardLayout>
      <CO2Calculator />
    </DashboardLayout>
  );
};

export default App;