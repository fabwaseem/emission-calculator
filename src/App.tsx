import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plane, Search, Clock, X } from "lucide-react";
import Fuse from "fuse.js";

interface Airport {
  name: string;
  city: string;
  country: string;
  iata_code: string;
  _geoloc: {
    lat: number;
    lng: number;
  };
  links_count: number;
  objectID: string;
}

interface EmissionResults {
  perPerson: number;
  total: number;
  roundTrip: number;
}

interface FlightDetails {
  passengers: number;
  isRoundTrip: boolean;
  cabinClass: 'economy' | 'premium' | 'business' | 'first';
  aircraftType: 'regional' | 'narrowBody' | 'wideBody';
}

interface CalculationResults {
  distance: number;
  emissions: EmissionResults;
  departure: Airport;
  arrival: Airport;
  flightDetails: FlightDetails;
}

interface DropdownState {
  show: boolean;
  selectedIndex: number;
}

interface RecentSearch {
  id: string;
  airport: Airport;
  timestamp: number;
}

const CACHE_KEY = "airports_data";
const RECENT_SEARCHES_KEY = "recent_airport_searches";
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const MAX_RECENT_SEARCHES = 5;

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const highlightText = (text: string, query: string): JSX.Element => {
  if (!query) return <span>{text}</span>;

  try {
    // Escape special characters in the query
    const escapedQuery = escapeRegExp(query);
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-200">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  } catch (error) {
    // Fallback if regex fails
    return <span>{text}</span>;
  }
};

