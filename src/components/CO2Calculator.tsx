import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plane } from "lucide-react";
import React, { useState } from "react";
import {
  Airport,
  CalculationResults,
  EmissionResults,
  FlightDetails,
  FlightPath,
  FlightRoute,
  SavedFlightCalculation,
} from "../../types";
import AirportSearchInput from "./AirportSearchInput";
import StopoverInput from "./StopoverInput";

const FlightDetailsForm: React.FC<{
  flightDetails: FlightDetails;
  onChange: (details: FlightDetails) => void;
}> = ({ flightDetails, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Number of Passengers</label>
        <input
          type="number"
          min="1"
          max="1000"
          value={flightDetails.passengers}
          onChange={(e) =>
            onChange({
              ...flightDetails,
              passengers: parseInt(e.target.value) || 1,
            })
          }
          className="w-full p-2 border rounded-md mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Trip Type</label>
        <div className="flex gap-4 mt-1">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={!flightDetails.isRoundTrip}
              onChange={() =>
                onChange({ ...flightDetails, isRoundTrip: false })
              }
            />
            <span>One Way</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={flightDetails.isRoundTrip}
              onChange={() => onChange({ ...flightDetails, isRoundTrip: true })}
            />
            <span>Round Trip</span>
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Cabin Class</label>
        <select
          value={flightDetails.cabinClass}
          onChange={(e) =>
            onChange({
              ...flightDetails,
              cabinClass: e.target.value as FlightDetails["cabinClass"],
            })
          }
          className="w-full p-2 border rounded-md mt-1"
        >
          <option value="economy">Economy</option>
          <option value="premium">Premium Economy</option>
          <option value="business">Business</option>
          <option value="first">First Class</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Aircraft Type</label>
        <select
          value={flightDetails.aircraftType}
          onChange={(e) =>
            onChange({
              ...flightDetails,
              aircraftType: e.target.value as FlightDetails["aircraftType"],
            })
          }
          className="w-full p-2 border rounded-md mt-1"
        >
          <option value="regional">Regional Jet</option>
          <option value="narrowBody">Narrow Body</option>
          <option value="wideBody">Wide Body</option>
        </select>
      </div>
    </div>
  );
};

