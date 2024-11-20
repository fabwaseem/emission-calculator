 import React from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
 import { Plane, Users, ArrowUpRight, TrendingUp, Globe2 } from "lucide-react";

 const StatCard: React.FC<{
   title: string;
   value: string;
   description: string;
   icon: React.ReactNode;
 }> = ({ title, value, description, icon }) => (
   <Card>
     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
       <CardTitle className="text-sm font-medium">{title}</CardTitle>
       {icon}
     </CardHeader>
     <CardContent>
       <div className="text-2xl font-bold">{value}</div>
       <p className="text-xs text-muted-foreground">{description}</p>
     </CardContent>
   </Card>
 );

 const Dashboard = () => {
   const savedFlights = JSON.parse(
     localStorage.getItem("saved_flights") || "[]"
   );
   const totalEmissions = savedFlights.reduce(
     (acc: number, flight: any) => acc + flight.emissions.roundTrip,
     0
   );
   const totalDistance = savedFlights.reduce(
     (acc: number, flight: any) => acc + flight.totalDistance,
     0
   );
   const totalPassengers = savedFlights.reduce(
     (acc: number, flight: any) => acc + flight.flightDetails.passengers,
     0
   );

   return (
     <div className="space-y-8">
       <div>
         <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
         <p className="text-muted-foreground">
           Overview of your flight emissions data
         </p>
       </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <StatCard
           title="Total Flights"
           value={savedFlights.length.toString()}
           description="All time calculated flights"
           icon={<Plane className="h-4 w-4 text-muted-foreground" />}
         />
         <StatCard
           title="Total Emissions"
           value={`${(totalEmissions / 1000).toFixed(2)} tonnes`}
           description="CO2 emissions"
           icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
         />
         <StatCard
           title="Total Distance"
           value={`${(totalDistance / 1000).toFixed(1)}k km`}
           description="Distance covered"
           icon={<Globe2 className="h-4 w-4 text-muted-foreground" />}
         />
         <StatCard
           title="Total Passengers"
           value={totalPassengers.toString()}
           description="Passengers transported"
           icon={<Users className="h-4 w-4 text-muted-foreground" />}
         />
       </div>
     </div>
   );
 };

 export default Dashboard;