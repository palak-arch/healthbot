import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, AlertTriangle, Syringe } from "lucide-react";
import type { VaccinationRecord } from "@/hooks/useVaccinations";
import { vaccinationSchedules, type AgeGroup } from "@/lib/vaccinationSchedules";

interface ProgressOverviewProps {
  records: VaccinationRecord[];
  selectedAgeGroup: AgeGroup;
}

const ProgressOverview = ({ records, selectedAgeGroup }: ProgressOverviewProps) => {
  const schedule = vaccinationSchedules.find((s) => s.ageGroup === selectedAgeGroup);
  if (!schedule) return null;

  const totalVaccines = schedule.vaccines.length;

  // Count records that match vaccines in this age group
  const vaccineNames = schedule.vaccines.map((v) => v.name.toLowerCase());
  const relevantRecords = records.filter((r) =>
    vaccineNames.includes(r.vaccine_name.toLowerCase())
  );

  const completed = relevantRecords.filter((r) => r.status === "completed").length;
  const scheduled = relevantRecords.filter((r) => r.status === "scheduled").length;
  const overdue = relevantRecords.filter((r) => r.status === "overdue").length;
  const notAdded = totalVaccines - relevantRecords.length;

  const progressPercent = totalVaccines > 0 ? Math.round((completed / totalVaccines) * 100) : 0;

  const stats = [
    {
      label: "Completed",
      value: completed,
      icon: Check,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Scheduled",
      value: scheduled,
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Overdue",
      value: overdue,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Not Added",
      value: notAdded,
      icon: Syringe,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">Overall Progress</h3>
            <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {completed} of {totalVaccines} vaccines completed for {schedule.label}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProgressOverview;
