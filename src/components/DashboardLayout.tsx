import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import EmissionsReport from "./EmissionsReport";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="calculator">{children}</TabsContent>
        <TabsContent value="reports">
          <EmissionsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardLayout;