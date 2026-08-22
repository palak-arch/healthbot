import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, Star, Navigation } from "lucide-react";
import {
  type HealthCenter,
  CENTER_TYPE_CONFIG,
  DEFAULT_CENTER,
} from "@/lib/healthCenters";

// Fix Leaflet default marker icons in Vite/webpack environments
// See: https://github.com/Leaflet/Leaflet/issues/4988
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createCenterIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        ${CENTER_TYPE_CONFIG[
          Object.entries(CENTER_TYPE_CONFIG).find(([, v]) => v.color === color)?.[0] as keyof typeof CENTER_TYPE_CONFIG
        ]?.emoji || "📍"}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

function createLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #3b82f6;
        border: 3px solid white;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.15), 0 2px 8px rgba(0,0,0,0.3); }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/** Component that flies to a selected center */
function FlyToCenter({ center }: { center: HealthCenter | null }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 16, { duration: 1 });
    }
  }, [center, map]);

  return null;
}

/** Component that centers map on user's location */
function LocateUserButton() {
  const map = useMap();

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 14 });
  };

  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-4 right-4 z-[1000] flex h-10 w-10 items-center justify-center rounded-lg bg-background border shadow-md hover:bg-accent transition-colors"
      title="Find my location"
    >
      <Navigation className="h-4 w-4" />
    </button>
  );
}

interface MapViewProps {
  centers: HealthCenter[];
  selectedCenter: HealthCenter | null;
  onSelectCenter: (center: HealthCenter) => void;
  userLocation: [number, number] | null;
}

const MapView = ({ centers, selectedCenter, onSelectCenter, userLocation }: MapViewProps) => {
  const center = userLocation || DEFAULT_CENTER;

  const markerIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    Object.entries(CENTER_TYPE_CONFIG).forEach(([key, config]) => {
      icons.set(key, createCenterIcon(config.color));
    });
    return icons;
  }, []);

  const userIcon = useMemo(() => createLocationIcon(), []);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center text-sm font-medium">📍 Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Health center markers */}
        {centers.map((c) => {
          const icon = markerIcons.get(c.type);
          if (!icon) return null;

          const config = CENTER_TYPE_CONFIG[c.type];

          return (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectCenter(c),
              }}
            >
              <Popup maxWidth={280}>
                <div className="min-w-[220px] space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm">{c.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {config.emoji} {config.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600">{c.address}</p>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{c.rating}</span>
                    {c.distance && (
                      <span className="ml-2 text-primary font-medium">{c.distance}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{c.openHours}</span>
                  </div>

                  {c.phone && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${c.phone}`} className="text-primary hover:underline">
                        {c.phone}
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.services.map((s) => (
                      <span
                        key={s}
                        className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FlyToCenter center={selectedCenter} />
        <LocateUserButton />
      </MapContainer>
    </div>
  );
};

export default MapView;
