 import { Bell, Globe2, Plane, Search, Settings, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";


const Dashboard = () => {
  const savedFlights = JSON.parse(localStorage.getItem("saved_flights") || "[]");
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
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your flight emissions data
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button className="p-2 hover:bg-muted rounded-full">
            <Bell className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-accent/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
            <Plane className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedFlights.length}</div>
            <p className="text-xs text-muted-foreground">
              +2.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-accent/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Emissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalEmissions / 1000).toFixed(2)} tonnes</div>
            <p className="text-xs text-muted-foreground">
              +4.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-accent/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
            <Globe2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalDistance / 1000).toFixed(1)}k km</div>
            <p className="text-xs text-muted-foreground">
              +1.8% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:bg-accent/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPassengers}</div>
            <p className="text-xs text-muted-foreground">
              +3.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Calculations</CardTitle>
            <button className="text-sm text-primary hover:text-primary/80">
              View All
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {savedFlights.slice(0, 5).map((flight: any) => (
              <div key={flight.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent rounded-full">
                    <Plane className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {flight.flightPath.mainRoute.departure.iata_code} →
                      {flight.flightPath.mainRoute.arrival.iata_code}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(flight.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {(flight.emissions.roundTrip / 1000).toFixed(2)} tonnes
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(flight.totalDistance)} km
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

 export default Dashboard;