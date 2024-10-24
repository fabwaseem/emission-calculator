import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plane } from "lucide-react";

interface Coordinates {
  lat: number;
  lon: number;
  name: string;
}

interface EmissionResults {
  perPerson: number;
  total: number;
}

interface CalculationResults {
  distance: number;
  emissions: EmissionResults;
  departure: Coordinates;
  arrival: Coordinates;
}

const CO2Calculator: React.FC = () => {
  const [departure, setDeparture] = useState<Coordinates>({
    lat: 0,
    lon: 0,
    name: "",
  });
  const [arrival, setArrival] = useState<Coordinates>({
    lat: 0,
    lon: 0,
    name: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);

  // Common locations presets for quick selection
  const commonLocations = [
    { name: "London Heathrow", lat: 51.47, lon: -0.4543 },
    { name: "New York JFK", lat: 40.6413, lon: -73.7781 },
    { name: "Tokyo Narita", lat: 35.772, lon: 140.3929 },
    { name: "Dubai Intl", lat: 25.2532, lon: 55.3657 },
    { name: "Singapore Changi", lat: 1.3644, lon: 103.9915 },
    { name: "Los Angeles LAX", lat: 33.9416, lon: -118.4085 },
  ];

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateEmissions = (distance: number): EmissionResults => {
    let emissionFactor: number;
    if (distance < 500) {
      emissionFactor = 0.14; // Short haul
    } else if (distance < 3000) {
      emissionFactor = 0.12; // Medium haul
    } else {
      emissionFactor = 0.11; // Long haul
    }

    return {
      perPerson: distance * emissionFactor,
      total: distance * emissionFactor * 200, // Assuming average plane capacity
    };
  };

  const validateCoordinates = (coords: Coordinates): boolean => {
    return (
      coords.lat >= -90 &&
      coords.lat <= 90 &&
      coords.lon >= -180 &&
      coords.lon <= 180 &&
      coords.name.length > 0
    );
  };

  const handleLocationSelect = (
    location: (typeof commonLocations)[0],
    setLocation: React.Dispatch<React.SetStateAction<Coordinates>>
  ) => {
    setLocation({
      lat: location.lat,
      lon: location.lon,
      name: location.name,
    });
  };

  const handleCalculate = async (): Promise<void> => {
    setError(null);
    setResults(null);

    if (!validateCoordinates(departure) || !validateCoordinates(arrival)) {
      setError("Please enter valid coordinates for both locations");
      return;
    }

    setLoading(true);

    try {
      const dist = calculateDistance(
        departure.lat,
        departure.lon,
        arrival.lat,
        arrival.lon
      );

      const emissionResults = calculateEmissions(dist);

      setResults({
        distance: dist,
        emissions: emissionResults,
        departure,
        arrival,
      });
    } catch (error) {
      setError("Error calculating emissions");
    } finally {
      setLoading(false);
    }
  };

  const handleCoordinateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Coordinates,
    setLocation: React.Dispatch<React.SetStateAction<Coordinates>>
  ) => {
    const value =
      field === "name" ? e.target.value : parseFloat(e.target.value) || 0;
    setLocation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Plane className="h-6 w-6 text-blue-500" />
          <CardTitle>Flight CO2 Emissions Calculator</CardTitle>
        </div>
        <CardDescription>
          Calculate the carbon footprint of your flight journey using
          coordinates
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Common locations shortcuts */}
        <div>
          <h3 className="text-sm font-medium mb-2">
            Quick Select Common Airports:
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {commonLocations.map((location) => (
              <div key={location.name} className="flex gap-2">
                <button
                  onClick={() => handleLocationSelect(location, setDeparture)}
                  className="flex-1 p-1 text-xs bg-blue-50 hover:bg-blue-100 rounded"
                >
                  From
                </button>
                <button
                  onClick={() => handleLocationSelect(location, setArrival)}
                  className="flex-1 p-1 text-xs bg-green-50 hover:bg-green-100 rounded"
                >
                  To
                </button>
                <span className="flex-[2] text-xs">{location.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Departure Location */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h3 className="font-medium mb-2">Departure Location</h3>
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600">Latitude</label>
                  <input
                    type="number"
                    value={departure.lat || ""}
                    onChange={(e) =>
                      handleCoordinateChange(e, "lat", setDeparture)
                    }
                    className="w-full p-2 border rounded-md"
                    placeholder="-90 to 90"
                    step="0.0001"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Longitude</label>
                  <input
                    type="number"
                    value={departure.lon || ""}
                    onChange={(e) =>
                      handleCoordinateChange(e, "lon", setDeparture)
                    }
                    className="w-full p-2 border rounded-md"
                    placeholder="-180 to 180"
                    step="0.0001"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Location */}
          <div className="p-4 border rounded-lg bg-green-50">
            <h3 className="font-medium mb-2">Arrival Location</h3>
            <div className="grid gap-2">

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-600">Latitude</label>
                  <input
                    type="number"
                    value={arrival.lat || ""}
                    onChange={(e) =>
                      handleCoordinateChange(e, "lat", setArrival)
                    }
                    className="w-full p-2 border rounded-md"
                    placeholder="-90 to 90"
                    step="0.0001"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Longitude</label>
                  <input
                    type="number"
                    value={arrival.lon || ""}
                    onChange={(e) =>
                      handleCoordinateChange(e, "lon", setArrival)
                    }
                    className="w-full p-2 border rounded-md"
                    placeholder="-180 to 180"
                    step="0.0001"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full col-span-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600
                     disabled:bg-blue-300 transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <span>Calculate Emissions</span>
            )}
          </button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">From</p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(results.departure.lat, 4)}°N,{" "}
                    {formatNumber(results.departure.lon, 4)}°E
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To</p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(results.arrival.lat, 4)}°N,{" "}
                    {formatNumber(results.arrival.lon, 4)}°E
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Flight Distance</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(results.distance, 0)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CO2 Per Passenger</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(results.emissions.perPerson)} kg
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Total Flight Emissions
                  </p>
                  <p className="text-lg font-semibold">
                    {formatNumber(results.emissions.total / 1000)} tonnes
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Equivalent to</p>
                  <p className="text-lg font-semibold">
                    {formatNumber(results.emissions.total / 2400)} years of
                    driving
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CO2Calculator;