const AirportSearchInput: React.FC<{
  inputRef: React.Ref<HTMLInputElement>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  label: string;
  showDropdown: boolean;
  results: Airport[];
  selectedIndex: number;
  searchTerm: string;
  onSelect: (airport: Airport) => void;
  recentSearches: RecentSearch[];
  onRecentSelect: (airport: Airport) => void;
  onRecentRemove: (id: string) => void;
}> = ({
  inputRef,
  value,
  onChange,
  onFocus,
  onKeyDown,
  placeholder,
  label,
  showDropdown,
  results,
  selectedIndex,
  searchTerm,
  onSelect,
  recentSearches,
  onRecentSelect,
  onRecentRemove,
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">{label}</label>
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className="w-full p-2 border rounded-md pr-8"
        placeholder={placeholder}
      />
      <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />

      {showDropdown && (
        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
          {searchTerm.length < 2 && recentSearches.length > 0 && (
            <div className="p-2 border-b">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Clock className="h-4 w-4" />
                <span>Recent Searches</span>
              </div>
              {recentSearches.map((recent, index) => (
                <div
                  key={recent.id}
                  className={`p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center
                    ${index === selectedIndex ? "bg-gray-100" : ""}`}
                >
                  <div
                    className="flex-1"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onRecentSelect(recent.airport);
                    }}
                  >
                    <div className="font-medium">{recent.airport.name}</div>
                    <div className="text-sm text-gray-500">
                      {recent.airport.city}, {recent.airport.country} (
                      {recent.airport.iata_code})
                    </div>
                  </div>
                  <button
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onRecentRemove(recent.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {results.map((airport, index) => (
            <div
              key={airport.objectID}
              className={`p-2 hover:bg-gray-100 cursor-pointer
                ${
                  index + recentSearches.length === selectedIndex
                    ? "bg-gray-100"
                    : ""
                }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                console.log(airport);
                onSelect(airport);
              }}
            >
              <div className="font-medium">
                {highlightText(airport.name, searchTerm)}
              </div>
              <div className="text-sm text-gray-500">
                {highlightText(
                  `${airport.city}, ${airport.country} (${airport.iata_code})`,
                  searchTerm
                )}
              </div>
            </div>
          ))}

          {results.length === 0 && searchTerm.length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              No airports found matching your search
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

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
            onChange({ ...flightDetails, passengers: parseInt(e.target.value) || 1 })
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
              onChange={() => onChange({ ...flightDetails, isRoundTrip: false })}
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
              cabinClass: e.target.value as FlightDetails['cabinClass'],
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
              aircraftType: e.target.value as FlightDetails['aircraftType'],
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
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [departureSearch, setDepartureSearch] = useState<string>("");
  const [arrivalSearch, setArrivalSearch] = useState<string>("");
  const [selectedDeparture, setSelectedDeparture] = useState<Airport | null>(
    null
  );
  const [selectedArrival, setSelectedArrival] = useState<Airport | null>(null);
  const [departureDropdown, setDepartureDropdown] = useState<DropdownState>({
    show: false,
    selectedIndex: -1,
  });
  const [arrivalDropdown, setArrivalDropdown] = useState<DropdownState>({
    show: false,
    selectedIndex: -1,
  });
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const [flightDetails, setFlightDetails] = useState<FlightDetails>({
    passengers: 1,
    isRoundTrip: false,
    cabinClass: 'economy',
    aircraftType: 'narrowBody',
  });

  const departureRef = useRef<HTMLInputElement>(null);
  const arrivalRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(airports, {
      keys: ["name", "city", "country", "iata_code"],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 2,
    });
  }, [airports]);

  useEffect(() => {
    const loadRecentSearches = () => {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    };

    loadRecentSearches();
  }, []);

  const saveRecentSearch = (airport: Airport) => {
    const newRecent: RecentSearch = {
      id: Math.random().toString(36).substr(2, 9),
      airport,
      timestamp: Date.now(),
    };

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (r) => r.airport.iata_code !== airport.iata_code
      );
      const updated = [newRecent, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecentSearch = (id: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    dropdown: DropdownState,
    setDropdown: React.Dispatch<React.SetStateAction<DropdownState>>,
    results: Airport[],
    onSelect: (airport: Airport) => void,
    recentSearches: RecentSearch[]
  ) => {
    const totalItems = results.length + recentSearches.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setDropdown((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % totalItems,
        }));
        break;

      case "ArrowUp":
        e.preventDefault();
        setDropdown((prev) => ({
          ...prev,
          selectedIndex:
            prev.selectedIndex <= 0 ? totalItems - 1 : prev.selectedIndex - 1,
        }));
        break;

      case "Enter":
        e.preventDefault();
        if (dropdown.selectedIndex >= 0) {
          const index = dropdown.selectedIndex;
          if (index < recentSearches.length) {
            onSelect(recentSearches[index].airport);
          } else {
            onSelect(results[index - recentSearches.length]);
          }
        }
        break;

      case "Escape":
        e.preventDefault();
        setDropdown({ show: false, selectedIndex: -1 });
        break;
    }
  };

  const loadFromCache = useCallback((): Airport[] | null => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  }, []);

  const saveToCache = useCallback((data: Airport[]) => {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  }, []);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const cachedData = loadFromCache();
        if (cachedData) {
          setAirports(cachedData);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          "https://raw.githubusercontent.com/algolia/datasets/master/airports/airports.json"
        );
        if (!response.ok) throw new Error("Failed to fetch airports data");

        const data = await response.json();
        setAirports(data);
        saveToCache(data);
      } catch (err) {
        setDataError("Failed to load airports data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAirports();
  }, [loadFromCache, saveToCache]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the click is on a search result
      if (target.closest(".airport-result")) {
        return;
      }

      if (!departureRef.current?.contains(target)) {
        setDepartureDropdown((prev) => ({ ...prev, show: false }));
      }
      if (!arrivalRef.current?.contains(target)) {
        setArrivalDropdown((prev) => ({ ...prev, show: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterAirports = useCallback(
    (searchTerm: string): Airport[] => {
      if (!searchTerm || searchTerm.length < 2) return [];
      return fuse
        .search(searchTerm)
        .map((result) => result.item)
        .slice(0, 5);
    },
    [fuse]
  );

  const departureResults = useMemo(
    () => filterAirports(departureSearch),
    [departureSearch, filterAirports]
  );

  const arrivalResults = useMemo(
    () => filterAirports(arrivalSearch),
    [arrivalSearch, filterAirports]
  );

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

  const calculateEmissions = (distance: number, flightDetails: FlightDetails): EmissionResults => {
    // Base emission factors (kg CO2 per km)
    const baseEmissionFactors = {
      regional: 0.14,
      narrowBody: 0.12,
      wideBody: 0.11,
    };

    // Cabin class multipliers
    const cabinClassMultipliers = {
      economy: 1,
      premium: 1.5,
      business: 2.5,
      first: 4,
    };

    // Get base emission factor based on aircraft type and distance
    let emissionFactor = baseEmissionFactors[flightDetails.aircraftType];

    // Apply cabin class multiplier
    emissionFactor *= cabinClassMultipliers[flightDetails.cabinClass];

    // Calculate per person emissions
    const perPerson = distance * emissionFactor;

    // Calculate total emissions for all passengers
    const total = perPerson * flightDetails.passengers;

    // Calculate round trip emissions if applicable
    const roundTrip = flightDetails.isRoundTrip ? total * 2 : total;

    return {
      perPerson,
      total,
      roundTrip,
    };
  };

  const handleCalculate = (): void => {
    setError(null);
    setResults(null);

    if (!selectedDeparture || !selectedArrival) {
      setError("Please select both airports");
      return;
    }

    setCalculating(true);

    try {
      const dist = calculateDistance(
        selectedDeparture._geoloc.lat,
        selectedDeparture._geoloc.lng,
        selectedArrival._geoloc.lat,
        selectedArrival._geoloc.lng
      );

      const emissionResults = calculateEmissions(dist, flightDetails);

      setResults({
        distance: dist,
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

  const handleSelectAirport = (
    airport: Airport,
    setSelected: React.Dispatch<React.SetStateAction<Airport | null>>,
    setSearch: React.Dispatch<React.SetStateAction<string>>,
    setDropdown: React.Dispatch<React.SetStateAction<DropdownState>>
  ) => {
    console.log("Selecting airport:", airport);
    setSelected(airport);
    setSearch(`${airport.name} (${airport.iata_code})`);
    saveRecentSearch(airport);

    // Delay closing the dropdown slightly to ensure the click event completes
    setTimeout(() => {
      setDropdown({ show: false, selectedIndex: -1 });
    }, 100);
  };

  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-500">Loading airports data...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{dataError}</AlertDescription>
        </Alert>
      </div>
    );
  }

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
            inputRef={departureRef}
            value={departureSearch}
            onChange={(e) => {
              setDepartureSearch(e.target.value);
              setDepartureDropdown((prev) => ({ ...prev, show: true }));
            }}
            onFocus={() =>
              setDepartureDropdown((prev) => ({ ...prev, show: true }))
            }
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                departureDropdown,
                setDepartureDropdown,
                departureResults,
                (airport) =>
                  handleSelectAirport(
                    airport,
                    setSelectedDeparture,
                    setDepartureSearch,
                    setDepartureDropdown
                  ),
                recentSearches
              )
            }
            placeholder="Search for departure airport..."
            label="Departure Airport"
            showDropdown={departureDropdown.show}
            results={departureResults}
            selectedIndex={departureDropdown.selectedIndex}
            searchTerm={departureSearch}
            onSelect={(airport) =>
              handleSelectAirport(
                airport,
                setSelectedDeparture,
                setDepartureSearch,
                setDepartureDropdown
              )
            }
            recentSearches={recentSearches}
            onRecentSelect={(airport) =>
              handleSelectAirport(
                airport,
                setSelectedDeparture,
                setDepartureSearch,
                setDepartureDropdown
              )
            }
            onRecentRemove={removeRecentSearch}
          />

          <AirportSearchInput
            inputRef={arrivalRef}
            value={arrivalSearch}
            onChange={(e) => {
              setArrivalSearch(e.target.value);
              setArrivalDropdown((prev) => ({ ...prev, show: true }));
            }}
            onFocus={() =>
              setArrivalDropdown((prev) => ({ ...prev, show: true }))
            }
            onKeyDown={(e) =>
              handleKeyDown(
                e,
                arrivalDropdown,
                setArrivalDropdown,
                arrivalResults,
                (airport) =>
                  handleSelectAirport(
                    airport,
                    setSelectedArrival,
                    setArrivalSearch,
                    setArrivalDropdown
                  ),
                recentSearches
              )
            }
            placeholder="Search for arrival airport..."
            label="Arrival Airport"
            showDropdown={arrivalDropdown.show}
            results={arrivalResults}
            selectedIndex={arrivalDropdown.selectedIndex}
            searchTerm={arrivalSearch}
            onSelect={(airport) =>
              handleSelectAirport(
                airport,
                setSelectedArrival,
                setArrivalSearch,
                setArrivalDropdown
              )
            }
            recentSearches={recentSearches}
            onRecentSelect={(airport) =>
              handleSelectAirport(
                airport,
                setSelectedArrival,
                setArrivalSearch,
                setArrivalDropdown
              )
            }
            onRecentRemove={removeRecentSearch}
          />

          <FlightDetailsForm
            flightDetails={flightDetails}
            onChange={(details) => setFlightDetails(details)}
          />

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
                    {results.flightDetails.passengers} passenger(s),{' '}
                    {results.flightDetails.isRoundTrip ? 'Round Trip' : 'One Way'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {results.flightDetails.cabinClass.charAt(0).toUpperCase() +
                      results.flightDetails.cabinClass.slice(1)}{' '}
                    Class
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="font-semibold">{formatNumber(results.distance, 0)} km</p>
                  <p className="text-sm text-gray-500">
                    {results.flightDetails.isRoundTrip
                      ? `${formatNumber(results.distance * 2, 0)} km round trip`
                      : 'one way'}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CO2Calculator;
