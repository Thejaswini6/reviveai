/**
 * Lead Management Routes
 * CRUD operations and lead-specific endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  getLeads,
  getLeadWithHistory,
  updateLead,
  getLeadById,
  optOutLead,
  getStaleLeads,
  getLeadsEligibleForAnalysis,
  isLeadEligibleForAnalysis,
  markLeadsAsStale,
} from '../db/queries.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/leads
 * List all leads with optional filters and pagination
 */
router.get('/leads', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const contact_consent = req.query.contact_consent as string | undefined;
    const payment_status = req.query.payment_status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const sort_by = (req.query.sort_by as string) || 'received_at DESC';

    const { leads, total } = getLeads({
      status,
      contact_consent,
      payment_status,
      limit,
      offset,
      sort_by,
    });

    res.json({
      success: true,
      data: {
        leads,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('GET /api/leads failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads',
      message: error.message,
    });
  }
});

/**
 * GET /api/leads/:id
 * Get lead detail with full interaction history
 */
router.get('/leads/:id', (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    const { lead, interactions, emails, outcomes } = getLeadWithHistory(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    // Check eligibility for analysis
    const { eligible, reason } = isLeadEligibleForAnalysis(leadId);

    res.json({
      success: true,
      data: {
        lead,
        interactions,
        emails,
        outcomes,
        analysis_eligible: {
          eligible,
          reason,
        },
      },
    });
  } catch (error: any) {
    logger.error('GET /api/leads/:id failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/leads/:id
 * Update lead (status, notes, etc.)
 */
router.patch('/leads/:id', (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    // Validate update payload
    const updateSchema = z.object({
      status: z.string().optional(),
      notes: z.string().optional(),
    });

    const { success, data, error } = updateSchema.safeParse(req.body);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.errors,
      });
    }

    const updated = updateLead(leadId, data as any);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    logger.error('PATCH /api/leads/:id failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead',
      message: error.message,
    });
  }
});

/**
 * POST /api/leads/:id/opt-out
 * Mark lead as opted out
 */
router.post('/leads/:id/opt-out', (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    const lead = getLeadById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    const updated = optOutLead(leadId);

    logger.info(`Lead ${leadId} opted out`);

    res.json({
      success: true,
      message: 'Lead marked as opted out',
      data: updated,
    });
  } catch (error: any) {
    logger.error('POST /api/leads/:id/opt-out failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to opt out lead',
      message: error.message,
    });
  }
});

/**
 * INTERNAL: GET /api/internal/leads/stale
 * Get all stale leads (for monitoring/testing)
 */
router.get('/internal/leads/stale', (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 3;
    const staleLeads = getStaleLeads(threshold);

    res.json({
      success: true,
      data: {
        stale_leads: staleLeads,
        count: staleLeads.length,
        threshold_days: threshold,
      },
    });
  } catch (error: any) {
    logger.error('GET /api/internal/leads/stale failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stale leads',
      message: error.message,
    });
  }
});

/**
 * INTERNAL: GET /api/internal/leads/eligible-for-analysis
 * Get leads eligible for Claude analysis
 */
router.get('/internal/leads/eligible-for-analysis', (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 3;
    const eligibleLeads = getLeadsEligibleForAnalysis(threshold);

    res.json({
      success: true,
      data: {
        eligible_leads: eligibleLeads,
        count: eligibleLeads.length,
        threshold_days: threshold,
      },
    });
  } catch (error: any) {
    logger.error('GET /api/internal/leads/eligible-for-analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eligible leads',
      message: error.message,
    });
  }
});

/**
 * INTERNAL: POST /api/internal/leads/mark-stale
 * Mark stale leads as STALE status
 */
router.post('/internal/leads/mark-stale', (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.body.threshold as string) || 3;
    const changedCount = markLeadsAsStale(threshold);

    logger.info(`Marked ${changedCount} leads as stale`);

    res.json({
      success: true,
      message: `Marked ${changedCount} leads as stale`,
      data: { changed: changedCount },
    });
  } catch (error: any) {
    logger.error('POST /api/internal/leads/mark-stale failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark stale leads',
      message: error.message,
    });
  }
});

export default router;
