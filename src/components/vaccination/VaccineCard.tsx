import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, AlertTriangle, Syringe, Info } from "lucide-react";
import type { Vaccine } from "@/lib/vaccinationSchedules";
import type { VaccinationRecord } from "@/hooks/useVaccinations";

interface VaccineCardProps {
  vaccine: Vaccine;
  record?: VaccinationRecord;
  onMarkCompleted?: (id: string) => void;
  onAddRecord?: (vaccine: Vaccine) => void;
}

const statusConfig = {
  completed: {
    label: "Completed",
    variant: "success" as const,
    icon: Check,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  scheduled: {
    label: "Scheduled",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
  },
  overdue: {
    label: "Overdue",
    variant: "destructive" as const,
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

const VaccineCard = ({ vaccine, record, onMarkCompleted, onAddRecord }: VaccineCardProps) => {
  const status = record?.status || "scheduled";
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={`transition-all hover:shadow-md ${status === "completed" ? "border-success/30 bg-success/5" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title & Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display font-semibold text-foreground">{vaccine.name}</h4>
              <Badge variant={config.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>

            {/* Description */}
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {vaccine.description}
            </p>

            {/* Schedule Info */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Syringe className="h-3 w-3" />
                {vaccine.doses}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {vaccine.schedule}
              </span>
              {vaccine.notes && (
                <span className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {vaccine.notes}
                </span>
              )}
            </div>

            {/* Date administered */}
            {record?.date_administered && (
              <p className="mt-2 text-xs text-success font-medium">
                ✓ Administered on {new Date(record.date_administered).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            {status === "completed" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="h-5 w-5" />
              </div>
            ) : record && onMarkCompleted ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkCompleted(record.id)}
                className="gap-1 border-success/30 text-success hover:bg-success/10"
              >
                <Check className="h-4 w-4" />
                Mark Done
              </Button>
            ) : onAddRecord ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddRecord(vaccine)}
                className="gap-1"
              >
                <Clock className="h-4 w-4" />
                Add
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VaccineCard;
