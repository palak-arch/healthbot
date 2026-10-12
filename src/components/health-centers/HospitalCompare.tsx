import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Star, BedDouble, Users, IndianRupee, ShieldCheck } from "lucide-react";
import { type HealthCenter, CENTER_TYPE_CONFIG } from "@/lib/healthCenters";

/**
 * Side-by-side hospital comparison.
 * Verifiable metrics: services count, open hours, phone, location (OSM or curated).
 * Simulated metrics (clearly labelled): avg treatment cost, beds, patient volume.
 */
interface HospitalCompareProps {
  centers: HealthCenter[];
  onClose: () => void;
}

const HospitalCompare = ({ centers, onClose }: HospitalCompareProps) => {
  if (centers.length < 2) return null;

  const metrics: Array<{
    label: string;
    simulated?: boolean;
    render: (c: HealthCenter) => React.ReactNode;
  }> = [
    {
      label: "Type",
      render: (c) => (
        <span>
          {CENTER_TYPE_CONFIG[c.type].emoji} {CENTER_TYPE_CONFIG[c.type].label}
        </span>
      ),
    },
    {
      label: "Location",
      render: (c) => (
        <span className="text-xs">
          {c.city}
          {c.distance ? ` · ${c.distance} away` : ""}
        </span>
      ),
    },
    {
      label: "Avg treatment cost",
      simulated: true,
      render: (c) =>
        c.avgTreatmentCostInr ? (
          <span className="font-medium">
            <IndianRupee className="inline h-3 w-3" />
            {c.avgTreatmentCostInr.toLocaleString("en-IN")}
          </span>
        ) : (
          <span className="text-muted-foreground">Unknown</span>
        ),
    },
    {
      label: "Total beds",
      simulated: true,
      render: (c) =>
        c.beds ? (
          <span className="flex items-center gap-1 font-medium">
            <BedDouble className="h-3.5 w-3.5" />
            {c.beds.toLocaleString("en-IN")}
          </span>
        ) : (
          <span className="text-muted-foreground">Unknown</span>
        ),
    },
    {
      label: "Patients treated / yr",
      simulated: true,
      render: (c) =>
        c.annualPatients ? (
          <span className="flex items-center gap-1 font-medium">
            <Users className="h-3.5 w-3.5" />
            {c.annualPatients.toLocaleString("en-IN")}
          </span>
        ) : (
          <span className="text-muted-foreground">Unknown</span>
        ),
    },
    {
      label: "Specialties",
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.services.slice(0, 6).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      label: "Hours",
      render: (c) => <span className="text-xs">{c.openHours}</span>,
    },
    {
      label: "Contact",
      render: (c) =>
        c.phone ? (
          <a href={`tel:${c.phone}`} className="text-xs text-primary hover:underline">
            {c.phone}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Not listed</span>
        ),
    },
    {
      label: "User rating",
      simulated: true,
      render: (c) =>
        c.rating > 0 ? (
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            {c.rating}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not rated</span>
        ),
    },
    {
      label: "Data source",
      render: (c) => (
        <Badge variant={c.source === "osm" ? "default" : "secondary"} className="text-[10px]">
          {c.source === "osm" ? "OpenStreetMap (real)" : "Curated (simulated)"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-display text-sm font-semibold">Hospital Comparison</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-auto max-h-[calc(85vh-52px)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Metric</th>
                {centers.map((c) => (
                  <th key={c.id} className="px-3 py-2 text-left font-semibold text-xs">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={m.label} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                  <td className="px-3 py-2 text-xs text-muted-foreground align-top">
                    {m.label}
                    {m.simulated && (
                      <span
                        className="ml-1 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 text-[9px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        title="Simulated data for demo — not verified"
                      >
                        sim
                      </span>
                    )}
                  </td>
                  {centers.map((c) => (
                    <td key={c.id} className="px-3 py-2 align-top">
                      {m.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-1.5 border-t bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          "sim" = simulated demo data, not verified. Location, hours and contact come from real records.
        </div>
      </div>
    </div>
  );
};

export default HospitalCompare;
