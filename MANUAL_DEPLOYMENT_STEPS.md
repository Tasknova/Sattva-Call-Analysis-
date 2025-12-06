# Manual Deployment Steps for Logout Time Automation

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Project Reference: `rkzebhnxsmsfboyszibm`
- Terminal with PowerShell

---

## Step 1: Login to Supabase CLI

Open PowerShell and run:

```powershell
supabase login
```

This will open a browser window. Login with your Supabase account credentials.

---

## Step 2: Link Your Project

```powershell
cd "d:\Tasknova Projects\Sattva (Call Analysis)\Sattva-Call-Analysis-"
supabase link --project-ref rkzebhnxsmsfboyszibm
```

If asked for the database password, enter your Supabase database password.

---

## Step 3: Verify Database Function Exists

Go to **Supabase Dashboard** → **SQL Editor** and run this query to check if the function exists:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_employee_last_call_times';
```

**If it returns a row**: ✅ Function exists, skip to Step 4

**If it returns empty**: Run this SQL to create the function:

```sql
CREATE OR REPLACE FUNCTION get_employee_last_call_times(target_date DATE)
RETURNS TABLE (
  employee_id UUID,
  last_call_time TIMESTAMPTZ
) 
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ch.employee_id,
    MAX(ch.call_date) as last_call_time
  FROM call_history ch
  WHERE DATE(ch.call_date) = target_date
  GROUP BY ch.employee_id
$$;
```

---

## Step 4: Deploy the Edge Function

In PowerShell, run:

```powershell
cd "d:\Tasknova Projects\Sattva (Call Analysis)\Sattva-Call-Analysis-"
supabase functions deploy update-logout-times --project-ref rkzebhnxsmsfboyszibm --no-verify-jwt
```

**Expected Output:**
```
Deploying update-logout-times (project ref: rkzebhnxsmsfboyszibm)
✓ Deployed function update-logout-times
```

---

## Step 5: Set Up Cron Schedule in Supabase Dashboard

### 5a. Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: **rkzebhnxsmsfboyszibm**
3. Click **Edge Functions** in the left sidebar

### 5b. Configure Cron Schedule
1. Find **update-logout-times** in the list
2. Click on it to open details
3. Look for **"Cron Jobs"** or **"Schedule"** section
4. Click **"Add Schedule"** or **"Enable Cron"**
5. Enter the cron expression: `30 16 * * *`
6. **Description**: "Update logout times daily at 10 PM IST"
7. Click **Save**

**Cron Breakdown:**
- `30 16 * * *` = Every day at 16:30 UTC (4:30 PM UTC)
- This equals 10:00 PM IST (UTC+5:30)

---

## Step 6: Test the Function Manually

### Get Your Anon Key
1. In Supabase Dashboard → **Settings** → **API**
2. Copy the **anon public** key

### Test via PowerShell

Replace `YOUR_ANON_KEY` with the key you copied:

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_ANON_KEY"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://rkzebhnxsmsfboyszibm.supabase.co/functions/v1/update-logout-times" -Method POST -Headers $headers
```

**Expected Response:**
```json
{
  "success": true,
  "date": "2025-12-05",
  "updated": 6,
  "errors": 0,
  "message": "Updated logout times for 6 employees"
}
```

---

## Step 7: Verify Data Was Updated

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
SELECT 
  e.email,
  e.full_name,
  edp.date,
  edp.login_time,
  edp.logout_time,
  edp.updated_at
FROM employee_daily_productivity edp
JOIN employees e ON edp.employee_id = e.id
WHERE edp.date = CURRENT_DATE
ORDER BY e.email;
```

You should see `logout_time` populated for employees who made calls today.

---

## Step 8: Monitor Function Logs

### Via CLI:
```powershell
supabase functions logs update-logout-times --project-ref rkzebhnxsmsfboyszibm
```

### Via Dashboard:
1. **Edge Functions** → **update-logout-times**
2. Click **"Logs"** tab
3. Check for daily execution logs around 10:00 PM IST

---

## Troubleshooting

### Issue: "Function not found" error
**Solution:** Re-run Step 4 to deploy the function

### Issue: "get_employee_last_call_times does not exist"
**Solution:** Run the SQL from Step 3 to create the database function

### Issue: Cron not running
**Check:**
1. Cron is enabled in Supabase Dashboard
2. Schedule is set to `30 16 * * *`
3. Function has proper permissions

### Issue: No logout times updated
**Check:**
1. Employees made calls today (run query in Step 7 without the logout_time column)
2. `call_history` table has data with today's date
3. Function logs for error messages (Step 8)

### Issue: Wrong timezone
**Verify:**
- Cron schedule is `30 16 * * *` (4:30 PM UTC = 10:00 PM IST)
- `call_date` in `call_history` uses correct timezone

---

## Quick Reference Commands

```powershell
# Deploy function
supabase functions deploy update-logout-times --project-ref rkzebhnxsmsfboyszibm --no-verify-jwt

# View logs
supabase functions logs update-logout-times --project-ref rkzebhnxsmsfboyszibm

# Test function
$headers = @{"Authorization" = "Bearer YOUR_ANON_KEY"}
Invoke-RestMethod -Uri "https://rkzebhnxsmsfboyszibm.supabase.co/functions/v1/update-logout-times" -Method POST -Headers $headers
```

---

## What Happens Automatically Now

✅ **Every day at 10:00 PM IST**:
1. Cron triggers the `update-logout-times` function
2. Function queries last call time for each employee today
3. Updates `logout_time` in `employee_daily_productivity` table
4. Logs results to Edge Function logs

✅ **Employee Dashboard**:
- Shows today's login time when "Today" filter is selected
- Displays logout time once updated by the function

---

## Success Checklist

- [ ] Supabase CLI logged in
- [ ] Project linked
- [ ] Database function `get_employee_last_call_times` exists
- [ ] Edge function deployed successfully
- [ ] Cron schedule set to `30 16 * * *` in dashboard
- [ ] Manual test successful (returns success response)
- [ ] Data verified in `employee_daily_productivity` table
- [ ] Function logs accessible

---

## Need Help?

Check the function logs first:
```powershell
supabase functions logs update-logout-times --project-ref rkzebhnxsmsfboyszibm --tail
```

This will show real-time logs to help diagnose any issues.
