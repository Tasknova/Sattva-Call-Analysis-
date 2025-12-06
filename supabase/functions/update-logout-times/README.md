# Update Logout Times Edge Function

This Edge Function automatically updates the logout time for employees in the `employee_daily_productivity` table based on their last call of the day.

## How it works

1. **Scheduled Execution**: Runs daily at 10:00 PM IST (4:30 PM UTC)
2. **Data Collection**: Queries the `call_history` table to find the last call made by each employee on the current date
3. **Update Logic**: Updates the `logout_time` field in `employee_daily_productivity` table with the time of the last call

## Database Function

The function uses a PostgreSQL function `get_employee_last_call_times(target_date)` that:
- Takes a date parameter
- Returns employee_id and their last call time for that date
- Groups calls by employee and finds MAX(call_date)

## Deployment

### Deploy the Edge Function
```bash
supabase functions deploy update-logout-times
```

### Set up Environment Variables
The function uses these environment variables (automatically available in Supabase):
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

### Enable Cron Job
The cron schedule is defined in `supabase/config.toml`:
```toml
[functions.update-logout-times.cron]
schedule = "30 16 * * *"  # 10:00 PM IST
```

## Manual Invocation

You can manually trigger the function:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/update-logout-times \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring

Check the Edge Function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select `update-logout-times`
3. View Logs tab

## Schema

### Input
None (uses current date automatically)

### Output
```json
{
  "success": true,
  "date": "2025-12-05",
  "updated": 6,
  "errors": 0,
  "message": "Updated logout times for 6 employees"
}
```
