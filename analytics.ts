import express from 'express';
import { query, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
import { redis } from '../config/database';

const router = express.Router();

// Store analytics event
router.post('/events', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { eventName, properties, userId, sessionId } = req.body;

  try {
    // Store in database
    await pool.query(`
      INSERT INTO analytics_events (user_id, event_type, event_data, session_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      userId || null,
      eventName,
      JSON.stringify(properties),
      sessionId,
      req.ip,
      req.get('User-Agent')
    ]);

    // Store in Redis for real-time analytics
    const eventKey = `realtime:events:${Date.now()}`;
    await redis.setex(eventKey, 3600, JSON.stringify({
      eventName,
      properties,
      userId,
      sessionId,
      timestamp: new Date().toISOString()
    }));

    // Update real-time counters
    const today = new Date().toISOString().split('T')[0];
    await redis.incr(`realtime:${eventName}:${today}`);
    await redis.expire(`realtime:${eventName}:${today}`, 86400); // 24 hours

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to store analytics event:', error);
    res.status(500).json({ error: 'Failed to store event' });
  }
}));

// Get real-time metrics
router.get('/realtime', asyncHandler(async (req: express.Request, res: express.Response) => {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    // Get active users (users with events in last 30 minutes)
    const activeUsersResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as active_users
      FROM analytics_events 
      WHERE created_at >= $1 AND user_id IS NOT NULL
    `, [thirtyMinutesAgo]);

    // Get page views
    const pageViewsResult = await pool.query(`
      SELECT COUNT(*) as page_views
      FROM analytics_events 
      WHERE event_type = 'page_view' AND created_at >= $1
    `, [thirtyMinutesAgo]);

    // Get try-ons
    const tryOnsResult = await pool.query(`
      SELECT COUNT(*) as try_ons
      FROM analytics_events 
      WHERE event_type = 'try_on_started' AND created_at >= $1
    `, [thirtyMinutesAgo]);

    // Get conversions
    const conversionsResult = await pool.query(`
      SELECT COUNT(*) as conversions
      FROM analytics_events 
      WHERE event_type = 'conversion' AND created_at >= $1
    `, [thirtyMinutesAgo]);

    // Calculate conversion rate
    const tryOns = parseInt(tryOnsResult.rows[0].try_ons);
    const conversions = parseInt(conversionsResult.rows[0].conversions);
    const conversionRate = tryOns > 0 ? (conversions / tryOns) * 100 : 0;

    // Get top pages
    const topPagesResult = await pool.query(`
      SELECT 
        event_data->>'page_name' as page,
        COUNT(*) as views
      FROM analytics_events 
      WHERE event_type = 'page_view' 
        AND created_at >= $1
        AND event_data->>'page_name' IS NOT NULL
      GROUP BY event_data->>'page_name'
      ORDER BY views DESC
      LIMIT 5
    `, [thirtyMinutesAgo]);

    // Get user flow
    const userFlowResult = await pool.query(`
      SELECT 
        event_type as step,
        COUNT(DISTINCT user_id) as users
      FROM analytics_events 
      WHERE created_at >= $1 
        AND user_id IS NOT NULL
        AND event_type IN ('page_view', 'try_on_started', 'try_on_completed', 'conversion')
      GROUP BY event_type
      ORDER BY 
        CASE event_type
          WHEN 'page_view' THEN 1
          WHEN 'try_on_started' THEN 2
          WHEN 'try_on_completed' THEN 3
          WHEN 'conversion' THEN 4
        END
    `, [thirtyMinutesAgo]);

    // Get recent events for live feed
    const recentEventsResult = await pool.query(`
      SELECT 
        event_type,
        created_at,
        COALESCE(event_data->>'user_name', 'Anonymous') as user_name
      FROM analytics_events 
      WHERE created_at >= $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [thirtyMinutesAgo]);

    // Calculate session metrics
    const sessionMetricsResult = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))) as avg_session_duration,
        COUNT(CASE WHEN event_count = 1 THEN 1 END)::float / COUNT(*)::float * 100 as bounce_rate
      FROM (
        SELECT 
          session_id,
          COUNT(*) as event_count,
          MIN(created_at) as session_start,
          MAX(created_at) as session_end
        FROM analytics_events 
        WHERE created_at >= $1 AND session_id IS NOT NULL
        GROUP BY session_id
      ) sessions
    `, [thirtyMinutesAgo]);

    const metrics = {
      activeUsers: parseInt(activeUsersResult.rows[0].active_users),
      pageViews: parseInt(pageViewsResult.rows[0].page_views),
      tryOns,
      conversions,
      conversionRate,
      avgSessionDuration: parseFloat(sessionMetricsResult.rows[0]?.avg_session_duration || 0),
      bounceRate: parseFloat(sessionMetricsResult.rows[0]?.bounce_rate || 0),
      topPages: topPagesResult.rows.map(row => ({
        page: row.page,
        views: parseInt(row.views)
      })),
      userFlow: userFlowResult.rows.map(row => ({
        step: row.step,
        users: parseInt(row.users),
        dropoff: 0 // Calculate dropoff rate
      })),
      realtimeEvents: recentEventsResult.rows.map(row => ({
        timestamp: row.created_at,
        event: row.event_type,
        user: row.user_name
      }))
    };

    res.json(metrics);
  } catch (error) {
    console.error('Failed to fetch real-time metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}));

// Get analytics dashboard data
router.get('/dashboard', authenticateToken, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('brandId').optional().isUUID()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { startDate, endDate, brandId } = req.query;
  const userBrandId = req.user?.brandId;

  // Determine which brand to analyze
  let targetBrandId = brandId as string;
  if (req.user?.role !== 'admin') {
    targetBrandId = userBrandId || '';
  }

  // Date range setup
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  // Build base conditions
  const conditions = ['ae.created_at >= $1', 'ae.created_at <= $2'];
  const values = [start, end];
  let paramCount = 3;

  if (targetBrandId) {
    conditions.push(`ae.brand_id = $${paramCount++}`);
    values.push(targetBrandId);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Get key metrics
  const metricsResult = await pool.query(`
    SELECT 
      COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) as total_try_ons,
      COUNT(CASE WHEN event_type = 'try_on_converted' THEN 1 END) as total_conversions,
      COUNT(CASE WHEN event_type = 'user_registered' THEN 1 END) as new_users,
      COUNT(CASE WHEN event_type = 'photo_uploaded' THEN 1 END) as photo_uploads,
      ROUND(
        CASE 
          WHEN COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) > 0 
          THEN (COUNT(CASE WHEN event_type = 'try_on_converted' THEN 1 END)::float / 
                COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END)) * 100
          ELSE 0 
        END, 2
      ) as conversion_rate
    FROM analytics_events ae
    ${whereClause}
  `, values);

  const metrics = metricsResult.rows[0];

  // Get daily try-on trends
  const trendsResult = await pool.query(`
    SELECT 
      DATE(ae.created_at) as date,
      COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) as try_ons,
      COUNT(CASE WHEN event_type = 'try_on_converted' THEN 1 END) as conversions
    FROM analytics_events ae
    ${whereClause}
    GROUP BY DATE(ae.created_at)
    ORDER BY date DESC
    LIMIT 30
  `, values);

  // Get top performing clothing categories
  const categoryResult = await pool.query(`
    SELECT 
      ci.category,
      COUNT(ts.id) as try_on_count,
      COUNT(CASE WHEN ts.converted THEN 1 END) as conversion_count,
      ROUND(AVG(ci.price), 2) as avg_price
    FROM try_on_sessions ts
    JOIN LATERAL jsonb_array_elements(ts.clothing_items) as item(value) ON true
    JOIN clothing_items ci ON ci.id = (item.value->>'id')::uuid
    WHERE ts.created_at >= $1 AND ts.created_at <= $2
    ${targetBrandId ? 'AND ci.brand_id = $' + (values.length + 1) : ''}
    GROUP BY ci.category
    ORDER BY try_on_count DESC
    LIMIT 10
  `, targetBrandId ? [...values, targetBrandId] : values);

  // Get user engagement metrics
  const engagementResult = await pool.query(`
    SELECT 
      COUNT(DISTINCT ae.user_id) as active_users,
      ROUND(AVG(session_counts.session_count), 2) as avg_sessions_per_user,
      ROUND(AVG(session_durations.avg_duration), 2) as avg_session_duration
    FROM analytics_events ae
    LEFT JOIN (
      SELECT user_id, COUNT(*) as session_count
      FROM try_on_sessions
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY user_id
    ) session_counts ON ae.user_id = session_counts.user_id
    LEFT JOIN (
      SELECT user_id, AVG(session_duration) as avg_duration
      FROM try_on_sessions
      WHERE created_at >= $1 AND created_at <= $2 AND session_duration IS NOT NULL
      GROUP BY user_id
    ) session_durations ON ae.user_id = session_durations.user_id
    ${whereClause}
  `, values);

  const engagement = engagementResult.rows[0];

  res.json({
    metrics: {
      totalTryOns: parseInt(metrics.total_try_ons),
      totalConversions: parseInt(metrics.total_conversions),
      newUsers: parseInt(metrics.new_users),
      photoUploads: parseInt(metrics.photo_uploads),
      conversionRate: parseFloat(metrics.conversion_rate)
    },
    trends: trendsResult.rows.map(row => ({
      date: row.date,
      tryOns: parseInt(row.try_ons),
      conversions: parseInt(row.conversions)
    })),
    categories: categoryResult.rows.map(row => ({
      category: row.category,
      tryOnCount: parseInt(row.try_on_count),
      conversionCount: parseInt(row.conversion_count),
      avgPrice: parseFloat(row.avg_price)
    })),
    engagement: {
      activeUsers: parseInt(engagement.active_users || 0),
      avgSessionsPerUser: parseFloat(engagement.avg_sessions_per_user || 0),
      avgSessionDuration: parseFloat(engagement.avg_session_duration || 0)
    },
    dateRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  });
}));

// Get conversion funnel data
router.get('/funnel', authenticateToken, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { startDate, endDate } = req.query;
  const userBrandId = req.user?.brandId;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const conditions = ['ae.created_at >= $1', 'ae.created_at <= $2'];
  const values = [start, end];

  if (req.user?.role !== 'admin' && userBrandId) {
    conditions.push('ae.brand_id = $3');
    values.push(userBrandId);
  }

  const funnelResult = await pool.query(`
    SELECT 
      'Photo Upload' as step,
      COUNT(CASE WHEN event_type = 'photo_uploaded' THEN 1 END) as count,
      1 as step_order
    FROM analytics_events ae
    WHERE ${conditions.join(' AND ')}
    
    UNION ALL
    
    SELECT 
      'Try-On Session' as step,
      COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) as count,
      2 as step_order
    FROM analytics_events ae
    WHERE ${conditions.join(' AND ')}
    
    UNION ALL
    
    SELECT 
      'Conversion' as step,
      COUNT(CASE WHEN event_type = 'try_on_converted' THEN 1 END) as count,
      3 as step_order
    FROM analytics_events ae
    WHERE ${conditions.join(' AND ')}
    
    ORDER BY step_order
  `, values);

  res.json({
    funnel: funnelResult.rows.map(row => ({
      step: row.step,
      count: parseInt(row.count),
      stepOrder: row.step_order
    }))
  });
}));

// Get real-time analytics
router.get('/realtime', authenticateToken, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userBrandId = req.user?.brandId;
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const conditions = ['ae.created_at >= $1'];
  const values = [last24Hours];

  if (req.user?.role !== 'admin' && userBrandId) {
    conditions.push('ae.brand_id = $2');
    values.push(userBrandId);
  }

  // Get hourly activity for last 24 hours
  const activityResult = await pool.query(`
    SELECT 
      DATE_TRUNC('hour', ae.created_at) as hour,
      COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) as try_ons,
      COUNT(CASE WHEN event_type = 'user_login' THEN 1 END) as logins,
      COUNT(CASE WHEN event_type = 'photo_uploaded' THEN 1 END) as uploads
    FROM analytics_events ae
    WHERE ${conditions.join(' AND ')}
    GROUP BY DATE_TRUNC('hour', ae.created_at)
    ORDER BY hour DESC
    LIMIT 24
  `, values);

  // Get current active sessions (last 30 minutes)
  const activeSessionsResult = await pool.query(`
    SELECT COUNT(DISTINCT user_id) as active_users
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '30 minutes'
    ${req.user?.role !== 'admin' && userBrandId ? 'AND brand_id = $1' : ''}
  `, req.user?.role !== 'admin' && userBrandId ? [userBrandId] : []);

  res.json({
    activity: activityResult.rows.map(row => ({
      hour: row.hour,
      tryOns: parseInt(row.try_ons),
      logins: parseInt(row.logins),
      uploads: parseInt(row.uploads)
    })),
    activeUsers: parseInt(activeSessionsResult.rows[0].active_users || 0),
    lastUpdated: new Date().toISOString()
  });
}));

