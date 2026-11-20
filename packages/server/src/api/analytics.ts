/**
 * Analytics Routes
 * Dashboard metrics and activity tracking
 */

import { Router, Request, Response } from 'express';
import { getAnalyticsSummary, getActivityTimeline } from '../db/queries.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/analytics/summary
 * Get dashboard summary metrics
 */
router.get('/summary', (req: Request, res: Response) => {
  try {
    const summary = getAnalyticsSummary();

    res.json({
      success: true,
      data: {
        total_leads: summary.total_leads,
        new_leads: summary.new_leads,
        stale_leads: summary.stale_leads,
        contacted_leads: summary.contacted_leads,
        recovered_leads: summary.recovered_leads,
        declined_leads: summary.declined_leads,
        opted_out_leads: summary.opted_out_leads,
        total_revenue_at_risk: summary.total_revenue_at_risk,
        total_recovered_revenue: summary.total_recovered_revenue,
        recovery_rate_percent: summary.recovery_rate_percent,
        pending_approvals: summary.pending_approvals,
      },
    });
  } catch (error: any) {
    logger.error('GET /api/analytics/summary failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics summary',
      message: error.message,
    });
  }
});

/**
 * GET /api/analytics/timeline
 * Get activity timeline (last N days)
 */
router.get('/timeline', (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter. Must be between 1 and 365.',
      });
    }

    const timeline = getActivityTimeline(days);

    res.json({
      success: true,
      data: {
        timeline,
        days,
        count: timeline.length,
      },
    });
  } catch (error: any) {
    logger.error('GET /api/analytics/timeline failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity timeline',
      message: error.message,
    });
  }
});

export default router;
