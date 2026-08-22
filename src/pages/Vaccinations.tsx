import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, Syringe, ListChecks, Plus } from "lucide-react";
import VaccineCard from "@/components/vaccination/VaccineCard";
import ProgressOverview from "@/components/vaccination/ProgressOverview";
import { useVaccinations } from "@/hooks/useVaccinations";
import {
  vaccinationSchedules,
  AGE_GROUP_LABELS,
  type AgeGroup,
  type Vaccine,
} from "@/lib/vaccinationSchedules";

const AGE_GROUP_ICONS: Record<AgeGroup, string> = {
  infant: "👶",
  child: "🧒",
  adolescent: "🧑",
  adult: "🧑‍🦳",
};

type TabId = "schedule" | "records";

const Vaccinations = () => {
  const { records, isLoading, markCompleted, addRecord, deleteRecord } = useVaccinations();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup>("infant");
  const [activeTab, setActiveTab] = useState<TabId>("schedule");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVaccine, setNewVaccine] = useState({
    vaccine_name: "",
    scheduled_date: "",
    notes: "",
  });

  const currentSchedule = vaccinationSchedules.find((s) => s.ageGroup === selectedAgeGroup);

  // Match records to vaccines by name
  const findRecordForVaccine = (vaccine: Vaccine) => {
    return records.find(
      (r) => r.vaccine_name.toLowerCase() === vaccine.name.toLowerCase()
    );
  };

  // Handle adding a custom record
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaccine.vaccine_name.trim()) return;

    try {
      await addRecord({
        vaccine_name: newVaccine.vaccine_name,
        scheduled_date: newVaccine.scheduled_date || undefined,
        status: "scheduled",
        notes: newVaccine.notes || undefined,
      });
      setNewVaccine({ vaccine_name: "", scheduled_date: "", notes: "" });
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add record:", err);
    }
  };

  // Pre-fill add form from a schedule vaccine
  const handleAddFromSchedule = (vaccine: Vaccine) => {
    setNewVaccine({
      vaccine_name: vaccine.name,
      scheduled_date: "",
      notes: "",
    });
    setShowAddForm(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Syringe className="h-4 w-4" />
              </div>
              <div>
                <h1 className="font-display text-sm font-semibold">Vaccination Tracker</h1>
                <p className="text-[10px] text-muted-foreground">Track & manage immunizations</p>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            className="gap-1"
            onClick={() => {
              setNewVaccine({ vaccine_name: "", scheduled_date: "", notes: "" });
              setShowAddForm(!showAddForm);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Record
          </Button>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Progress Overview */}
          <ProgressOverview records={records} selectedAgeGroup={selectedAgeGroup} />

          {/* Add Record Form */}
          {showAddForm && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="font-display text-lg">Add Vaccination Record</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddRecord} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Vaccine Name *</label>
                      <input
                        type="text"
                        value={newVaccine.vaccine_name}
                        onChange={(e) =>
                          setNewVaccine((prev) => ({ ...prev, vaccine_name: e.target.value }))
                        }
                        placeholder="e.g., MMR Vaccine"
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Scheduled Date</label>
                      <input
                        type="date"
                        value={newVaccine.scheduled_date}
                        onChange={(e) =>
                          setNewVaccine((prev) => ({ ...prev, scheduled_date: e.target.value }))
                        }
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <input
                      type="text"
                      value={newVaccine.notes}
                      onChange={(e) =>
                        setNewVaccine((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Optional notes..."
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Save Record
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Age Group Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {vaccinationSchedules.map((schedule) => (
              <button
                key={schedule.ageGroup}
                onClick={() => setSelectedAgeGroup(schedule.ageGroup)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedAgeGroup === schedule.ageGroup
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <span>{AGE_GROUP_ICONS[schedule.ageGroup]}</span>
                {schedule.label}
              </button>
            ))}
          </div>

          {/* View Tabs */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "schedule"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Syringe className="h-4 w-4" />
              Recommended Schedule
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "records"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListChecks className="h-4 w-4" />
              My Records
            </button>
          </div>

          {/* Content */}
          {activeTab === "schedule" && currentSchedule && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">{currentSchedule.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{currentSchedule.description}</p>
              </div>

              <div className="space-y-3">
                {currentSchedule.vaccines.map((vaccine) => (
                  <VaccineCard
                    key={vaccine.id}
                    vaccine={vaccine}
                    record={findRecordForVaccine(vaccine)}
                    onMarkCompleted={
                      findRecordForVaccine(vaccine)
                        ? (id) => markCompleted(id)
                        : undefined
                    }
                    onAddRecord={handleAddFromSchedule}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "records" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold">My Vaccination Records</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  All your tracked vaccination records across age groups.
                </p>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-4">Loading records...</p>
                </div>
              ) : records.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Syringe className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <h3 className="mt-4 font-display text-lg font-semibold">No Records Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Start tracking your vaccinations by adding records from the schedule or using the "Add Record" button.
                    </p>
                    <Button
                      size="sm"
                      className="mt-4 gap-1"
                      onClick={() => setActiveTab("schedule")}
                    >
                      <Syringe className="h-4 w-4" />
                      View Schedule
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {records
                    .sort((a, b) => {
                      const dateA = a.scheduled_date || a.created_at;
                      const dateB = b.scheduled_date || b.created_at;
                      return new Date(dateA).getTime() - new Date(dateB).getTime();
                    })
                    .map((record) => (
                      <Card
                        key={record.id}
                        className={`transition-all ${
                          record.status === "completed"
                            ? "border-success/30 bg-success/5"
                            : record.status === "overdue"
                            ? "border-destructive/30 bg-destructive/5"
                            : ""
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium">{record.vaccine_name}</h4>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {record.scheduled_date && (
                                  <span>
                                    Scheduled:{" "}
                                    {new Date(record.scheduled_date).toLocaleDateString()}
                                  </span>
                                )}
                                {record.date_administered && (
                                  <span className="text-success">
                                    ✓ Given:{" "}
                                    {new Date(record.date_administered).toLocaleDateString()}
                                  </span>
                                )}
                                {record.notes && <span>Note: {record.notes}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {record.status === "scheduled" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markCompleted(record.id)}
                                  className="gap-1 text-success border-success/30 hover:bg-success/10"
                                >
                                  ✓ Done
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteRecord(record.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Vaccinations;
