import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Phone, Clock, MapPin, GitCompareArrows, IndianRupee, Database, Route } from "lucide-react";
import {
  type HealthCenter,
  type CenterType,
  CENTER_TYPE_CONFIG,
  getDirectionsUrl,
} from "@/lib/healthCenters";
import type { Disease } from "@/lib/diseases";

interface HealthCenterListProps {
  centers: HealthCenter[];
  selectedCenter: HealthCenter | null;
  onSelectCenter: (center: HealthCenter) => void;
  filter: CenterType | "all";
  onFilterChange: (filter: CenterType | "all") => void;
  bestDisease?: Disease | null;
  compareIds?: string[];
  onToggleCompare?: (id: string) => void;
  userLocation?: [number, number] | null;
}

const HealthCenterList = ({
  centers,
  selectedCenter,
  onSelectCenter,
  filter,
  onFilterChange,
  bestDisease,
  compareIds = [],
  onToggleCompare,
  userLocation,
}: HealthCenterListProps) => {
  const filteredCenters =
    filter === "all" ? centers : centers.filter((c) => c.type === filter);

  const filterOptions: Array<{ value: CenterType | "all"; label: string; emoji?: string }> = [
    { value: "all", label: "All" },
    ...Object.entries(CENTER_TYPE_CONFIG).map(([key, config]) => ({
      value: key as CenterType,
      label: config.label,
      emoji: config.emoji,
    })),
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto p-3 pb-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              filter === opt.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50"
            }`}
          >
            {opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="px-3 pb-2">
        <p className="text-xs text-muted-foreground">
          {filteredCenters.length} center{filteredCenters.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 px-3 pb-3">
        <div className="space-y-2">
          {filteredCenters.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <MapPin className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No centers found with this filter.
            </div>
          ) : (
            filteredCenters.map((center, index) => {
              const config = CENTER_TYPE_CONFIG[center.type];
              const isSelected = selectedCenter?.id === center.id;

              return (
                <Card
                  key={center.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "border-primary ring-1 ring-primary/20"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => onSelectCenter(center)}
                >
                  <CardContent className="p-3">
                    {bestDisease && index < 3 && (
                      <Badge className="mb-2 bg-primary text-primary-foreground">
                        Best for {bestDisease.name} — #{index + 1}
                      </Badge>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span>{config.emoji}</span>
                          <h4 className="font-medium text-sm truncate">{center.name}</h4>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          <MapPin className="mr-0.5 inline h-3 w-3" />
                          {center.city} — {center.address}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {center.rating}
                          </span>
                          {center.distance && (
                            <span className="font-medium text-primary">{center.distance} away</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {center.openHours.split(",")[0]}
                          </span>
                        </div>

                        {center.phone && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <a
                              href={`tel:${center.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-foreground hover:underline"
                            >
                              {center.phone}
                            </a>
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {center.avgTreatmentCostInr && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                              <IndianRupee className="h-2.5 w-2.5" />
                              {center.avgTreatmentCostInr.toLocaleString("en-IN")}
                              <span className="text-amber-600" title="Simulated data">·sim</span>
                            </Badge>
                          )}
                          {center.source === "osm" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                              <Database className="h-2.5 w-2.5" />
                              OSM live
                            </Badge>
                          )}
                          {center.services.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {s}
                            </Badge>
                          ))}
                          {center.services.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              +{center.services.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 flex gap-1.5">
                          <a
                            href={getDirectionsUrl(center, userLocation)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground transition-all hover:bg-primary/90"
                          >
                            <Route className="h-3 w-3" />
                            Directions
                          </a>
                          {onToggleCompare && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleCompare(center.id);
                              }}
                              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
                                compareIds.includes(center.id)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:border-primary/50"
                              }`}
                            >
                              <GitCompareArrows className="h-3 w-3" />
                              {compareIds.includes(center.id) ? "Added to compare" : "Compare"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default HealthCenterList;
