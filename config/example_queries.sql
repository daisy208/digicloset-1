-- Example SQL queries for analytics
-- 1) Active users last 7 days
SELECT count(DISTINCT user_id) as active_users
FROM events
WHERE timestamp >= now() - interval '7 days';

-- 2) Try-on jobs per hour
SELECT date_trunc('hour', created_at) as hour, count(*) as jobs
FROM tryon_jobs
WHERE created_at >= now() - interval '24 hours'
GROUP BY hour ORDER BY hour;
