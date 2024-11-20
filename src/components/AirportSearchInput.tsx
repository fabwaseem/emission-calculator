import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, Clock, X } from "lucide-react";
import { Airport, DropdownState, RecentSearch } from "../../types";
import Fuse from "fuse.js";
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const highlightText = (text: string, query: string): JSX.Element => {
  if (!query) return <span>{text}</span>;

  try {
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
    return <span>{text}</span>;
  }
};

interface AirportSearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  label: string;
  searchTerm: string;
  onSelect: (airport: Airport) => void;
}

const AirportSearchInput: React.FC<AirportSearchInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  searchTerm,
  onSelect,
}) => {
  const CACHE_KEY = "airports_data";
  const RECENT_SEARCHES_KEY = "recent_airport_searches";
  const CACHE_DURATION = 24 * 60 * 60 * 1000;
  const MAX_RECENT_SEARCHES = 5;

  const [airports, setAirports] = useState<Airport[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [dropdown, setDropdown] = useState<DropdownState>({
    show: false,
    selectedIndex: -1,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(airports, {
      keys: ["name", "city", "country", "iata_code"],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 2,
    });
  }, [airports]);

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

  const results = useMemo(
    () => filterAirports(searchTerm),
    [searchTerm, filterAirports]
  );

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
        console.log(err);
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

      if (!inputRef.current?.contains(target)) {
        setDropdown((prev) => ({ ...prev, show: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAirport = (
    airport: Airport,
    onSelect: (airport: Airport) => void,
    setDropdown: React.Dispatch<React.SetStateAction<DropdownState>>
  ) => {
    onSelect(airport);
    saveRecentSearch(airport);
    // Delay closing the dropdown slightly to ensure the click event completes
    setTimeout(() => {
      setDropdown({ show: false, selectedIndex: -1 });
    }, 100);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setDropdown({ show: true, selectedIndex: -1 })}
          onKeyDown={(e) =>
            handleKeyDown(
              e,
              dropdown,
              setDropdown,
              results,
              onSelect,
              recentSearches
            )
          }
          className="w-full p-2 border rounded-md pr-8"
          placeholder={placeholder}
        />
        <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />

        {dropdown.show && (
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
                    ${index === dropdown.selectedIndex ? "bg-gray-100" : ""}`}
                  >
                    <div
                      className="flex-1"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleSelectAirport(
                          recent.airport,
                          onSelect,
                          setDropdown
                        );
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
                        removeRecentSearch(recent.id);
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
                  index + recentSearches.length === dropdown.selectedIndex
                    ? "bg-gray-100"
                    : ""
                }`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleSelectAirport(airport, onSelect, setDropdown);
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
};

export default AirportSearchInput;