// Export analytics data (admin only)
router.get('/export', authenticateToken, requireRole(['admin']), [
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
  query('format').optional().isIn(['json', 'csv'])
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { startDate, endDate, format = 'json' } = req.query;

  const result = await pool.query(`
    SELECT 
      ae.*,
      u.name as user_name,
      u.email as user_email,
      b.name as brand_name
    FROM analytics_events ae
    LEFT JOIN users u ON ae.user_id = u.id
    LEFT JOIN brands b ON ae.brand_id = b.id
    WHERE ae.created_at >= $1 AND ae.created_at <= $2
    ORDER BY ae.created_at DESC
  `, [startDate, endDate]);

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(result.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
    res.send(csv);
  } else {
    res.json({
      data: result.rows,
      exportedAt: new Date().toISOString(),
      totalRecords: result.rows.length
    });
  }
}));

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export default router;
// src/services/analyticsService.ts
import { supabase } from "../supabaseClient";

// ✅ Total try-ons in last 7 days
export async function getWeeklyTryOns() {
  const { data, error } = await supabase
    .from("tryons")
    .select("id, timestamp")
    .gte("timestamp", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;
  return data.length;
}

// ✅ Unique active users in last 7 days
export async function getActiveUsers() {
  const { data, error } = await supabase
    .from("tryons")
    .select("user_id")
    .gte("timestamp", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;
  const uniqueUsers = new Set(data.map((d) => d.user_id));
  return uniqueUsers.size;
}

// ✅ Daily trend of try-ons
export async function getDailyTrends() {
  const { data, error } = await supabase
    .from("tryons")
    .select("timestamp");

  if (error) throw error;

  const trends: Record<string, number> = {};
  data.forEach((row) => {
    const day = new Date(row.timestamp).toISOString().split("T")[0];
    trends[day] = (trends[day] || 0) + 1;
  });

  return Object.entries(trends).map(([date, count]) => ({ date, count }));
}

// ✅ Most popular items
export async function getPopularItems(limit = 5) {
  const { data, error } = await supabase
    .from("tryons")
    .select("item_id");

  if (error) throw error;

  const counts: Record<string, number> = {};
  data.forEach((row) => {
    counts[row.item_id] = (counts[row.item_id] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}
