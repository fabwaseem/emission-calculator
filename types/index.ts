export type Airport = {
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
};

export type EmissionResults = {
  perPerson: number;
  total: number;
  roundTrip: number;
  breakdown: {
    baseEmissions: number;
    cabinClassImpact: number;
    loadFactor: number;
  };
};

export type FlightDetails = {
  passengers: number;
  isRoundTrip: boolean;
  cabinClass: "economy" | "premium" | "business" | "first";
  aircraftType: "regional" | "narrowBody" | "wideBody";
  loadFactor: number;
};

export type CalculationResults = {
  distance: number;
  emissions: EmissionResults;
  departure: Airport;
  arrival: Airport;
  flightDetails: FlightDetails;
};

export type DropdownState = {
  show: boolean;
  selectedIndex: number;
};

export type RecentSearch = {
  id: string;
  airport: Airport;
  timestamp: number;
};

export type FlightRoute = {
  departure: Airport;
  arrival: Airport;
  distance: number;
};

export type FlightPath = {
  mainRoute: FlightRoute;
  stopovers: ({ airport: Airport; searchTerm: string } | null)[];
};

export type SavedFlightCalculation = {
  id: string;
  timestamp: number;
  flightPath: FlightPath;
  flightDetails: FlightDetails;
  emissions: EmissionResults;
  totalDistance: number;
};
