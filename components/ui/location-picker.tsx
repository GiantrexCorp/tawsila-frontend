"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
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

function LocationMarker({ onLocationChange }: { onLocationChange: (lat: string, lng: string) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export function LocationPicker({ latitude, longitude, onLocationChange, disabled = false, height = "400px" }: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  
  // Default to Cairo, Egypt
  const defaultCenter: [number, number] = [30.0444, 31.2357];
  
  // Parse current coordinates or use default
  const center: [number, number] = 
    latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))
      ? [parseFloat(latitude), parseFloat(longitude)]
      : defaultCenter;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-full bg-muted rounded-lg flex items-center justify-center`} style={{ height }}>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border-2 border-muted relative" style={{ height }}>
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
        {!disabled && <LocationMarker onLocationChange={onLocationChange} />}
        {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
          <Marker position={[parseFloat(latitude), parseFloat(longitude)]} />
        )}
      </MapContainer>
      {!disabled && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg z-[1000] text-sm">
          <p className="font-medium">📍 Click on the map to set location</p>
          {latitude && longitude && (
            <p className="text-xs text-muted-foreground mt-1">
              {latitude}, {longitude}
            </p>
          )}
        </div>
      )}
      {disabled && latitude && longitude && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg z-[1000] text-sm">
          <p className="text-xs text-muted-foreground">
            {latitude}, {longitude}
          </p>
        </div>
      )}
    </div>
  );
}

