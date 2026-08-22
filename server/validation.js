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
