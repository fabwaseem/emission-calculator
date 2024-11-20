import { X } from "lucide-react";
import React, { useState } from "react";
import { Airport } from "../../types";
import AirportSearchInput from "./AirportSearchInput";

interface StopoverInputProps {
  index: number;
  stopover: { airport: Airport; searchTerm: string } | null;
  onSelect: (airport: Airport, searchTerm: string) => void;
  onRemove: () => void;
  distance: number;
}

const StopoverInput: React.FC<StopoverInputProps> = ({
  index,
  onSelect,
  stopover,
  onRemove,
  distance,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <div className="relative border-l-2 border-blue-200 pl-4 ml-2">
      <div className="absolute -left-2 top-1/2 w-4 h-0.5 bg-blue-200" />
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <AirportSearchInput
            value={stopover?.searchTerm || ""}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            placeholder="Search for stopover airport..."
            label={`Stopover ${index + 1}`}
            searchTerm={searchTerm}
            onSelect={(airport) => {
              onSelect(airport, searchTerm);
            }}
          />
          {stopover && (
            <div className="text-sm text-gray-500 mt-1">
              +{Math.round(distance)} km
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="mt-8 p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default StopoverInput;
