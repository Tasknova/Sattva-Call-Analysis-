# Deployment Instructions for Logout Time Automation

## Summary
An automated system that updates employee logout times daily at 10 PM IST based on their last call of the day.

## What Was Created

### 1. Edge Function: `update-logout-times`
- **Location**: `supabase/functions/update-logout-times/index.ts`
- **Purpose**: Updates `logout_time` in `employee_daily_productivity` table
- **Schedule**: Runs daily at 10:00 PM IST (4:30 PM UTC)

### 2. Database Function: `get_employee_last_call_times`
- **Purpose**: SQL function to get the last call time for each employee on a given date
- **Already Deployed**: ✅ Migration applied successfully

### 3. Cron Configuration
- **Location**: `supabase/config.toml`
- **Schedule**: `30 16 * * *` (10:00 PM IST)

## Deployment Steps

### Step 1: Deploy the Edge Function
```bash
# Navigate to project root
cd "d:\Tasknova Projects\Sattva (Call Analysis)\Sattva-Call-Analysis-"

# Login to Supabase (if not already logged in)
supabase login

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy update-logout-times
```

### Step 2: Verify Deployment
Check in Supabase Dashboard:
1. Go to Edge Functions
2. Confirm `update-logout-times` is listed
3. Check that cron schedule shows "30 16 * * *"

### Step 3: Test the Function
```bash
# Get your project URL and anon key from Supabase Dashboard
curl -X POST https://rkzebhnxsmsfboyszibm.supabase.co/functions/v1/update-logout-times \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected response:
```json
{
  "success": true,
  "date": "2025-12-05",
  "updated": 6,
  "errors": 0,
  "message": "Updated logout times for 6 employees"
}
```

## How It Works

1. **Daily at 10 PM IST**: Cron triggers the Edge Function
2. **Query Execution**: Function calls `get_employee_last_call_times(today)`
3. **Data Processing**: For each employee with calls today:
   - Finds their last call time
   - Updates `employee_daily_productivity.logout_time`
4. **Logging**: Results logged to Edge Function logs

## Frontend Fix Applied

Fixed the Employee Dashboard to show today's login time:
- Updated `dateFilteredDailyProductivity` useMemo to use date-only comparison
- Changed from "previous business day" logic to actual "today" filtering
- Now properly displays login time when "Today" filter is selected

## Monitoring

### Check Logs
```bash
supabase functions logs update-logout-times
```

### Or in Dashboard
1. Edge Functions → update-logout-times → Logs
2. Look for entries around 10:00 PM IST daily

### Verify Data
```sql
SELECT 
  e.email,
  edp.date,
  edp.login_time,
  edp.logout_time
FROM employee_daily_productivity edp
JOIN employees e ON edp.employee_id = e.id
WHERE edp.date = CURRENT_DATE
ORDER BY e.email;
```

## Troubleshooting

### Function not running?
- Check cron is enabled in Supabase Dashboard
- Verify `config.toml` is deployed with function

### No logout times updated?
- Confirm employees made calls today
- Check function logs for errors
- Verify `get_employee_last_call_times` function exists

### Wrong times?
- Verify timezone: IST = UTC+5:30
- Check `call_history.call_date` has correct timezone
- Ensure cron schedule is `30 16 * * *` (4:30 PM UTC)
