import { z } from "zod";

// ─── Shared Helpers ───────────────────────────────────────────

/** Sanitize string input: trim, limit length, strip null bytes */
function sanitizedString(maxLength = 5000) {
  return z
    .string()
    .trim()
    .min(1, "Cannot be empty")
    .max(maxLength, `Must be ${maxLength} characters or less`)
    .refine((val) => !val.includes("\0"), "String contains invalid characters");
}

/** Common optional date string (YYYY-MM-DD) */
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional()
  .nullable();

// ─── Chat Schemas ─────────────────────────────────────────────

export const SendMessageSchema = z.object({
  message: sanitizedString(2000),
});

export const ChatHistoryQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || "50", 10);
      return Math.min(Math.max(num, 1), 200);
    }),
});

// ─── Vaccination Schemas ──────────────────────────────────────

export const VaccinationStatusEnum = z.enum(["completed", "scheduled", "overdue"]);

export const CreateVaccinationSchema = z.object({
  id: z.string().uuid("Invalid ID format").optional(),
  vaccine_name: sanitizedString(255),
  scheduled_date: optionalDate,
  date_administered: optionalDate,
  status: VaccinationStatusEnum.optional().default("scheduled"),
  notes: sanitizedString(1000).optional().nullable(),
});

export const UpdateVaccinationSchema = z.object({
  status: VaccinationStatusEnum.optional(),
  date_administered: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
  notes: sanitizedString(1000).optional().nullable(),
}).refine(
  (data) => data.status !== undefined || data.date_administered !== undefined || data.notes !== undefined,
  "At least one field must be provided for update"
);

export const VaccinationIdParamSchema = z.object({
  id: z.string().min(1, "Record ID is required"),
});

// ─── Patient Account Schemas ─────────────────────────────────

export const PatientSignupSchema = z.object({
  name: sanitizedString(80).refine((v) => v.trim().length >= 2, "Name must be at least 2 characters"),
  phone: sanitizedString(15).refine(
    (v) => /^[0-9+\-\s]{7,15}$/.test(v.trim()),
    "Enter a valid phone number"
  ),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

export const PatientLoginSchema = z.object({
  phone: sanitizedString(15),
  password: z.string().min(1).max(72),
});

// ─── Hospital Record Schemas ─────────────────────────────────

export const CreateHospitalSchema = z.object({
  id: z.string().uuid("Invalid ID format").optional(),
  name: sanitizedString(255),
  city: sanitizedString(120),
  address: sanitizedString(500).optional().nullable(),
  phone: sanitizedString(40).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  services: z.array(sanitizedString(120)).max(30).optional().nullable(),
  avgTreatmentCostInr: z.number().int().min(0).max(100000000).optional().nullable(),
  beds: z.number().int().min(0).max(10000).optional().nullable(),
  annualPatients: z.number().int().min(0).max(100000000).optional().nullable(),
  accreditation: sanitizedString(255).optional().nullable(),
  status: z.enum(["pending_review", "approved", "rejected"]).optional().default("pending_review"),
  source: sanitizedString(60).optional().default("admin_upload"),
  submittedBy: sanitizedString(120).optional().default("admin"),
});

export const HospitalReviewSchema = z.object({
  status: z.enum(["pending_review", "approved", "rejected"]),
  reviewNote: sanitizedString(1000).optional().nullable(),
});

// ─── Patient Record Schemas ──────────────────────────────────

export const CreatePatientSchema = z.object({
  id: z.string().uuid("Invalid ID format").optional(),
  fullName: sanitizedString(120),
  age: z.number().int().min(0).max(130),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .nullable(),
  phone: sanitizedString(40).optional().nullable(),
  conditions: z.array(sanitizedString(200)).max(20).optional().default([]),
  medications: z.array(sanitizedString(200)).max(30).optional().default([]),
  allergies: z.array(sanitizedString(200)).max(20).optional().default([]),
  emergencyContact: sanitizedString(160).optional().nullable(),
  notes: sanitizedString(2000).optional().nullable(),
});

// ─── Middleware ────────────────────────────────────────────────

/**
 * Express middleware that validates req.body against a Zod schema.
 * Returns 400 with structured error details on failure.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Express middleware that validates req.params against a Zod schema.
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({
        error: "Invalid parameters",
        details: errors,
      });
    }
    req.validatedParams = result.data;
    next();
  };
}

/**
 * Express middleware that validates req.query against a Zod schema.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({
        error: "Invalid query parameters",
        details: errors,
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}
