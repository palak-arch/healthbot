import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MapPin, Locate } from "lucide-react";
import MapView from "@/components/health-centers/MapView";
import HealthCenterList from "@/components/health-centers/HealthCenterList";
import {
  healthCenters,
  sortByDistance,
  DEFAULT_CENTER,
  type HealthCenter,
  type CenterType,
} from "@/lib/healthCenters";

const HealthCenters = () => {
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(null);
  const [filter, setFilter] = useState<CenterType | "all">("all");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Try to get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("Geolocation not available:", error.message);
          setLocationError("Location access denied. Showing default area.");
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      setLocationError("Geolocation not supported by your browser.");
    }
  }, []);

  // Sort centers by distance if user location is available
  const sortedCenters = useMemo(() => {
    if (userLocation) {
      return sortByDistance(healthCenters, userLocation[0], userLocation[1]);
    }
    return healthCenters;
  }, [userLocation]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold">Health Centers</h1>
              <p className="text-[10px] text-muted-foreground">
                {userLocation
                  ? "Showing centers near you"
                  : "Find nearby health facilities"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {locationError && (
            <p className="text-xs text-muted-foreground hidden sm:block">{locationError}</p>
          )}
          {!userLocation && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                      setLocationError(null);
                    },
                    () => setLocationError("Location access denied.")
                  );
                }
              }}
            >
              <Locate className="h-4 w-4" />
              <span className="hidden sm:inline">Find Me</span>
            </Button>
          )}
        </div>
      </header>

      {/* Content: Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map (hidden on small screens, full on large) */}
        <div className="hidden lg:block lg:w-[60%]">
          <MapView
            centers={sortedCenters}
            selectedCenter={selectedCenter}
            onSelectCenter={setSelectedCenter}
            userLocation={userLocation || DEFAULT_CENTER}
          />
        </div>

        {/* List sidebar */}
        <div className="w-full lg:w-[40%] border-l bg-background flex flex-col overflow-hidden">
          <HealthCenterList
            centers={sortedCenters}
            selectedCenter={selectedCenter}
            onSelectCenter={setSelectedCenter}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>
      </div>

      {/* Mobile: Full-screen map when a center is selected */}
      {selectedCenter && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <header className="flex items-center justify-between border-b bg-background px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCenter(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to list
            </Button>
            <h2 className="font-display text-sm font-semibold truncate max-w-[200px]">
              {selectedCenter.name}
            </h2>
          </header>
          <MapView
            centers={sortedCenters}
            selectedCenter={selectedCenter}
            onSelectCenter={setSelectedCenter}
            userLocation={userLocation || DEFAULT_CENTER}
          />
        </div>
      )}
    </div>
  );
};

export default HealthCenters;
