import { useState, useEffect, useCallback } from "react";
import {
  fetchVaccinations,
  createVaccination,
  updateVaccination,
  deleteVaccination,
  type VaccinationRecord,
} from "@/lib/api";

export type { VaccinationRecord };

export function useVaccinations() {
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all records from MySQL via API
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchVaccinations();
      setRecords(data);
    } catch (err: unknown) {
      console.error("Error fetching vaccinations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch records");
      // Graceful fallback to empty list
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new record
  const addRecord = useCallback(
    async (record: {
      vaccine_name: string;
      scheduled_date?: string;
      date_administered?: string;
      status?: "completed" | "scheduled" | "overdue";
      notes?: string;
    }) => {
      setError(null);

      try {
        const newRecord = await createVaccination({
          id: crypto.randomUUID(),
          vaccine_name: record.vaccine_name,
          scheduled_date: record.scheduled_date,
          date_administered: record.date_administered,
          status: record.status || "scheduled",
          notes: record.notes,
        });

        setRecords((prev) => [...prev, newRecord]);
        return newRecord;
      } catch (err: unknown) {
        console.error("Error adding vaccination record:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    []
  );

  // Update a record
  const updateRecord = useCallback(
    async (
      id: string,
      updates: {
        status?: "completed" | "scheduled" | "overdue";
        date_administered?: string;
        notes?: string;
      }
    ) => {
      setError(null);

      try {
        const updated = await updateVaccination(id, updates);
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? updated : r))
        );
      } catch (err: unknown) {
        console.error("Error updating vaccination record:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      }
    },
    []
  );

  // Delete a record
  const deleteRecord = useCallback(async (id: string) => {
    setError(null);

    try {
      await deleteVaccination(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      console.error("Error deleting vaccination record:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  }, []);

  // Mark a vaccine as completed
  const markCompleted = useCallback(
    async (id: string) => {
      return updateRecord(id, {
        status: "completed",
        date_administered: new Date().toISOString().split("T")[0],
      });
    },
    [updateRecord]
  );

  // Load records on mount
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    isLoading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    markCompleted,
    refetch: fetchRecords,
  };
}
