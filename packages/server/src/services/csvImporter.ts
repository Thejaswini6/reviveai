/**
 * CSV Import Service
 * Handles parsing, validation, duplicate detection, and error reporting
 */

import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { z } from 'zod';
import { CsvLead } from '../types/index.js';

// Zod validation schema for CSV rows
const CsvLeadSchema = z.object({
  lead_id: z.string().regex(/^RV-\d{4}$/, 'Invalid lead_id format. Expected RV-NNNN'),
  business_name: z.string().min(1, 'business_name cannot be empty').max(100),
  customer_name: z.string().min(1, 'customer_name cannot be empty').max(100),
  customer_email: z.string().email('Invalid customer_email format'),
  customer_phone: z.string().regex(/^\+91-\d{5}-\d{5}$/, 'Invalid phone format. Expected +91-XXXXX-NNNNN'),
  service_type: z.enum(['AC repair', 'AC servicing', 'AC installation'], {
    errorMap: () => ({ message: 'Invalid service_type. Must be: AC repair, AC servicing, or AC installation' }),
  }),
  enquiry_text: z.string().min(1, 'enquiry_text cannot be empty').max(500),
  estimated_value_inr: z
    .string()
    .transform((v) => {
      const num = parseFloat(v);
      if (isNaN(num)) throw new Error('Must be a valid number');
      return num;
    })
    .refine((v) => v > 0 && v <= 100000, 'estimated_value_inr must be between 0 and 100000'),
  lead_status: z.enum(['NEW', 'QUOTE_SENT', 'BOOKING_PENDING', 'CALLBACK_REQUESTED', 'DECLINED', 'CONVERTED', 'OPTED_OUT'], {
    errorMap: () => ({
      message: 'Invalid lead_status. Must be: NEW, QUOTE_SENT, BOOKING_PENDING, CALLBACK_REQUESTED, DECLINED, CONVERTED, or OPTED_OUT',
    }),
  }),
  created_at: z
    .string()
    .transform((v) => {
      const date = new Date(v);
      if (isNaN(date.getTime())) throw new Error('Invalid date format');
      return date.toISOString();
    }),
  last_contacted_at: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === '') return undefined;
      const date = new Date(v);
      if (isNaN(date.getTime())) throw new Error('Invalid date format');
      return date.toISOString();
    }),
  quote_sent_at: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === '') return undefined;
      const date = new Date(v);
      if (isNaN(date.getTime())) throw new Error('Invalid date format');
      return date.toISOString();
    }),
  follow_up_count: z
    .string()
    .transform((v) => {
      const num = parseInt(v, 10);
      if (isNaN(num)) throw new Error('Must be a valid integer');
      return num;
    })
    .refine((v) => v >= 0 && v <= 100, 'follow_up_count must be between 0 and 100'),
  contact_consent: z.enum(['CONSENTED', 'OPTED_OUT'], {
    errorMap: () => ({ message: 'Invalid contact_consent. Must be: CONSENTED or OPTED_OUT' }),
  }),
  preferred_channel: z.enum(['email', 'phone'], {
    errorMap: () => ({ message: 'Invalid preferred_channel. Must be: email or phone' }),
  }),
  booking_status: z.enum(['NOT_BOOKED', 'PENDING', 'CONFIRMED'], {
    errorMap: () => ({ message: 'Invalid booking_status. Must be: NOT_BOOKED, PENDING, or CONFIRMED' }),
  }),
  payment_status: z.enum(['NOT_PAID', 'PAID'], {
    errorMap: () => ({ message: 'Invalid payment_status. Must be: NOT_PAID or PAID' }),
  }),
  source: z.enum(['WEBSITE', 'PHONE', 'REFERRAL'], {
    errorMap: () => ({ message: 'Invalid source. Must be: WEBSITE, PHONE, or REFERRAL' }),
  }),
  interaction_history: z.string().min(1, 'interaction_history cannot be empty').max(500),
  duplicate_of_lead_id: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v.trim() === '') return undefined;
      if (!v.match(/^RV-\d{4}$/)) throw new Error('Invalid duplicate_of_lead_id format');
      return v;
    }),
});