const CO2Calculator: React.FC = () => {
  const [departureSearch, setDepartureSearch] = useState<string>("");
  const [arrivalSearch, setArrivalSearch] = useState<string>("");
  const [selectedDeparture, setSelectedDeparture] = useState<Airport | null>(
    null
  );
  const [selectedArrival, setSelectedArrival] = useState<Airport | null>(null);

  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const [flightDetails, setFlightDetails] = useState<FlightDetails>({
    passengers: 1,
    isRoundTrip: true,
    cabinClass: "economy",
    aircraftType: "narrowBody",
    loadFactor: 80,
  });

  const [stopovers, setStopovers] = useState<
    ({ airport: Airport; searchTerm: string } | null)[]
  >([]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
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

  const calculateEmissions = (
    distance: number,
    flightDetails: FlightDetails
  ): EmissionResults => {
    // Base emission factors (kg CO2 per km)
    const baseEmissionFactors = {
      regional: 0.14,
      narrowBody: 0.12,
      wideBody: 0.11,
    };

    // Cabin class multipliers
    const cabinClassMultipliers = {
      economy: 0.96, // Slightly lower than baseline due to efficient space usage
      premium: 1.6, // Updated based on actual seat area ratios
      business: 2.9, // Updated based on typical business class configuration
      first: 4.2, // Updated based on luxury first class layouts
    };

    // Get base emission factor based on aircraft type and distance
    let emissionFactor = baseEmissionFactors[flightDetails.aircraftType];

    // Apply cabin class multiplier
    const cabinClassImpact =
      emissionFactor * (cabinClassMultipliers[flightDetails.cabinClass] - 1);
    emissionFactor *= cabinClassMultipliers[flightDetails.cabinClass];

    // Load factor adjustment (baseline is 70%)
    const loadFactorImpact =
      emissionFactor * ((70 - flightDetails.loadFactor) / 100) * 0.8;
    emissionFactor += loadFactorImpact;

    // Calculate per person emissions
    const baseEmissions = distance * emissionFactor;
    const perPerson =
      baseEmissions /
      ((flightDetails.loadFactor / 100) * flightDetails.passengers);

    // Calculate total emissions for all passengers
    const total = perPerson * flightDetails.passengers;

    // Calculate round trip emissions if applicable
    const roundTrip = flightDetails.isRoundTrip ? total * 2 : total;

    return {
      perPerson,
      total,
      roundTrip,
      breakdown: {
        baseEmissions,
        cabinClassImpact,
        loadFactor: flightDetails.loadFactor,
      },
    };
  };

  const calculateTotalDistance = (
    departure: Airport,
    arrival: Airport,
    stopovers: (Airport | null)[]
  ): { totalDistance: number; routes: FlightRoute[] } => {
    const routes: FlightRoute[] = [];
    let totalDistance = 0;

    let currentAirport = departure;

    // Calculate distances through stopovers
    for (const stopover of stopovers) {
      if (stopover) {
        const distance = calculateDistance(
          currentAirport._geoloc.lat,
          currentAirport._geoloc.lng,
          stopover._geoloc.lat,
          stopover._geoloc.lng
        );

        routes.push({
          departure: currentAirport,
          arrival: stopover,
          distance,
        });

        totalDistance += distance;
        currentAirport = stopover;
      }
    }

    // Add final leg to arrival airport
    const finalDistance = calculateDistance(
      currentAirport._geoloc.lat,
      currentAirport._geoloc.lng,
      arrival._geoloc.lat,
      arrival._geoloc.lng
    );

    routes.push({
      departure: currentAirport,
      arrival,
      distance: finalDistance,
    });

    totalDistance += finalDistance;

    return { totalDistance, routes };
  };

  const handleCalculate = (): void => {
    setError(null);
    setResults(null);
    console.log(selectedDeparture, selectedArrival);
    if (!selectedDeparture || !selectedArrival) {
      setError("Please select both airports");
      return;
    }

    setCalculating(true);

    try {
      const { totalDistance, routes } = calculateTotalDistance(
        selectedDeparture,
        selectedArrival,
        stopovers.map((stopover) => stopover?.airport || null)
      );

      const emissionResults = calculateEmissions(totalDistance, flightDetails);

      const flightPath: FlightPath = {
        mainRoute: {
          departure: selectedDeparture,
          arrival: selectedArrival,
          distance: totalDistance,
        },
        stopovers: routes.slice(0, -1).map((route) => ({
          airport: route.arrival,
          searchTerm: "",
        })),
      };

      const savedFlight: SavedFlightCalculation = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        flightPath,
        flightDetails,
        emissions: emissionResults,
        totalDistance,
      };

      // Save to localStorage
      const saved = localStorage.getItem("saved_flights");
      const savedFlights = saved ? JSON.parse(saved) : [];
      savedFlights.push(savedFlight);
      localStorage.setItem("saved_flights", JSON.stringify(savedFlights));

      setResults({
        distance: totalDistance,
        emissions: emissionResults,
        departure: selectedDeparture,
        arrival: selectedArrival,
        flightDetails,
      });
    } catch (error) {
      setError("Error calculating emissions");
    } finally {
      setCalculating(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Plane className="h-6 w-6 text-blue-500" />
          <CardTitle>Flight CO2 Emissions Calculator</CardTitle>
        </div>
        <CardDescription>
          Calculate the carbon footprint of your flight journey
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <AirportSearchInput
            value={departureSearch}
            onChange={(e) => {
              setDepartureSearch(e.target.value);
              setSelectedDeparture(null);
            }}
            placeholder="Search for departure airport..."
            label="Departure Airport"
            searchTerm={departureSearch}
            onSelect={(airport) => {
              setSelectedDeparture(airport);
              setDepartureSearch(`${airport.name} (${airport.iata_code})`);
            }}
          />

          <AirportSearchInput
            value={arrivalSearch}
            onChange={(e) => {
              setArrivalSearch(e.target.value);
              setSelectedArrival(null);
            }}
            placeholder="Search for arrival airport..."
            label="Arrival Airport"
            searchTerm={arrivalSearch}
            onSelect={(airport) => {
              setSelectedArrival(airport);
              setArrivalSearch(`${airport.name} (${airport.iata_code})`);
            }}
          />

          <FlightDetailsForm
            flightDetails={flightDetails}
            onChange={(details) => setFlightDetails(details)}
          />

          <div className="space-y-4">
            {stopovers.length < 2 && (
              <button
                onClick={() => setStopovers([...stopovers, null])}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                + Add Stopover
              </button>
            )}

            {stopovers.map((stopover, index) => (
              <StopoverInput
                key={index}
                index={index}
                stopover={stopover}
                onSelect={(airport, searchTerm) => {
                  const newStopovers = [...stopovers];
                  newStopovers[index] = { airport, searchTerm };
                  setStopovers(newStopovers);
                }}
                onRemove={() => {
                  const newStopovers = stopovers.filter((_, i) => i !== index);
                  setStopovers(newStopovers);
                }}
                distance={
                  stopover && index === 0 && selectedDeparture
                    ? calculateDistance(
                        selectedDeparture._geoloc.lat,
                        selectedDeparture._geoloc.lng,
                        stopover.airport._geoloc.lat,
                        stopover.airport._geoloc.lng
                      )
                    : stopover && stopovers[index - 1]
                    ? calculateDistance(
                        stopovers[index - 1]!.airport._geoloc.lat,
                        stopovers[index - 1]!.airport._geoloc.lng,
                        stopover.airport._geoloc.lat,
                        stopover.airport._geoloc.lng
                      )
                    : 0
                }
              />
            ))}
          </div>

          <button
            onClick={handleCalculate}
            disabled={calculating || !selectedDeparture || !selectedArrival}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600
                     disabled:bg-blue-300 transition-colors flex items-center justify-center space-x-2"
          >
            {calculating ? (
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
                  <p className="text-sm text-gray-500">Flight Details</p>
                  <p className="font-semibold">
                    {results.flightDetails.passengers} passenger(s),{" "}
                    {results.flightDetails.isRoundTrip
                      ? "Round Trip"
                      : "One Way"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {results.flightDetails.cabinClass.charAt(0).toUpperCase() +
                      results.flightDetails.cabinClass.slice(1)}{" "}
                    Class
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="font-semibold">
                    {formatNumber(results.distance, 0)} km
                  </p>
                  <p className="text-sm text-gray-500">
                    {results.flightDetails.isRoundTrip
                      ? `${formatNumber(results.distance * 2, 0)} km round trip`
                      : "one way"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">CO2 Per Passenger</p>
                  <p className="font-semibold">
                    {formatNumber(results.emissions.perPerson)} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total CO2 Emissions</p>
                  <p className="font-semibold">
                    {formatNumber(results.emissions.roundTrip / 1000, 2)} tonnes
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Emissions Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Emissions</span>
                  <span>
                    {formatNumber(results.emissions.breakdown.baseEmissions)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cabin Class Impact</span>
                  <span>
                    {formatNumber(results.emissions.breakdown.cabinClassImpact)}{" "}
                    kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Load Factor</span>
                  <span>
                    {formatNumber(results.emissions.breakdown.loadFactor)}%
                  </span>
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
