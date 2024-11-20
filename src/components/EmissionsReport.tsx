import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { SavedFlightCalculation } from "../../types";

const EmissionsReport: React.FC = () => {
  const [savedFlights, setSavedFlights] = useState<SavedFlightCalculation[]>(
    []
  );
  const [totalEmissions, setTotalEmissions] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("saved_flights");
    if (saved) {
      const flights = JSON.parse(saved);
      setSavedFlights(flights);
      const total = flights.reduce(
        (acc: number, flight: SavedFlightCalculation) =>
          acc + flight.emissions.roundTrip,
        0
      );
      setTotalEmissions(total);
    }
  }, []);

  const downloadReport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      savedFlights.map((flight) => ({
        Date: new Date(flight.timestamp).toLocaleDateString(),
        Departure: `${flight.flightPath.mainRoute.departure.iata_code}`,
        Stopovers: flight.flightPath.stopovers
          .map((stopover) => stopover?.airport.iata_code)
          .join(", "),
        "Arrival ": `${flight.flightPath.mainRoute.arrival.iata_code}`,
        "Distance (km)": flight.totalDistance,
        Passengers: flight.flightDetails.passengers,
        "Trip Type": flight.flightDetails.isRoundTrip
          ? "Round Trip"
          : "One Way",
        "Cabin Class": flight.flightDetails.cabinClass,
        "Total Emissions (kg)": flight.emissions.roundTrip,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Flights");
    XLSX.writeFile(workbook, "flight-emissions-report.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Emissions Report</CardTitle>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold">Total Emissions</h3>
              <p className="text-3xl font-bold text-blue-600">
                {(totalEmissions / 1000).toFixed(2)} tonnes CO2
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold">Total Flights</h3>
              <p className="text-3xl font-bold text-blue-600">
                {savedFlights.length}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {savedFlights.map((flight) => (
              <div key={flight.id} className="p-4 border rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="font-medium">
                        {flight.flightPath.mainRoute.departure.name}
                      </p>
                      {flight.flightPath.stopovers.map((stopover, index) => (
                        <div key={index} className="ml-4 text-sm text-gray-500">
                          ↳ {stopover?.airport.name}
                        </div>
                      ))}
                      <p className="font-medium">
                        {flight.flightPath.mainRoute.arrival.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(flight.timestamp).toLocaleDateString()}
                      </p>
                      <p className="font-medium">
                        {(flight.emissions.roundTrip / 1000).toFixed(2)} tonnes
                        CO2
                      </p>
                      <p className="text-sm text-gray-500">
                        {Math.round(flight.totalDistance)} km
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmissionsReport;