export interface ImportResult {
  total_records: number;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    lead_id: string;
    error: string;
    suggestion: string;
  }>;
  duplicates_found: Array<{
    lead_id: string;
    duplicate_of: string;
    action: string;
  }>;
  warnings: string[];
}

export class CsvImporter {
  private leads: CsvLead[] = [];
  private errors: ImportResult['errors'] = [];
  private duplicates: ImportResult['duplicates_found'] = [];
  private warnings: string[] = [];

  async importFile(filePath: string): Promise<ImportResult> {
    this.leads = [];
    this.errors = [];
    this.duplicates = [];
    this.warnings = [];

    return new Promise((resolve, reject) => {
      const records: any[] = [];
      let rowNumber = 1;

      const parser = parse({
        columns: true,
        skip_empty_lines: true,
      });

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          rowNumber++;
          const result = CsvLeadSchema.safeParse(record);

          if (!result.success) {
            this.errors.push({
              row: rowNumber,
              lead_id: record.lead_id || 'UNKNOWN',
              error: result.error.errors.map((e) => e.message).join('; '),
              suggestion: 'Check the column values match the data dictionary requirements.',
            });
            continue;
          }

          records.push(result.data);
        }
      });

      parser.on('error', (err) => {
        reject(new Error(`CSV parsing error: ${err.message}`));
      });

      parser.on('end', () => {
        // Validate business rules and detect duplicates
        this.validateBusinessRules(records);
        this.detectDuplicates(records);

        const imported = records.filter((r) => !this.errors.some((e) => e.lead_id === r.lead_id)).length;

        resolve({
          total_records: rowNumber - 1,
          imported,
          skipped: this.errors.length,
          errors: this.errors,
          duplicates_found: this.duplicates,
          warnings: this.warnings,
        });
      });

      createReadStream(filePath).pipe(parser);
    });
  }

  private validateBusinessRules(records: any[]): void {
    for (const record of records) {
      // Rule 1: If payment_status = PAID, then lead_status should be CONVERTED
      if (record.payment_status === 'PAID' && record.lead_status !== 'CONVERTED') {
        this.warnings.push(`Lead ${record.lead_id}: payment_status=PAID but lead_status=${record.lead_status}. Expected CONVERTED.`);
      }

      // Rule 2: Check date logic
      if (record.last_contacted_at && new Date(record.last_contacted_at) < new Date(record.created_at)) {
        this.errors.push({
          row: -1,
          lead_id: record.lead_id,
          error: 'last_contacted_at cannot be before created_at',
          suggestion: 'Fix the date ordering in the CSV.',
        });
      }

      // Rule 3: If duplicate_of_lead_id is set, it must reference a valid lead
      if (record.duplicate_of_lead_id) {
        const parentExists = records.some((r) => r.lead_id === record.duplicate_of_lead_id);
        if (!parentExists) {
          this.warnings.push(`Lead ${record.lead_id}: duplicate_of_lead_id references non-existent lead ${record.duplicate_of_lead_id}.`);
        }
      }
    }
  }

  private detectDuplicates(records: any[]): void {
    const seen = new Map<string, any>();

    for (const record of records) {
      // Skip if already marked as duplicate in CSV
      if (record.duplicate_of_lead_id) {
        this.duplicates.push({
          lead_id: record.lead_id,
          duplicate_of: record.duplicate_of_lead_id,
          action: 'skipped (marked as duplicate in CSV)',
        });
        continue;
      }

      // Check for duplicate based on email + service_type + date proximity
      const key = `${record.customer_email}-${record.service_type}`;

      if (seen.has(key)) {
        const existing = seen.get(key);
        const daysDiff = Math.abs(new Date(existing.created_at).getTime() - new Date(record.created_at).getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff <= 7) {
          this.duplicates.push({
            lead_id: record.lead_id,
            duplicate_of: existing.lead_id,
            action: 'detected (same email + service within 7 days)',
          });
          continue;
        }
      }

      seen.set(key, record);
    }
  }

  getValidLeads(): CsvLead[] {
    return this.leads;
  }
}
