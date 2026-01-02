"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from './input';
import { Button } from './button';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for default marker icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string) => void;
  disabled?: boolean;
  height?: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
}

function DraggableMarker({ 
  position, 
  onPositionChange 
}: { 
  position: L.LatLng | null; 
  onPositionChange: (lat: string, lng: string) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onPositionChange(newPos.lat.toFixed(6), newPos.lng.toFixed(6));
        }
      },
    }),
    [onPositionChange],
  );

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    },
  });

  if (!position) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

export function LocationPicker({ latitude, longitude, onLocationChange, disabled = false, height = "400px" }: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Default to Cairo, Egypt
  const defaultCenter: [number, number] = [30.0444, 31.2357];
  
  // Parse current coordinates or use default
  const center: [number, number] = 
    latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))
      ? [parseFloat(latitude), parseFloat(longitude)]
      : defaultCenter;

  const position = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))
    ? L.latLng(parseFloat(latitude), parseFloat(longitude))
    : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowResults(true);
    
    try {
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=eg`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onLocationChange(parseFloat(result.lat).toFixed(6), parseFloat(result.lon).toFixed(6));
    setShowResults(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (!mounted) {
    return (
      <div className={`w-full bg-muted rounded-lg flex items-center justify-center`} style={{ height }}>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Search Bar */}
      {!disabled && (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for a location (e.g., Cairo, Nasr City, etc.)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
                disabled={isSearching}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => {
                    setSearchQuery('');
                    setShowResults(false);
                    setSearchResults([]);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button
              type="button"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-[2000] max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0 flex items-start gap-2"
                >
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {showResults && searchResults.length === 0 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-[2000] p-4 text-center text-sm text-muted-foreground">
              No results found. Try a different search term.
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className={cn(
        "w-full rounded-lg overflow-hidden border-2 border-muted relative isolate",
        disabled && "opacity-75 pointer-events-none"
      )} style={{ height, zIndex: 0 }}>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={center} />
          {!disabled && <DraggableMarker position={position} onPositionChange={onLocationChange} />}
          {disabled && position && <Marker position={position} />}
        </MapContainer>
        
        {/* Map Instructions */}
        {!disabled && (
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-lg z-[1000] border">
            <p className="font-medium text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Click or drag marker to set location
            </p>
            {latitude && longitude && (
              <p className="text-xs text-muted-foreground mt-1">
                Current: {latitude}, {longitude}
              </p>
            )}
          </div>
        )}
        
        {disabled && latitude && longitude && (
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-lg z-[1000] border">
            <p className="text-xs text-muted-foreground">
              {latitude}, {longitude}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

