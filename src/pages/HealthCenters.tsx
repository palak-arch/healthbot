import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Locate,
  Search,
  Star,
  Sparkles,
  Loader2,
  Wifi,
  Database,
  AlertTriangle,
  GitCompareArrows,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MapView from "@/components/health-centers/MapView";
import HealthCenterList from "@/components/health-centers/HealthCenterList";
import HospitalCompare from "@/components/health-centers/HospitalCompare";
import {
  healthCenters,
  sortByDistance,
  DEFAULT_CENTER,
  type HealthCenter,
  type CenterType,
} from "@/lib/healthCenters";
import { diseases, findBestCentersForDisease, type Disease } from "@/lib/diseases";
import { fetchNearbyCenters, geocodePlace } from "@/lib/overpass";
import { sendSearchParse } from "@/lib/api";

const BUDGET_OPTIONS = [
  { value: 0, label: "Any budget" },
  { value: 25000, label: "Under ₹25,000" },
  { value: 50000, label: "Under ₹50,000" },
  { value: 100000, label: "Under ₹1 lakh" },
  { value: 200000, label: "Under ₹2 lakh" },
  { value: 500000, label: "Under ₹5 lakh" },
];

const HealthCenters = () => {
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(null);
  const [filter, setFilter] = useState<CenterType | "all">("all");
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [budgetMax, setBudgetMax] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // NL search state
  const [nlQuery, setNlQuery] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlResult, setNlResult] = useState<{
    disease: string | null;
    location: string | null;
    budgetInr: number | null;
    priority: string | null;
    source: string;
  } | null>(null);
  const [nlError, setNlError] = useState<string | null>(null);

  // OSM nearby state
  const [osmCenters, setOsmCenters] = useState<HealthCenter[]>([]);
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmError, setOsmError] = useState<string | null>(null);

  // Comparison state
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Try to get user's current location, then load real OSM hospitals nearby
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setLocationError("Location off — showing top hospitals across India. Use the search box to find your city.");
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      setLocationError("Geolocation not supported — showing top hospitals across India.");
    }
  }, []);

  // When we get a location, fetch REAL nearby facilities from OpenStreetMap
  useEffect(() => {
    if (!userLocation) return;
    const controller = new AbortController();
    setOsmLoading(true);
    setOsmError(null);
    fetchNearbyCenters(userLocation[0], userLocation[1], 25, controller.signal)
      .then((centers) => setOsmCenters(centers))
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Overpass fetch failed:", err.message);
          setOsmError("Could not load live map data — showing curated list only.");
        }
      })
      .finally(() => setOsmLoading(false));
    return () => controller.abort();
  }, [userLocation]);

  // Combined list: curated India hospitals + live OSM nearby
  const allCenters = useMemo(() => {
    return [...healthCenters, ...osmCenters];
  }, [osmCenters]);

  // Apply distance sort, disease ranking, and budget filter
  const sortedCenters = useMemo(() => {
    let list = userLocation
      ? sortByDistance(allCenters, userLocation[0], userLocation[1])
      : allCenters;

    if (selectedDisease) {
      list = findBestCentersForDisease(list, selectedDisease);
    }

    if (budgetMax > 0) {
      // Simulated cost data: hospitals have avgTreatmentCostInr; OSM ones don't.
      list = list.filter((c) => {
        if (c.source === "osm") return true; // can't filter what we don't know — keep visible
        const cost = c.avgTreatmentCostInr ?? Infinity;
        return cost <= budgetMax;
      });
    }

    return list;
  }, [allCenters, userLocation, selectedDisease, budgetMax]);

  const visibleDiseases = useMemo(() => {
    const q = diseaseSearch.trim().toLowerCase();
    if (!q) return diseases;
    return diseases.filter(
      (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
    );
  }, [diseaseSearch]);

  const compareCenters = useMemo(
    () => sortedCenters.filter((c) => compareIds.includes(c.id)).slice(0, 3),
    [sortedCenters, compareIds]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  // ─── AI natural language search ──────────────────────────────
  const runNlSearch = async () => {
    const q = nlQuery.trim();
    if (!q || nlLoading) return;
    setNlLoading(true);
    setNlError(null);
    setNlResult(null);

    try {
      const parsed = await sendSearchParse(q);
      setNlResult(parsed);

      // Apply extracted filters
      if (parsed.disease) {
        const d = diseases.find((x) => x.id === parsed.disease);
        if (d) setSelectedDisease(d);
      } else {
        setSelectedDisease(null);
      }
      if (parsed.budgetInr) {
        setBudgetMax(parsed.budgetInr);
      }

      // Geocode the location and fetch real hospitals there
      if (parsed.location) {
        const coords = await geocodePlace(parsed.location);
        if (coords) {
          setUserLocation(coords);
          setOsmLoading(true);
          setOsmError(null);
          fetchNearbyCenters(coords[0], coords[1], 50)
            .then((centers) => {
              setOsmCenters(centers);
              setOsmLoading(false);
            })
            .catch(() => {
              setOsmError("Could not load live map data for that place.");
              setOsmLoading(false);
            });
        }
      }
    } catch (err) {
      setNlError("AI search failed — try picking filters manually.");
    } finally {
      setNlLoading(false);
    }
  };

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
              <h1 className="font-display text-sm font-semibold">Hospital Finder</h1>
              <p className="text-[10px] text-muted-foreground">
                {osmLoading
                  ? "Loading live map data..."
                  : osmCenters.length > 0
                    ? `${osmCenters.length} real places near you + India's top hospitals`
                    : "Disease, location and budget search"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {locationError && (
            <p className="text-xs text-muted-foreground hidden sm:block max-w-[260px] truncate" title={locationError}>
              {locationError}
            </p>
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

      {/* AI NL search + filters */}
      <div className="border-b bg-background px-4 py-3 shrink-0 space-y-2">
        {/* AI natural language search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runNlSearch()}
              placeholder='AI search: "kidney hospital near Chandigarh under 2 lakh"'
              className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <Button size="sm" onClick={runNlSearch} disabled={nlLoading || !nlQuery.trim()} className="gap-1.5">
            {nlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Search
          </Button>
        </div>

        {/* Parsed filters result (explainability) */}
        {nlResult && (
          <div className="rounded-md bg-primary/10 px-3 py-2 text-xs">
            <p className="font-medium">
              AI understood:{" "}
              {[
                nlResult.disease && `disease = ${nlResult.disease}`,
                nlResult.location && `location = ${nlResult.location}`,
                nlResult.budgetInr && `budget = under ₹${nlResult.budgetInr.toLocaleString("en-IN")}`,
                nlResult.priority && `priority = ${nlResult.priority}`,
              ]
                .filter(Boolean)
                .join(" · ") || "no specific filters"}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Extracted by {nlResult.source === "gemini" ? "Gemini AI" : "keyword matching"}. Adjust anything below.
            </p>
          </div>
        )}
        {nlError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{nlError}</p>
        )}

        {/* Disease search + chips */}
        <div className="flex gap-2">
          <div className="relative w-48 shrink-0">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={diseaseSearch}
              onChange={(e) => setDiseaseSearch(e.target.value)}
              placeholder="Filter diseases"
              className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-2 text-xs outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDisease(null)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                selectedDisease === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              No filter
            </button>
            {visibleDiseases.map((disease) => (
              <button
                key={disease.id}
                onClick={() => setSelectedDisease(selectedDisease?.id === disease.id ? null : disease)}
                title={disease.description}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedDisease?.id === disease.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                {disease.name}
              </button>
            ))}
          </div>
          {/* Budget filter */}
          <select
            value={budgetMax}
            onChange={(e) => setBudgetMax(Number(e.target.value))}
            className="shrink-0 rounded-lg border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
            title="Budget filter (simulated cost data)"
          >
            {BUDGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {selectedDisease && (
          <p className="rounded-md bg-primary/10 px-3 py-2 text-xs text-foreground">
            <span className="font-semibold">{selectedDisease.name}:</span> {selectedDisease.description} Best
            places to treat it are now at the top of the list.
          </p>
        )}
      </div>

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
            bestDisease={selectedDisease}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            userLocation={userLocation}
          />
        </div>
      </div>

      {/* Data provenance footer */}
      <div className="flex items-center gap-3 border-t bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          Curated list: simulated cost/outcome data (demo)
        </span>
        <span className="flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          Nearby: live OpenStreetMap data (real, ODbL)
        </span>
        {osmLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        {osmError && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            {osmError}
          </span>
        )}
      </div>

      {/* Comparison bar */}
      {compareIds.length > 0 && (
        <div className="flex items-center gap-3 border-t bg-background px-4 py-2 shrink-0">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">{compareIds.length} selected (max 3)</span>
          <Button size="sm" onClick={() => setCompareIds([])} variant="ghost" className="h-7 text-xs">
            Clear
          </Button>
        </div>
      )}

      {/* Comparison modal */}
      {compareCenters.length >= 2 && (
        <HospitalCompare centers={compareCenters} onClose={() => setCompareIds([])} />
      )}

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
